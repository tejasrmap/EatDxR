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
  review: z.string().optional()
});

type LogFormValues = z.infer<typeof logSchema>;

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingReview?: Review;
  initialRestaurant?: RestaurantSearchResult;
}

export function LogMealModal({ isOpen, onClose, existingReview, initialRestaurant }: LogMealModalProps) {
  const [rating, setRating] = useState(5);
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, dishdUser } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, setValue, reset, control, watch } = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      rating: 5,
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

  const uploadFileWithProgress = (file: File, path: string, onProgress?: (bytes: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      // --- Resilience Engine: 15-second HMR/Network Timeout ---
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error("Upload timed out after 15s. Please check your CORS configuration."));
      }, 15000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          if (onProgress) onProgress(snapshot.bytesTransferred);
        }, 
        (error: any) => {
           clearTimeout(timeout);
           console.error("Upload failed", error);
           toast.error(`Upload Failed: ${error.code || error.message}`);
           setIsUploading(false);
           setUploadProgress(0);
           reject(error);
        }, 
        async () => {
          clearTimeout(timeout);
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
    setUploadProgress(1); // Visual feedback
    try {
      const filesToUpload: { file: File, path: string, fieldIndex: number }[] = [];
      
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

      const uploadedDishes = data.dishes.map(d => ({ 
        ...d, 
        image: (d.image && d.image.startsWith('data:')) ? "" : (d.image || "") // 'Source-Clean' Reset
      }));

      // --- Universal Parallel Upload Engine ---
      if (filesToUpload.length > 0) {
        const uploadPromises = filesToUpload.map(async (task) => {
          const downloadUrl = await uploadFileWithProgress(task.file, task.path, (bytes) => {
            transferredMap.set(task.path, bytes);
            updateOmniProgress();
          });
          uploadedDishes[task.fieldIndex].image = downloadUrl;
        });

        await Promise.all(uploadPromises);
      }

      let restaurantId = selectedRestaurant?.id || `manual_${Date.now()}`;
      
      if (selectedRestaurant) {
        try {
          const restRef = doc(db, "restaurants", selectedRestaurant.id);
          const restDoc = await getDoc(restRef);
          if (!restDoc.exists()) {
            await setDoc(restRef, {
              id: selectedRestaurant.id,
              name: selectedRestaurant.name,
              cuisine: selectedRestaurant.cuisine || "Various",
              location: manualLocation || selectedRestaurant.location || "India",
              rating: selectedRestaurant.rating || 0,
              reviewCount: 1,
              image: selectedRestaurant.image || "",
              menuItems: selectedRestaurant.menuItems || []
            });
          }
        } catch (restaurantError) {
          console.warn("Could not save restaurant data (likely due to permissions). Proceeding with review log.");
        }
      }

      if (existingReview) {
        const reviewRef = doc(db, "reviews", existingReview.id);
        
        // Critical: Align with firestore.rules (Remove illegal/immutable fields)
        await updateDoc(reviewRef, {
          restaurantName: data.restaurant,
          restaurantId: restaurantId,
          dishes: uploadedDishes,
          rating: data.rating,
          content: data.review || "",
          restaurantLocation: manualLocation || selectedRestaurant?.location || "India",
          userId: user.uid,
          userName: dishdUser?.displayName || user.displayName || "Critic",
          userPhoto: dishdUser?.photoURL || user.photoURL || "",
          likes: existingReview?.likes || 0
        });
        toast.success("Narrative updated!");
      } else {
        const reviewRef = doc(collection(db, "reviews"));
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
          createdAt: serverTimestamp(),
          likes: 0
        };

        await setDoc(reviewRef, reviewData);
        
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { "stats.reviewsWritten": increment(1) });
        toast.success("Narrative Live!");
      }

      reset();
      setRating(0);
      setSearchQuery("");
      setManualLocation("");
      setSelectedRestaurant(null);
      setDishFiles(new Map());
      setIsUploading(false);
      setUploadProgress(0);
      onClose();
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Narrative failed to launch. Try again.");
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-12 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg bg-[#0a0a0a] border-none md:border border-white/10 rounded-none md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Elite Progress Micro-Bar */}
            {isUploading && (
              <div className="absolute top-0 left-0 right-0 h-1 z-[1010] overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-500 to-rose-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Cinematic Header - Sticky & Integrated */}
            <div className="px-6 py-5 border-b border-white/5 bg-black/60 backdrop-blur-3xl flex items-center justify-between shrink-0 sticky top-0 z-[1000]">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black tracking-[0.4em] text-orange-500">Culinary Narrative</span>
                <h2 className="text-base font-bold text-white serif italic">
                  {existingReview ? "Modernize Legacy" : "Capture the Moment"}
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 group active:scale-90"
              >
                <X size={18} className="text-white/40 group-hover:text-white transition-colors" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Identity & Context */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5 relative group">
                  <label className="text-[9px] uppercase font-black tracking-widest text-white/30 group-focus-within:text-orange-500 transition-colors">Restaurant</label>
                  <div className="relative">
                    <input 
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search Culinary Stage..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-1 ring-orange-500/30 transition-all text-xs font-medium"
                      disabled={isSubmitting}
                    />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                  </div>
                  {errors.restaurant && <p className="text-[9px] text-rose-500 font-black uppercase text-right mt-1">{errors.restaurant.message}</p>}
                  
                  <AnimatePresence>
                    {showResults && (searchResults.length > 0 || isSearching) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-[#121212]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                      >
                        {isSearching ? (
                          <div className="p-6 text-center text-[10px] text-white/40 italic flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin text-orange-500" />
                            Identifying Places...
                          </div>
                        ) : (
                          searchResults.map((result) => (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() => handleSelectRestaurant(result)}
                              className="w-full text-left p-3.5 hover:bg-white/5 flex items-center gap-3.5 transition-all group border-b border-white/5 last:border-0"
                            >
                              <img 
                                src={result.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=100&q=80`} 
                                className="w-10 h-10 rounded-lg object-cover opacity-50 group-hover:opacity-100 transition-all"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="font-bold text-xs text-white leading-none mb-1">{result.name}</p>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest">{result.location}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2.5 group">
                  <label className="text-[9px] uppercase font-black tracking-widest text-white/30 group-focus-within:text-rose-500 transition-colors">Area / Suburb</label>
                  <div className="relative">
                    <input 
                      value={manualLocation}
                      onChange={(e) => setManualLocation(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-1 ring-rose-500/30 transition-all text-xs font-medium"
                    />
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                  </div>
                </div>
              </section>

              {/* The Narrative: Dishes */}
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-white/30">The Culinary Highlights</h3>
                  <button
                    type="button"
                    onClick={() => append({ name: "", rating: 5 })}
                    className="flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest text-green-500 hover:text-green-400 p-1.5 px-3 bg-green-500/5 rounded-full transition-all border border-green-500/10"
                  >
                    <Plus size={12} />
                    Add Highlight
                  </button>
                </div>
                {errors.dishes && <p className="text-[9px] text-rose-500 font-black uppercase text-right mt-1">{errors.dishes.message}</p>}
                
                <div className="space-y-3.5">
                  {fields.map((field, index) => (
                    <motion.div 
                      key={field.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative bg-white/[0.03] p-3.5 rounded-2xl border border-white/5 group"
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          onClick={() => { setActiveDishId(field.id); fileInputRef.current?.click(); }}
                          className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden shrink-0 relative group/pic"
                        >
                          {watchDishes[index]?.image ? (
                            <img src={watchDishes[index].image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon size={20} className="text-white/10 group-hover/pic:scale-110 transition-transform" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pic:opacity-100 flex items-center justify-center transition-opacity">
                            <Plus size={16} className="text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-3">
                              <input 
                                {...register(`dishes.${index}.name` as const)}
                                placeholder="Highlight Title..."
                                className="w-full bg-transparent border-b border-white/5 pb-1.5 text-xs font-bold placeholder:text-white/10 focus:outline-none focus:border-orange-500/50 transition-all"
                              />
                              <div className="flex items-center gap-2.5">
                                <span className="text-[8px] uppercase font-black text-white/20">Highlight Rating</span>
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map(star => (
                                    <button
                                      key={star}
                                      type="button"
                                      className="transition-transform active:scale-90"
                                      onClick={() => setValue(`dishes.${index}.rating`, star)}
                                    >
                                      <Star 
                                        size={12} 
                                        fill={star <= (watchDishes[index]?.rating || 0) ? "currentColor" : "none"} 
                                        className={star <= (watchDishes[index]?.rating || 0) ? "text-orange-500" : "text-white/[0.05]"}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => { remove(index); setDishFiles(prev => { const n = new Map(prev); n.delete(field.id); return n; }); }}
                                className="p-1.5 text-white/10 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* The Verdict */}
              <section className="space-y-6">
                <div className="flex flex-col gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black tracking-widest text-white/30 text-center block">Overall Score</label>
                    <div className="flex justify-center gap-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleSetRating(star)}
                          className="hover:scale-125 transition-transform"
                        >
                          <Star 
                            size={28} 
                            fill={star <= rating ? "currentColor" : "none"} 
                            className={star <= rating ? "text-orange-500" : "text-white/10"}
                          />
                        </button>
                      ))}
                    </div>
                    {errors.rating && <p className="text-[9px] text-rose-500 font-black uppercase text-center mt-2">{errors.rating.message}</p>}
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[9px] uppercase font-black tracking-widest text-white/30">The Narrative</label>
                    <textarea 
                      {...register("review")}
                      placeholder="Share the story behind the flavors..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-1 ring-white/20 transition-all resize-none text-xs font-medium placeholder:text-white/10"
                    />
                  </div>
                </div>
              </section>

              <div className="hidden">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
              </div>
            </form>

            {/* Elite Submission Stage */}
            <div className="p-5 md:p-6 bg-black/40 border-t border-white/5 backdrop-blur-2xl px-8">
                <button 
                  type="submit"
                  disabled={isSubmitting || isUploading || !searchQuery.trim()}
                  onClick={handleSubmit(onSubmit)}
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-rose-500 hover:scale-[1.01] active:scale-95 text-white font-black uppercase text-[10px] tracking-[0.4em] rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-[0_15px_40px_rgba(244,63,94,0.2)] disabled:opacity-50 disabled:grayscale relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span>{uploadProgress}% Launching...</span>
                    </div>
                  ) : isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Zap size={16} fill="currentColor" />
                      <span>{existingReview ? "Modernize" : "Launch Narrative"}</span>
                    </>
                  )}
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
