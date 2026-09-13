import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Camera as CameraIcon, 
  Image as ImageIcon, 
  Flame, 
  Star, 
  HelpCircle, 
  MapPin, 
  Check, 
  Sparkles,
  Send,
  Sliders
} from "lucide-react";
import { useAuth } from "../App";
import { capturePhoto, triggerHaptic } from "../services/nativeService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

const SPICE_LEVELS = [
  { level: 1, label: "Mild & Flavorful", emoji: "🌶️" },
  { level: 2, label: "Medium Warmth", emoji: "🌶️🌶️" },
  { level: 3, label: "Authentic Spicy", emoji: "🌶️🌶️🌶️" },
  { level: 4, label: "Fiery Hot", emoji: "🌶️🌶️🌶️🌶️" },
  { level: 5, label: "Ghost Pepper Nuclear", emoji: "🌶️🌶️🌶️🌶️🌶️ 🔥" }
];

export const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated
}) => {
  const { user, dishdUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [activeTab, setActiveTab] = useState<"stickers" | "caption">("stickers");

  // Sticker 1: Spice Meter
  const [enableSpice, setEnableSpice] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState(3);

  // Sticker 2: Rate this Dish
  const [enableRating, setEnableRating] = useState(false);
  const [ratingScore, setRatingScore] = useState(9.0);

  // Sticker 3: Would You Eat This? Poll
  const [enablePoll, setEnablePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("Would you eat this?");

  // Sticker 4: Restaurant Tag
  const [enableRestaurant, setEnableRestaurant] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");

  const handleNativeCamera = async () => {
    triggerHaptic();
    const photo = await capturePhoto();
    if (photo) {
      setMediaUrl(photo);
    } else {
      // Fallback to file picker if camera prompt was cancelled or running on web
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaUrl(event.target?.result as string);
      triggerHaptic();
    };
    reader.readAsDataURL(file);
  };

  const handlePublishStory = () => {
    if (!mediaUrl) {
      toast.error("Please add a photo or snap a picture first");
      return;
    }

    triggerHaptic();

    const username = dishdUser?.username || user?.displayName?.toLowerCase().replace(/\s+/g, "_") || "critic";
    const displayName = dishdUser?.displayName || user?.displayName || "Food Critic";
    const userPhoto = dishdUser?.photoURL || user?.photoURL || "";

    const newStory = {
      id: `story_${Date.now()}`,
      criticId: user?.uid || "anon",
      criticName: displayName,
      criticUsername: username,
      criticPhoto: userPhoto,
      mediaUrl: mediaUrl,
      dishName: caption.trim() || undefined,
      restaurantName: enableRestaurant && restaurantName.trim() ? restaurantName.trim() : undefined,
      rating: enableRating ? ratingScore : undefined,
      spiceLevel: enableSpice ? spiceLevel : undefined,
      poll: enablePoll ? {
        question: pollQuestion.trim() || "Would you eat this?",
        yesVotes: 3,
        noVotes: 1,
        userVote: undefined
      } : undefined,
      timestamp: "Just now",
      createdAt: Date.now()
    };

    try {
      const saved = localStorage.getItem("madeater_user_stories");
      const stories = saved ? JSON.parse(saved) : [];
      stories.unshift(newStory);
      localStorage.setItem("madeater_user_stories", JSON.stringify(stories));
      window.dispatchEvent(new Event("madeater_story_created"));
      window.dispatchEvent(new Event("storage"));
      toast.success("🎉 Your Food Story is now live for 24 hours!");
      onStoryCreated?.();
      onClose();
    } catch (e) {
      console.error("Story save error:", e);
      toast.error("Failed to share story.");
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-0 sm:p-4 select-none">
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <div className="relative w-full h-full sm:max-w-md sm:h-[92vh] sm:rounded-3xl bg-zinc-950 border border-white/10 overflow-hidden flex flex-col justify-between shadow-2xl">
        
        {/* Top Header Bar */}
        <div className="relative z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <button
            type="button"
            onClick={() => { triggerHaptic(); onClose(); }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          <span className="text-xs font-black uppercase tracking-widest text-white/90">
            Create Story
          </span>

          <button
            type="button"
            onClick={handlePublishStory}
            disabled={!mediaUrl}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-black text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <span>Share</span>
            <Send size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Media Preview Canvas */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {mediaUrl ? (
            <>
              <img 
                src={mediaUrl} 
                alt="Story Canvas" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Interactive Stickers Rendered on Canvas */}
              <div className="absolute inset-x-4 top-16 space-y-2.5 pointer-events-none z-20">
                
                {/* 1. Restaurant Tag Sticker */}
                {enableRestaurant && restaurantName && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 text-white shadow-xl pointer-events-auto"
                  >
                    <MapPin size={13} className="text-orange-400 shrink-0" />
                    <span className="text-xs font-bold truncate max-w-[200px]">{restaurantName}</span>
                  </motion.div>
                )}

                {/* 2. Spice Meter Sticker */}
                {enableSpice && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="block p-3 rounded-2xl bg-black/65 backdrop-blur-xl border border-orange-500/40 text-white shadow-xl max-w-xs pointer-events-auto"
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-orange-400 flex items-center gap-1">
                        <Flame size={13} className="fill-orange-500" /> Spice Heat
                      </span>
                      <span className="text-xs">{SPICE_LEVELS[spiceLevel - 1]?.emoji}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
                      <div 
                        style={{ width: `${(spiceLevel / 5) * 100}%` }}
                        className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-300 font-semibold mt-1">
                      {SPICE_LEVELS[spiceLevel - 1]?.label}
                    </p>
                  </motion.div>
                )}

                {/* 3. Star Rating Sticker */}
                {enableRating && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/65 backdrop-blur-xl border border-amber-400/40 text-white shadow-xl pointer-events-auto"
                  >
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-black text-amber-300">{ratingScore.toFixed(1)}</span>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Critic Score</span>
                  </motion.div>
                )}

                {/* 4. Would You Eat This? Poll Sticker */}
                {enablePoll && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/25 text-white shadow-2xl max-w-xs space-y-2 pointer-events-auto"
                  >
                    <p className="text-xs font-bold text-center text-white drop-shadow">
                      {pollQuestion || "Would you eat this?"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-black">
                      <div className="py-2 rounded-xl bg-orange-500/30 border border-orange-500/50 text-orange-200">
                        Yes 🤤
                      </div>
                      <div className="py-2 rounded-xl bg-white/10 border border-white/20 text-zinc-300">
                        Pass 🙅‍♂️
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Caption Overlay at Bottom of Media */}
              {caption.trim() && (
                <div className="absolute bottom-4 inset-x-4 z-20 pointer-events-none">
                  <p className="text-xs font-semibold text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl inline-block max-w-full drop-shadow">
                    {caption}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 shadow-xl">
                <CameraIcon size={32} />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Capture Foodie Story</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Snap an instant craving photo or pick one from your gallery to add interactive food stickers.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleNativeCamera}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  <CameraIcon size={16} />
                  <span>Snap Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-wider border border-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <ImageIcon size={16} />
                  <span>Gallery</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Drawer / Sticker Studio */}
        {mediaUrl && (
          <div className="bg-[#121215] border-t border-white/10 p-3 sm:p-4 space-y-3">
            
            {/* Tabs: Stickers vs Caption */}
            <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("stickers")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "stickers" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles size={13} className="text-orange-400" />
                <span>Food Stickers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("caption")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "caption" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sliders size={13} className="text-orange-400" />
                <span>Caption & Dish</span>
              </button>
            </div>

            {/* TAB 1: STICKERS DRAWER */}
            {activeTab === "stickers" && (
              <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide pr-1">
                
                {/* 1. Spice Meter Sticker Toggle & Slider */}
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Flame size={14} className="text-orange-400 fill-orange-400" />
                      <span>Spice Meter (1 - 5)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { triggerHaptic(); setEnableSpice(!enableSpice); }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        enableSpice ? "bg-orange-500" : "bg-zinc-700"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        enableSpice ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {enableSpice && (
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-300 font-bold">
                        <span>Level {spiceLevel}: {SPICE_LEVELS[spiceLevel - 1]?.label}</span>
                        <span>{SPICE_LEVELS[spiceLevel - 1]?.emoji}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={spiceLevel}
                        onChange={(e) => { triggerHaptic(); setSpiceLevel(Number(e.target.value)); }}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Rate This Dish Sticker */}
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span>Rate this Dish (Critic Score)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { triggerHaptic(); setEnableRating(!enableRating); }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        enableRating ? "bg-orange-500" : "bg-zinc-700"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        enableRating ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {enableRating && (
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-amber-300">{ratingScore.toFixed(1)} / 10.0</span>
                      <input 
                        type="range" 
                        min="5.0" 
                        max="10.0" 
                        step="0.1"
                        value={ratingScore}
                        onChange={(e) => { triggerHaptic(); setRatingScore(Number(e.target.value)); }}
                        className="flex-1 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Would You Eat This? Poll Sticker */}
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <HelpCircle size={14} className="text-pink-400" />
                      <span>"Would You Eat This?" Poll</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { triggerHaptic(); setEnablePoll(!enablePoll); }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        enablePoll ? "bg-orange-500" : "bg-zinc-700"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        enablePoll ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {enablePoll && (
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Poll question (e.g. Would you try this?)..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

                {/* 4. Restaurant Location Tag */}
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <MapPin size={14} className="text-emerald-400" />
                      <span>Restaurant Location Tag</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { triggerHaptic(); setEnableRestaurant(!enableRestaurant); }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        enableRestaurant ? "bg-orange-500" : "bg-zinc-700"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        enableRestaurant ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {enableRestaurant && (
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="Restaurant name (e.g. Meghana Foods, Truffles)..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: CAPTION & RETAKE */}
            {activeTab === "caption" && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add dish name or commentary (e.g. Crispy Butter Dosa)..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setMediaUrl(null); }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                  >
                    Retake / Change Photo
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
