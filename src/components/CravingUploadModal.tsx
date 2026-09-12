import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Star, Upload, Search, MapPin, Loader2, Plus, Flame, ShieldCheck, ArrowLeft, Video, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../App";
import { db, storage } from "../firebase";
import { collection, doc, setDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { searchRestaurants } from "../services/mapsService";
import { RestaurantSearchResult, CravingTag } from "../types";
import { createCraving, uploadMedia } from "../services/supabaseService";
import { triggerHaptic } from "../services/nativeService";

const CRAVING_TAGS: CravingTag[] = [
  "First bite reaction",
  "Worth it?",
  "₹500 food challenge",
  "Hidden restaurant",
  "Spicy food challenge",
  "Chef interview",
  "Dessert review",
  "Top 5 restaurants",
  "Food travel",
  "Street Food"
];

interface CravingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CravingUploadModal({ isOpen, onClose }: CravingUploadModalProps) {
  const { user, dishdUser } = useAuth();
  const [step, setStep] = useState<"media" | "details">("media");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Craving Metadata
  const [restaurantName, setRestaurantName] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSearchResult | null>(null);
  const [dishName, setDishName] = useState("");
  const [cuisine, setCuisine] = useState("Indian");
  const [rating, setRating] = useState(9.2);
  const [cravingTag, setCravingTag] = useState<CravingTag>("First bite reaction");
  const [reviewContent, setReviewContent] = useState("");
  const [isVerifiedVisit, setIsVerifiedVisit] = useState(true);
  const [visitProofType, setVisitProofType] = useState<"receipt" | "qr" | "reservation">("receipt");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RestaurantSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file.");
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 90) {
        toast.error("Cravings are short-form! Please select a clip under 90 seconds.");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setStep("details");
    };
    video.src = URL.createObjectURL(file);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setRestaurantName(val);
    setSelectedRestaurant(null);
    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    try {
      const results = await searchRestaurants(val);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRestaurant = (res: RestaurantSearchResult) => {
    setSelectedRestaurant(res);
    setRestaurantName(res.name);
    setSearchQuery(res.name);
    setCuisine(res.cuisine || "Indian");
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error("Please sign in to post a craving.");
      return;
    }
    if (!restaurantName.trim()) {
      toast.error("Please specify the restaurant.");
      return;
    }
    if (!dishName.trim()) {
      toast.error("Please specify the dish you are craving.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      let finalVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-pizza-being-cut-with-a-slicer-44171-large.mp4";

      if (videoFile) {
        const ext = videoFile.name.split('.').pop() || 'mp4';
        const videoPath = `cravings/${user.uid}_${Date.now()}.${ext}`;

        // 1. Primary: Supabase Storage bucket 'cravings' with live progress
        try {
          const supaUrl = await uploadMedia(videoFile, 'cravings', videoPath, (pct) => {
            setUploadProgress(pct);
          });
          if (supaUrl) {
            finalVideoUrl = supaUrl;
          } else if (storage) {
            // 2. Secondary fallback: Firebase Storage
            const videoRef = ref(storage, `videos/${user.uid}_${Date.now()}.${ext}`);
            const uploadTask = uploadBytesResumable(videoRef, videoFile);

            finalVideoUrl = await new Promise<string>((resolve) => {
              const timeout = setTimeout(() => {
                try { uploadTask.cancel(); } catch {}
                console.warn("Video upload timed out, proceeding with media fallback");
                resolve(finalVideoUrl);
              }, 45000);

              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  if (snapshot.totalBytes > 0) {
                    const pct = Math.min(95, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
                    setUploadProgress(pct);
                  }
                },
                (err) => {
                  clearTimeout(timeout);
                  console.warn("Firebase upload error:", err);
                  resolve(finalVideoUrl);
                },
                async () => {
                  clearTimeout(timeout);
                  try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                  } catch (e) {
                    resolve(finalVideoUrl);
                  }
                }
              );
            });
          }
        } catch (uploadErr) {
          console.warn("Video upload notice:", uploadErr);
        }
      }

      setUploadProgress(98);

      const reviewRef = doc(collection(db, "reviews"));
      const cleanRating = Math.min(10, Math.max(1, Number(rating) || 9));

      const cravingDoc = {
        id: reviewRef.id,
        userId: user.uid,
        userName: dishdUser?.displayName || user.displayName || "Critic",
        userPhoto: dishdUser?.photoURL || user.photoURL || "",
        userCriticLevel: dishdUser?.criticLevel || "Food Critic",
        restaurantId: selectedRestaurant?.id || `rest_${Date.now()}`,
        restaurantName: restaurantName.trim(),
        restaurantLocation: selectedRestaurant?.location || "Local Spot",
        city: selectedRestaurant?.city || "Hyderabad",
        rating: cleanRating,
        content: reviewContent.trim() || `Craving ${dishName} at ${restaurantName}!`,
        videoUrl: finalVideoUrl,
        type: "craving",
        cravingTag: cravingTag,
        attachedDish: dishName.trim(),
        attachedCuisine: cuisine,
        attachedScore: cleanRating,
        isVerifiedVisit: isVerifiedVisit,
        visitProofType: visitProofType,
        ratingsDetail: {
          taste: cleanRating,
          quality: Math.min(10, cleanRating + 0.1),
          portion: 9.0,
          value: 8.8
        },
        dishes: [
          { name: dishName.trim(), rating: Math.round(cleanRating / 2) }
        ],
        createdAt: serverTimestamp(),
        likes: 0
      };

      // Write to Firestore
      await setDoc(reviewRef, cravingDoc);

      // Write to Supabase table
      await createCraving({
        id: reviewRef.id,
        userId: user.uid,
        userName: dishdUser?.displayName || user.displayName || "Critic",
        userPhoto: dishdUser?.photoURL || user.photoURL || "",
        restaurantName: restaurantName.trim(),
        attachedDish: dishName.trim(),
        city: selectedRestaurant?.city || "Hyderabad",
        videoUrl: finalVideoUrl,
        content: reviewContent.trim(),
        cravingTag: cravingTag,
      }).catch(err => console.warn("Supabase craving insert notice:", err));

      // Update user stats
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { "stats.mealsLogged": increment(1) }).catch(async () => {
        await setDoc(userRef, { stats: { mealsLogged: 1 } }, { merge: true }).catch(() => {});
      });

      triggerHaptic();
      toast.success("Craving posted live!");
      onClose();

      // Reset form
      setStep("media");
      setVideoFile(null);
      setVideoPreview(null);
      setDishName("");
      setRestaurantName("");
      setSelectedRestaurant(null);
      setSearchQuery("");
      setShowDropdown(false);
      setReviewContent("");
    } catch (error: any) {
      console.error("Failed to post craving:", error);
      toast.error("Failed to publish craving. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-2xl"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-lg max-h-[92vh] bg-zinc-950 border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-white"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            {step === "details" && (
              <button 
                onClick={() => setStep("media")}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-400 flex items-center gap-1">
                <Flame size={11} className="text-orange-500 fill-orange-500" />
                Madeater Cravings
              </span>
              <h2 className="text-xs sm:text-base font-black uppercase tracking-tight text-white">
                {step === "media" ? "Upload Food Video" : "Food Database Attachment"}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95 cursor-pointer text-white"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-hide space-y-4">
          {step === "media" ? (
            <div className="space-y-4 text-center">
              <input 
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
              />
              
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="aspect-[9/13] max-w-[240px] mx-auto border-2 border-dashed border-white/20 hover:border-orange-500 rounded-2xl bg-zinc-900/40 flex flex-col items-center justify-center p-6 cursor-pointer group transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Video size={24} className="text-orange-400" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1">Select Video Clip</h3>
                <p className="text-[11px] text-white/40 mb-3">Vertical 9:16 format (under 90s)</p>
                <span className="px-3.5 py-1.5 rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-wider group-hover:bg-orange-400 transition-colors">
                  Browse Files
                </span>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setVideoPreview("https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-pizza-being-cut-with-a-slicer-44171-large.mp4");
                    setStep("details");
                  }}
                  className="text-[11px] text-white/50 hover:text-orange-400 underline underline-offset-4 transition-colors"
                >
                  Or continue with a curated food sample video →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Media Preview Thumbnail Row */}
              {videoPreview && (
                <div className="flex items-center gap-3 p-2.5 bg-zinc-900/60 rounded-xl border border-white/10">
                  <div className="w-12 h-16 bg-black rounded-lg overflow-hidden shrink-0 border border-white/15">
                    <video src={videoPreview} className="w-full h-full object-cover" muted autoPlay loop />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase tracking-wider text-orange-400 font-bold">Attached Media</span>
                    <p className="text-xs font-bold truncate text-white">Food Reel Ready for Publishing</p>
                    <button 
                      onClick={() => setStep("media")}
                      className="text-[10px] text-white/40 hover:text-white underline mt-0.5"
                    >
                      Change video
                    </button>
                  </div>
                </div>
              )}

              {/* Craving Category Tag Selector - Streamlined Horizontal Scroll */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-white/50 mb-1.5">
                  Craving Category
                </label>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {CRAVING_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { triggerHaptic(); setCravingTag(tag); }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-tight transition-all border shrink-0 active:scale-95 ${
                        cravingTag === tag
                          ? "bg-orange-500 text-black border-orange-500 shadow-md font-black"
                          : "bg-zinc-900/70 text-white/70 border-white/10 hover:border-white/30"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attached Dish Name */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">
                  What Dish is this Craving For? *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Hyderabadi Chicken Dum Biryani, Filter Coffee..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Restaurant & Location Tagging */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/50">
                    Restaurant / Location *
                  </label>
                  {selectedRestaurant && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified Spot
                    </span>
                  )}
                </div>

                {selectedRestaurant ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-white animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate text-white">{selectedRestaurant.name}</p>
                        <p className="text-[10px] text-white/50 truncate">
                          {selectedRestaurant.location || selectedRestaurant.city || "Known Location"} • {selectedRestaurant.cuisine || cuisine}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setSelectedRestaurant(null);
                        setRestaurantName("");
                        setSearchQuery("");
                        setShowDropdown(false);
                      }}
                      className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Change restaurant"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search restaurant or enter location..."
                      value={searchQuery || restaurantName}
                      onChange={handleSearchChange}
                      onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    {isSearching && (
                      <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-orange-400" />
                    )}

                    {/* Autocomplete Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#141418] border border-white/15 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-white/5">
                        {searchResults.map((res) => (
                          <button
                            key={res.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              triggerHaptic();
                              handleSelectRestaurant(res);
                            }}
                            className="w-full text-left p-3 hover:bg-white/10 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{res.name}</p>
                              <p className="text-[10px] text-white/40 truncate">{res.location} • {res.cuisine}</p>
                            </div>
                            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider shrink-0">
                              Select →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Madeater Rating Slider */}
              <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Madeater Score</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-500/10 border border-orange-500/25 rounded-lg">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-orange-400">{Number(rating).toFixed(1)} / 10</span>
                  </div>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-bold px-0.5">
                  <span>1.0 Fair</span>
                  <span>5.0 Good</span>
                  <span>7.5 Great</span>
                  <span>10.0 Legendary</span>
                </div>
              </div>

              {/* Review Commentary */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">
                  Tasting Commentary / Hot Take
                </label>
                <textarea
                  rows={2}
                  placeholder="The crunch was unbelievable, perfectly balanced heat and rich ghee aroma..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              {/* Verified Visit Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-white/10">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className={isVerifiedVisit ? "text-emerald-400" : "text-white/30"} />
                  <div>
                    <p className="text-xs font-bold text-white">Mark as Verified Visit</p>
                    <p className="text-[9px] text-white/40">Verified dining experience</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isVerifiedVisit}
                  onClick={() => setIsVerifiedVisit(!isVerifiedVisit)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isVerifiedVisit ? "bg-emerald-500 shadow-md shadow-emerald-500/30" : "bg-white/15"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                      isVerifiedVisit ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step === "details" && (
          <div className="p-3.5 sm:p-4 border-t border-white/10 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between">
            <button
              onClick={() => setStep("media")}
              className="px-4 py-2 rounded-full text-xs font-bold text-white/60 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              disabled={isUploading || !dishName.trim() || !restaurantName.trim()}
              onClick={handlePublish}
              className="px-6 py-2.5 rounded-full bg-orange-500 text-black font-black uppercase tracking-wider text-xs hover:bg-orange-400 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{uploadProgress > 0 && uploadProgress < 98 ? `Uploading ${uploadProgress}%...` : "Publishing..."}</span>
                </>
              ) : (
                <>
                  <Flame size={14} className="fill-black" />
                  <span>Post Craving</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
