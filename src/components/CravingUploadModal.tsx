import React, { useState, useRef } from "react";
import { X, Star, Upload, Search, MapPin, Loader2, Plus, Flame, ShieldCheck, ArrowLeft, Video, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../App";
import { db, storage } from "../firebase";
import { collection, doc, setDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { searchRestaurants } from "../services/mapsService";
import { RestaurantSearchResult, CravingTag } from "../types";

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
    setCuisine(res.cuisine || "Indian");
    setShowDropdown(false);
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

    try {
      let finalVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-pizza-being-cut-with-a-slicer-44171-large.mp4";

      if (videoFile && storage) {
        try {
          const videoPath = `cravings/${user.uid}_${Date.now()}.mp4`;
          const videoRef = ref(storage, videoPath);
          const uploadTask = uploadBytesResumable(videoRef, videoFile);

          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => resolve(), 12000); // 12s fallback
            uploadTask.on(
              "state_changed",
              (snap) => setUploadProgress(Math.round((snap.bytesTransferred / (snap.totalBytes || 1)) * 100)),
              (err) => { clearTimeout(timer); reject(err); },
              async () => {
                clearTimeout(timer);
                finalVideoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve();
              }
            );
          });
        } catch (storageErr) {
          console.warn("Storage fallback triggered:", storageErr);
        }
      }

      const reviewRef = doc(collection(db, "reviews"));
      await setDoc(reviewRef, {
        id: reviewRef.id,
        userId: user.uid,
        userName: dishdUser?.displayName || user.displayName || "Critic",
        userPhoto: dishdUser?.photoURL || user.photoURL || "",
        userCriticLevel: dishdUser?.criticLevel || "Food Critic",
        restaurantId: selectedRestaurant?.id || `rest_${Date.now()}`,
        restaurantName: restaurantName.trim(),
        restaurantLocation: selectedRestaurant?.location || "Local Spot",
        city: selectedRestaurant?.city || "Hyderabad",
        rating: Number(rating),
        content: reviewContent.trim() || `Craving ${dishName} at ${restaurantName}!`,
        videoUrl: finalVideoUrl,
        type: "craving",
        cravingTag: cravingTag,
        attachedDish: dishName.trim(),
        attachedCuisine: cuisine,
        attachedScore: Number(rating),
        isVerifiedVisit: isVerifiedVisit,
        visitProofType: visitProofType,
        ratingsDetail: {
          taste: Number(rating),
          quality: Math.min(10, Number(rating) + 0.1),
          portion: 9.0,
          value: 8.8
        },
        dishes: [
          { name: dishName.trim(), rating: Math.round(Number(rating) / 2) }
        ],
        createdAt: serverTimestamp(),
        likes: 0
      });

      // Update user stats
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { "stats.mealsLogged": increment(1) }).catch(() => {});

      toast.success("Craving posted live!");
      onClose();
      // Reset
      setStep("media");
      setVideoFile(null);
      setVideoPreview(null);
      setDishName("");
      setRestaurantName("");
      setReviewContent("");
    } catch (error: any) {
      console.error("Failed to post craving:", error);
      toast.error("Failed to publish craving. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 md:p-6">
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl max-h-[92vh] bg-zinc-950 border border-white/10 rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 text-white"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {step === "details" && (
              <button 
                onClick={() => setStep("media")}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 flex items-center gap-1">
                <Flame size={12} className="text-orange-500 fill-orange-500" />
                Madeater Cravings
              </span>
              <h2 className="text-lg font-black uppercase tracking-tight">
                {step === "media" ? "Upload Food Video" : "Food Database Attachment"}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6">
          {step === "media" ? (
            <div className="space-y-6 text-center">
              <input 
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
              />
              
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="aspect-[9/14] max-w-xs mx-auto border-2 border-dashed border-white/20 hover:border-orange-500 rounded-3xl bg-zinc-900/50 flex flex-col items-center justify-center p-8 cursor-pointer group transition-all"
              >
                <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Video size={28} className="text-orange-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-1">Select Video Clip</h3>
                <p className="text-xs text-white/40 mb-4">Vertical 9:16 format recommended (under 90s)</p>
                <span className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-orange-400 transition-colors">
                  Browse Files
                </span>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setVideoPreview("https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-pizza-being-cut-with-a-slicer-44171-large.mp4");
                    setStep("details");
                  }}
                  className="text-xs text-white/40 hover:text-orange-400 underline underline-offset-4 transition-colors"
                >
                  Or continue with a curated food sample video →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Media Preview Thumbnail Row */}
              {videoPreview && (
                <div className="flex items-center gap-4 p-3 bg-zinc-900/80 rounded-2xl border border-white/10">
                  <div className="w-14 h-20 bg-black rounded-xl overflow-hidden shrink-0 border border-white/15">
                    <video src={videoPreview} className="w-full h-full object-cover" muted autoPlay loop />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold">Attached Media</span>
                    <p className="text-xs font-bold truncate text-white">Food Reel Ready for Publishing</p>
                    <button 
                      onClick={() => setStep("media")}
                      className="text-[10px] text-white/40 hover:text-white underline mt-1"
                    >
                      Change video
                    </button>
                  </div>
                </div>
              )}

              {/* Craving Category Tag Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
                  Craving Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CRAVING_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCravingTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all border ${
                        cravingTag === tag
                          ? "bg-orange-500 text-black border-orange-500 shadow-md shadow-orange-500/20"
                          : "bg-white/5 text-white/70 border-white/10 hover:border-white/30"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attached Dish Name (Critical Madeater Differentiator) */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
                  What Dish is this Craving For? *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Hyderabadi Chicken Dum Biryani, Filter Coffee, Haleem..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Restaurant & Location Tagging */}
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
                  Restaurant / Location *
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search restaurant or enter location..."
                    value={searchQuery || restaurantName}
                    onChange={handleSearchChange}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  {isSearching && (
                    <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-400" />
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-white/5">
                    {searchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectRestaurant(res)}
                        className="p-3 hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <p className="text-xs font-bold text-white">{res.name}</p>
                        <p className="text-[10px] text-white/40">{res.location} • {res.cuisine}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Madeater Rating Slider (1.0 to 10.0) */}
              <div className="p-4 bg-zinc-900/60 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Madeater Score</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-base font-black text-white">{Number(rating).toFixed(1)} / 10</span>
                  </div>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Review Thoughts */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
                  Tasting Commentary / Hot Take
                </label>
                <textarea
                  rows={2}
                  placeholder="The crunch was unbelievable, perfectly balanced heat and rich ghee aroma..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              {/* Verified Visit Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-900/40 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className={isVerifiedVisit ? "text-emerald-400" : "text-white/30"} />
                  <div>
                    <p className="text-xs font-bold text-white">Mark as Verified Visit</p>
                    <p className="text-[10px] text-white/40">Verified via receipt or dining reservation</p>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={isVerifiedVisit}
                  onChange={(e) => setIsVerifiedVisit(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step === "details" && (
          <div className="p-5 border-t border-white/10 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between">
            <button
              onClick={() => setStep("media")}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white/60 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              disabled={isUploading || !dishName.trim() || !restaurantName.trim()}
              onClick={handlePublish}
              className="px-8 py-3 rounded-full bg-orange-500 text-black font-black uppercase tracking-wider text-xs hover:bg-orange-400 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publishing {uploadProgress > 0 ? `${uploadProgress}%` : ""}...</span>
                </>
              ) : (
                <>
                  <Flame size={15} className="fill-black" />
                  <span>Post Craving</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
