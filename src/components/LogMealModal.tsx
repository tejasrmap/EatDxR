import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Star, Upload, Image as ImageIcon, Search, MapPin, Loader2, Plus, Trash2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../App";
import { db, handleFirestoreError, OperationType, storage } from "../firebase";
import { collection, doc, setDoc, updateDoc, serverTimestamp, getDoc, increment } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { searchRestaurants } from "../services/mapsService";
import { RestaurantSearchResult, Review } from "../types";

const logSchema = z.object({
  restaurant: z.string().min(1, "Restaurant is required"),
  dishes: z.array(z.object({
    name: z.string().min(1, "Dish name is required"),
    image: z.string().optional(),
    rating: z.number().min(1).max(5)
  })).min(1, "At least one dish is required"),
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
  videoUrl: z.string().optional()
});

type LogFormValues = z.infer<typeof logSchema>;

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingReview?: Review;
  initialRestaurant?: RestaurantSearchResult;
}

export function LogMealModal({ isOpen, onClose, existingReview, initialRestaurant }: LogMealModalProps) {
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RestaurantSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState("");
  const [activeDishId, setActiveDishId] = useState<string | null>(null);
  const [dishFiles, setDishFiles] = useState<Map<string, File>>(new Map());
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, dishdUser } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, setValue, reset, control, watch } = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      rating: 0,
      dishes: [{ name: "", image: "", rating: 5 }]
    }
  });

  const watchDishes = watch("dishes");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "dishes"
  });

  // Pre-fill fields if we are in Edit Mode
  useEffect(() => {
    if (isOpen && existingReview) {
      setRating(existingReview.rating || 0);
      setSearchQuery(existingReview.restaurantName || "");
      setSelectedRestaurant({
        id: existingReview.restaurantId,
        name: existingReview.restaurantName,
        cuisine: "Unknown",
        location: existingReview.restaurantLocation || "Unknown"
      });
      setManualLocation(existingReview.restaurantLocation || "");
      reset({
        restaurant: existingReview.restaurantName,
        rating: existingReview.rating,
        review: existingReview.content || "",
        dishes: existingReview.dishes.length > 0 
          ? existingReview.dishes.map(d => ({ ...d, rating: d.rating || 5 })) 
          : [{ name: "", image: "", rating: 5 }]
      });
    } else if (isOpen && initialRestaurant) {
      setRating(initialRestaurant.rating || 0);
      setSearchQuery(initialRestaurant.name);
      setManualLocation(initialRestaurant.location || "");
      setSelectedRestaurant(initialRestaurant);
      setValue("restaurant", initialRestaurant.name);
      setValue("rating", initialRestaurant.rating || 0);
      reset({
        restaurant: initialRestaurant.name,
        rating: initialRestaurant.rating || 5,
        dishes: [{ name: "", image: "", rating: 5 }],
        review: ""
      });
    } else if (isOpen && !existingReview) {
      reset({ rating: 0, dishes: [{ name: "", image: "", rating: 5 }], restaurant: "", review: "" });
      setRating(0);
      setSearchQuery("");
      setManualLocation("");
      setSelectedRestaurant(null);
    }
  }, [isOpen, existingReview, initialRestaurant, reset, setValue]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });
          
          try {
            const { getCurrentCity } = await import("../services/mapsService");
            const city = await getCurrentCity(lat, lng);
            if (city) setCurrentCity(city);
          } catch (err) {
            console.warn("Failed to get city:", err);
          }
        },
        (err) => console.warn("Geolocation error:", err)
      );
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setValue("restaurant", query);
    setSelectedRestaurant(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length >= 1) {
      setIsSearching(true);
      setShowResults(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchRestaurants(query.trim(), userLocation?.lat, userLocation?.lng);
        setSearchResults(results);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
    }
  };

  const handleSelectRestaurant = (restaurant: RestaurantSearchResult) => {
    setSelectedRestaurant(restaurant);
    setSearchQuery(restaurant.name);
    setValue("restaurant", restaurant.name);
    setManualLocation(restaurant.location);
    setShowResults(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeDishId === null) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large. Please select an image under 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const currentIndex = fields.findIndex(f => f.id === activeDishId);
    if (currentIndex === -1) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setValue(`dishes.${currentIndex}.image`, base64String);
      
      setDishFiles(prev => {
        const next = new Map(prev);
        next.set(activeDishId, file);
        return next;
      });

      setActiveDishId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Video too large. Please select a video under 20MB.");
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const uploadFileWithProgress = (file: File, path: string, onProgress?: (bytes: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          if (onProgress) onProgress(snapshot.bytesTransferred);
        }, 
        (error: any) => {
           console.error("Upload failed", error);
           toast.error(`Upload Failed: ${error.code || error.message}`);
           setIsUploading(false);
           setUploadProgress(0);
           reject(error);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const onSubmit = async (data: LogFormValues) => {
    if (!user) {
      toast.error("You must be signed in to log a meal.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const filesToUpload: { file: File, path: string, fieldIndex: number }[] = [];
      
      if (videoFile) {
        filesToUpload.push({ file: videoFile, path: `videos/${user.uid}_${Date.now()}.mp4`, fieldIndex: -1 });
      }

      fields.forEach((field, i) => {
        const dishFile = dishFiles.get(field.id);
        if (dishFile) {
          const ext = dishFile.name.split('.').pop();
          filesToUpload.push({ file: dishFile, path: `dishes/${user.uid}_${Date.now()}_${i}.${ext}`, fieldIndex: i });
        }
      });

      const totalBytes = filesToUpload.reduce((sum, f) => sum + f.file.size, 0);
      const transferredMap = new Map<string, number>();

      const updateOmniProgress = () => {
        const sumTransferred = Array.from(transferredMap.values()).reduce((sum, v) => sum + v, 0);
        if (totalBytes > 0) {
          setUploadProgress(Math.round((sumTransferred / totalBytes) * 100));
        }
      };

      const uploadedDishes = [...data.dishes];
      let finalVideoUrl = "";

      for (const task of filesToUpload) {
        const downloadUrl = await uploadFileWithProgress(task.file, task.path, (bytes) => {
          transferredMap.set(task.path, bytes);
          updateOmniProgress();
        });

        if (task.fieldIndex === -1) {
          finalVideoUrl = downloadUrl;
        } else {
          uploadedDishes[task.fieldIndex].image = downloadUrl;
        }
      }

      let restaurantId = selectedRestaurant?.id || `manual_${Date.now()}`;
      
      if (selectedRestaurant) {
        const restRef = doc(db, "restaurants", selectedRestaurant.id);
        const restDoc = await getDoc(restRef);
        if (!restDoc.exists()) {
          await setDoc(restRef, {
            id: selectedRestaurant.id,
            name: selectedRestaurant.name,
            cuisine: selectedRestaurant.cuisine || "Various",
            location: manualLocation || selectedRestaurant.location || "India",
            rating: selectedRestaurant.rating || 0,
            reviewCount: selectedRestaurant.reviewCount || 1,
            image: selectedRestaurant.image || "",
            menuItems: selectedRestaurant.menuItems || []
          });
        }
      }

      if (existingReview) {
        // Update Document Mode
        const reviewRef = doc(db, "reviews", existingReview.id);
        await updateDoc(reviewRef, {
          restaurantName: data.restaurant,
          restaurantId: restaurantId,
          dishes: uploadedDishes,
          rating: data.rating,
          content: data.review || "",
          videoUrl: finalVideoUrl || existingReview.videoUrl || ""
        });
        toast.success("Meal updated successfully!");
      } else {
        // Create Document Mode
        const reviewRef = doc(collection(db, "reviews"));
        
        // Extract city from selected restaurant or try to parse from manual location
        const city = selectedRestaurant?.city || manualLocation.split(',').pop()?.trim() || "Nearby";

        const reviewData = {
          id: reviewRef.id,
          userId: user.uid,
          userName: dishdUser?.displayName || user.displayName || "Anonymous Critic",
          userPhoto: dishdUser?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${dishdUser?.displayName || user.displayName || 'User'}&background=random`,
          restaurantName: data.restaurant,
          restaurantId: restaurantId,
          restaurantLocation: manualLocation,
          city: city,
          dishes: uploadedDishes,
          rating: data.rating,
          content: data.review || "",
          videoUrl: finalVideoUrl,
          createdAt: serverTimestamp(),
          likes: 0
        };

        await setDoc(reviewRef, reviewData);
        
        // Increment the user's reviewsWritten stat for the leaderboard natively
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          "stats.reviewsWritten": increment(1)
        });

        toast.success("Meal logged successfully!");
      }

      reset();
      setRating(0);
      setSearchQuery("");
      setManualLocation("");
      setSelectedRestaurant(null);
      setVideoFile(null);
      setDishFiles(new Map());
      setVideoPreview(null);
      setIsUploading(false);
      setUploadProgress(0);
      onClose();
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Process failed. Check connection.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleSetRating = (val: number) => {
    setRating(val);
    setValue("rating", val);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full md:max-w-lg bg-zinc-900 border border-white/10 rounded-t-[3rem] md:rounded-2xl overflow-hidden shadow-2xl h-[92vh] md:h-auto md:max-h-[85vh] flex flex-col mt-auto md:mt-0"
          >
            {/* Grab Handle for Mobile */}
            <div className="w-12 h-1 h-1.5 bg-white/10 rounded-full mx-auto mt-4 md:hidden shrink-0" />

            <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-semibold serif italic">{existingReview ? "Edit Meal" : "Log a Meal"}</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 pb-32 md:pb-6 space-y-6 overflow-y-auto">
              {/* Cinematic Video Upload for Reels */}
              <div className="space-y-4">
                  <label className="small-caps text-orange-500">Cinematic Reel (Optional)</label>
                  <div 
                    onClick={() => videoInputRef.current?.click()}
                    className="aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden group relative"
                  >
                    {videoPreview ? (
                        <>
                            <video src={videoPreview} className="w-full h-full object-cover" muted loop autoPlay />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={32} className="text-white" />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-all">
                            <Upload size={32} />
                            <p className="text-[10px] uppercase font-black tracking-widest">Capture Video Reel</p>
                        </div>
                    )}
                  </div>
                  <input type="file" ref={videoInputRef} onChange={handleVideoChange} accept="video/*" className="hidden" />
              </div>

              <div className="space-y-2 relative">
                <label className="small-caps">Restaurant</label>
                <div className="relative">
                  <input 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={currentCity ? `Search for a food place in ${currentCity}...` : "Search for a food place in India..."}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 ring-white/20 transition-all"
                    disabled={isSubmitting}
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />}
                </div>
                
                <AnimatePresence>
                  {showResults && (searchResults.length > 0 || isSearching) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 left-0 right-0 mt-1 bg-zinc-800 border border-white/10 rounded-lg shadow-xl overflow-hidden"
                    >
                      {isSearching ? (
                        <div className="p-4 text-center text-sm text-white/40 italic">Searching Google Maps...</div>
                      ) : (
                        searchResults.map((result) => (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => handleSelectRestaurant(result)}
                            className="w-full text-left p-3 hover:bg-white/5 flex items-start gap-3 transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/10">
                              <img 
                                src={result.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=100&q=80`} 
                                alt={result.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{result.name}</p>
                              <p className="text-xs text-white/40">{result.location} • {result.cuisine}</p>
                              {result.menuItems && result.menuItems.length > 0 && (
                                <p className="text-[10px] text-white/20 italic mt-0.5">
                                  Popular: {result.menuItems.join(", ")}
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {errors.restaurant && <p className="text-xs text-red-500">{errors.restaurant.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="small-caps">Location / Area</label>
                <div className="relative">
                  <input 
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g. Indiranagar, Bangalore"
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 ring-white/20 transition-all"
                    disabled={isSubmitting}
                  />
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                </div>
                <p className="text-[10px] text-white/20">Auto-filled from search, but you can refine it.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="small-caps">Dishes</label>
                  <button
                    type="button"
                    onClick={() => append({ name: "", rating: 5 })}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    <Plus size={12} />
                    Add Dish
                  </button>
                </div>
                
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="flex gap-3">
                        <div 
                          onClick={() => {
                            setActiveDishId(field.id);
                            fileInputRef.current?.click();
                          }}
                          className="w-16 h-16 bg-white/5 border border-dashed border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all shrink-0 overflow-hidden group"
                        >
                          {watchDishes[index]?.image ? (
                            <img src={watchDishes[index].image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
                          )}
                        </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-3">
                                    <input 
                                    {...register(`dishes.${index}.name` as const)}
                                    placeholder="What did you have?"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-orange-500/50 transition-all"
                                    disabled={isSubmitting}
                                    />
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-white/30">Rate this item</label>
                                        <div className="flex gap-1.5">
                                            {[1,2,3,4,5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className="hover:scale-110 active:scale-90 transition-transform"
                                                    onClick={() => setValue(`dishes.${index}.rating`, star)}
                                                >
                                                    <Star 
                                                        size={16} 
                                                        fill={star <= (watchDishes[index]?.rating || 0) ? "currentColor" : "none"} 
                                                        className={star <= (watchDishes[index]?.rating || 0) ? "text-orange-500" : "text-white/10"}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {fields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        remove(index);
                                        setDishFiles(prev => {
                                            const next = new Map(prev);
                                            next.delete(field.id);
                                            return next;
                                        });
                                    }}
                                    className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                                )}
                            </div>
                          </div>
                          {errors.dishes?.[index]?.name && (
                            <p className="text-xs text-red-500">{errors.dishes[index]?.name?.message}</p>
                          )}
                        </div>
                      </div>
                  ))}
                </div>

                {selectedRestaurant?.menuItems && selectedRestaurant.menuItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <p className="w-full text-[10px] text-white/20 uppercase tracking-tighter">Suggestions:</p>
                    {selectedRestaurant.menuItems.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          // If the last dish is empty, fill it. Otherwise append.
                          const lastIndex = fields.length - 1;
                          const currentDishes = control._formValues.dishes;
                          if (currentDishes[lastIndex].name === "") {
                            setValue(`dishes.${lastIndex}.name`, item);
                            setValue(`dishes.${lastIndex}.rating`, 5);
                          } else {
                            append({ name: item, rating: 5 });
                          }
                        }}
                        className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 text-white/60 hover:text-white transition-all"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                )}
                {errors.dishes?.root && <p className="text-xs text-red-500">{errors.dishes.root.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="small-caps">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleSetRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                      disabled={isSubmitting}
                    >
                      <Star 
                        size={24} 
                        fill={star <= rating ? "currentColor" : "none"} 
                        className={star <= rating ? "text-orange-500" : "text-white/20"}
                      />
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="text-xs text-red-500">Rating is required</p>}
              </div>

              <div className="space-y-2">
                <label className="small-caps">Your Review</label>
                <textarea 
                  {...register("review")}
                  placeholder="Tell us about the flavors, textures, and experience..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ring-white/20 transition-all resize-none"
                  disabled={isSubmitting}
                />
                {errors.review && <p className="text-xs text-red-500">{errors.review.message}</p>}
              </div>

              <div className="hidden">
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                   accept="image/*" 
                 />
              </div>

              <div className="p-6 md:p-8 bg-black/40 border-t border-white/10 shrink-0">
                <button 
                  type="submit"
                  disabled={isSubmitting || isUploading || !searchQuery.trim()}
                  className="w-full bg-[#00e054] hover:bg-[#00c044] text-black font-black uppercase tracking-[0.3em] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#00e054]/10 disabled:opacity-50 disabled:grayscale active:scale-95"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-32 h-1 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-black">{uploadProgress}% UPLOADED</span>
                    </div>
                  ) : isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Zap size={18} fill="currentColor" />
                  )}
                  {isSubmitting || isUploading ? "" : (existingReview ? "Update Narrative" : "Post Review")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
