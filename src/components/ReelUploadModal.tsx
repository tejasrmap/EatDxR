import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Star, Upload, Search, MapPin, Loader2, Plus, Trash2, Zap, Film, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../App";
import { db, storage } from "../firebase";
import { collection, doc, setDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { searchRestaurants } from "../services/mapsService";
import { RestaurantSearchResult } from "../types";

const reelSchema = z.object({
  restaurant: z.string().min(1, "Restaurant is required"),
  dishes: z.array(z.object({
    name: z.string().min(1, "Dish name is required"),
    rating: z.number().min(1).max(5)
  })),
  rating: z.number().min(1).max(5),
  diary: z.string().min(1, "Diary content is required")
});

type ReelFormValues = z.infer<typeof reelSchema>;

interface ReelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Stage = "CLIP" | "NARRATIVE";

export function ReelUploadModal({ isOpen, onClose }: ReelUploadModalProps) {
  const [stage, setStage] = useState<Stage>("CLIP");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RestaurantSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user, dishdUser } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, setValue, reset, control, watch } = useForm<ReelFormValues>({
    resolver: zodResolver(reelSchema),
    defaultValues: {
      rating: 5,
      dishes: [{ name: "", rating: 5 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "dishes" });
  const watchRating = watch("rating");

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // IG Style Clip Limit
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 70) {
        toast.error("Elite Purity: Reels are limited to 70 seconds. Please select a shorter clip.");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    };
    video.src = URL.createObjectURL(file);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    setShowResults(true);
    try {
      const results = await searchRestaurants(query);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: ReelFormValues) => {
    if (!user || !videoFile) return;

    setIsUploading(true);
    try {
      const videoPath = `reels/${user.uid}_${Date.now()}.mp4`;
      const videoRef = ref(storage, videoPath);
      const uploadTask = uploadBytesResumable(videoRef, videoFile);

      // --- Resilience Engine: 15-second Timeout ---
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        toast.error("Video Upload timed out after 15s. Check CORS.");
        setIsUploading(false);
      }, 15000);

      uploadTask.on('state_changed', 
        (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100)),
        (err) => { 
          clearTimeout(timeout);
          console.error("Reel upload failed:", err);
          toast.error("Narrative failed to launch."); 
          setIsUploading(false); 
        },
        async () => {
          clearTimeout(timeout);
          const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const reviewRef = doc(collection(db, "reviews"));
          
          await setDoc(reviewRef, {
            id: reviewRef.id,
            userId: user.uid,
            userName: dishdUser?.displayName || user.displayName || "Critic",
            userPhoto: dishdUser?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`,
            restaurantName: data.restaurant,
            restaurantId: selectedRestaurant?.id || `manual_rest_${Date.now()}`,
            restaurantLocation: manualLocation,
            content: data.diary,
            rating: data.rating,
            videoUrl: videoUrl,
            dishes: data.dishes,
            type: "reel",
            createdAt: serverTimestamp(),
            likes: 0
          });

          // Correct the stats path
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { "stats.mealsLogged": increment(1) });
          
          toast.success("Reel Narrative Live!");
          onClose();
          reset();
          setStage("CLIP");
          setVideoFile(null);
          setVideoPreview(null);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
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
            className="fixed inset-0 bg-background/95 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg bg-background md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-border"
          >
            {/* Stage Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-border bg-background/40 backdrop-blur-2xl shrink-0 z-50">
              <div className="flex items-center gap-3">
                {stage === "NARRATIVE" && (
                   <button onClick={() => setStage("CLIP")} className="p-2 hover:bg-muted/80 rounded-full text-muted-foreground hover:text-foreground transition-all">
                     <ArrowLeft size={18} />
                   </button>
                )}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black tracking-[0.4em] text-orange-500">Reel Narrative</span>
                  <h2 className="text-base font-bold text-foreground serif italic">
                    {stage === "CLIP" ? "Select the Moment" : "The Diary"}
                  </h2>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-full transition-all border border-border group"
              >
                <X size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>

            {/* Omni-Progress Bar */}
            {isUploading && (
              <div className="h-1 w-full bg-muted relative z-[100]">
                <motion.div className="h-full bg-gradient-to-r from-orange-500 to-rose-500" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {stage === "CLIP" ? (
                /* STAGE 1: CLIP PICKER */
                <div className="p-8 h-full flex flex-col items-center justify-center gap-8">
                   <div 
                     onClick={() => videoInputRef.current?.click()}
                     className="w-full aspect-[9/16] max-h-[60vh] bg-muted/30 border border-border rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-all overflow-hidden relative group"
                   >
                     {videoPreview ? (
                       <>
                         <video src={videoPreview} className="w-full h-full object-cover" muted loop autoPlay />
                         <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Replace Clip</span>
                         </div>
                       </>
                     ) : (
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <Film size={28} className="text-orange-500" />
                          </div>
                          <div className="text-center">
                             <p className="text-xs font-bold text-foreground mb-1">Select Cinematic Clip</p>
                             <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">70s Elite Limit</p>
                          </div>
                       </div>
                     )}
                   </div>
                   <input type="file" ref={videoInputRef} onChange={handleVideoChange} accept="video/*" className="hidden" />
                   
                   {videoPreview && (
                     <button 
                       onClick={() => setStage("NARRATIVE")}
                       className="w-full h-14 bg-foreground text-background font-black uppercase text-[10px] tracking-[0.4em] rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95"
                     >
                       Next: The Narrative
                       <ArrowRight size={16} />
                     </button>
                   )}
                </div>
              ) : (
                /* STAGE 2: NARRATIVE DIARY */
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8 pb-32">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border relative">
                     <video src={videoPreview!} className="w-full h-full object-cover" muted loop autoPlay />
                     <div className="absolute bottom-4 right-4 px-3 py-1 bg-background/40 backdrop-blur-xl rounded-full border border-border text-[9px] font-black uppercase text-muted-foreground">
                        70s Narrative
                     </div>
                  </div>

                  <div className="space-y-6">
                    <section className="space-y-4">
                       <h3 className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Culinary Context</h3>
                       <div className="grid gap-4">
                          <div className="relative group">
                             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                             <input 
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Where did this happen?"
                                className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-4 text-xs font-medium focus:outline-none focus:ring-1 ring-orange-500/40 text-foreground"
                             />
                             {errors.restaurant && <p className="text-[9px] text-rose-500 font-black uppercase text-right mt-1">{errors.restaurant.message}</p>}
                             <AnimatePresence>
                               {showResults && (searchResults.length > 0 || isSearching) && (
                                 <motion.div className="absolute z-[100] left-0 right-0 mt-2 bg-background/95 backdrop-blur-3xl border border-border rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                    {isSearching ? <div className="p-4 text-[9px] text-muted-foreground uppercase font-black text-center italic">Identifying...</div> : searchResults.map(r => (
                                      <button key={r.id} type="button" onClick={() => { setSelectedRestaurant(r); setSearchQuery(r.name); setManualLocation(r.location || ""); setShowResults(false); setValue("restaurant", r.name); }} className="w-full p-4 hover:bg-muted/50 text-left border-b border-border last:border-0 flex items-center gap-3">
                                         <div className="w-8 h-8 rounded bg-muted/50 shrink-0" />
                                         <div>
                                            <p className="text-xs font-bold text-foreground">{r.name}</p>
                                            <p className="text-[9px] text-muted-foreground uppercase font-black">{r.location}</p>
                                         </div>
                                      </button>
                                    ))}
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       </div>
                    </section>

                    <section className="space-y-3">
                       <h3 className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">The Diary Entry</h3>
                       <textarea 
                         {...register("diary")}
                         placeholder="The story behind the lens..."
                         rows={4}
                         className="w-full bg-muted/30 border border-border rounded-2xl p-5 text-xs font-medium focus:outline-none focus:ring-1 ring-border resize-none text-foreground"
                       />
                       {errors.diary && <p className="text-[9px] text-rose-500 font-black uppercase text-right">{errors.diary.message}</p>}
                    </section>

                    <section className="space-y-4">
                       <div className="flex items-center justify-between">
                          <h3 className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Dish Highlights</h3>
                          <button type="button" onClick={() => append({ name: "", rating: 5 })} className="text-[10px] font-black text-orange-500 hover:text-orange-400 p-2 bg-orange-500/5 rounded-full">+ Tag Dish</button>
                       </div>
                       <div className="space-y-3">
                          {fields.map((field, i) => (
                             <div key={field.id} className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl p-3">
                                <input 
                                  {...register(`dishes.${i}.name` as const)}
                                  placeholder="Dish title..."
                                  className="flex-1 bg-transparent text-xs font-bold text-foreground focus:outline-none placeholder:text-muted-foreground"
                                />
                                <div className="flex items-center gap-1.5">
                                   {[1,2,3,4,5].map(s => (
                                     <button key={s} type="button" onClick={() => setValue(`dishes.${i}.rating`, s)}>
                                        <Star size={12} fill={s <= watch(`dishes.${i}.rating`) ? "currentColor" : "none"} className={s <= watch(`dishes.${i}.rating`) ? "text-orange-500" : "text-muted-foreground/30"} />
                                     </button>
                                   ))}
                                </div>
                                <button type="button" onClick={() => remove(i)} className="p-1.5 text-muted-foreground hover:text-rose-500"><Trash2 size={14} /></button>
                             </div>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-4 pt-4 border-t border-border">
                        <h3 className="text-[9px] uppercase font-black tracking-widest text-muted-foreground text-center">Overall Culinary Verdict</h3>
                        <div className="flex justify-center gap-4">
                           {[1,2,3,4,5].map(s => (
                             <button key={s} type="button" onClick={() => setValue("rating", s)} className="hover:scale-125 transition-transform">
                                <Star size={32} fill={s <= watchRating ? "currentColor" : "none"} className={s <= watchRating ? "text-orange-500" : "text-muted-foreground/30"} />
                             </button>
                           ))}
                        </div>
                        {errors.dishes && <p className="text-[9px] text-rose-500 font-black uppercase text-right mt-1">{errors.dishes.message}</p>}
                    </section>
                  </div>

                  <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/60 backdrop-blur-2xl border-t border-border z-[200]">
                    <button 
                      type="submit"
                      disabled={isUploading || isSubmitting}
                      className="w-full h-14 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black uppercase text-[10px] tracking-[0.4em] rounded-[2rem] flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(244,63,94,0.3)] disabled:opacity-50"
                    >
                      {isUploading ? <><Loader2 className="animate-spin" size={18} /> Launching Narrative...</> : <><Zap size={18} fill="currentColor" /> Launch Reel Narrative</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
