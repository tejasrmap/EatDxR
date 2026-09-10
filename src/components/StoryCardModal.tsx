import React, { useState } from "react";
import { Review } from "../types";
import { 
  X, 
  Download, 
  Copy, 
  Sparkles, 
  Star, 
  MapPin, 
  Quote, 
  Check, 
  Loader2, 
  Flame, 
  Award, 
  ExternalLink,
  Instagram,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { triggerHaptic } from "../services/nativeService";
import { generateReviewStoryBlob, StoryTheme } from "../utils/storyCanvasGenerator";

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
}

export const StoryCardModal: React.FC<StoryCardModalProps> = ({ isOpen, onClose, review }) => {
  const [theme, setTheme] = useState<StoryTheme>("cinematic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !review) return null;

  const images = review?.dishes?.filter(d => d.image).map(d => d.image) || [];
  const heroImage = images[0] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";
  const avatar = review?.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${review?.userId || 'critic'}`;
  const primaryDish = review?.dishes?.[0];
  const date = parseFirebaseDate(review?.createdAt);
  const formattedDate = format(date, "MMM dd, yyyy");
  const ratingScore = review ? (review.rating <= 5 ? (review.rating * 2).toFixed(1) : review.rating.toFixed(1)) : "9.0";

  const openInstagramDirect = () => {
    triggerHaptic();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Direct Instagram story camera deep link
      window.location.href = "instagram://story-camera";
      setTimeout(() => {
        window.location.href = "https://instagram.com";
      }, 1000);
    } else {
      window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
    }
  };

  // 1. Download to device (Instant & Glitch-free)
  const handleDownload = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await generateReviewStoryBlob(review, theme);
      if (!blob) throw new Error("Could not generate image");

      const filename = `Madeater-Story-${(review.restaurantName || "Review").replace(/[^a-z0-9]/gi, "_")}.png`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Story card saved to your photos!");
    } catch (err) {
      console.error("Story download error:", err);
      toast.error("Failed to generate Story image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Share to Instagram Stories (Native Share Sheet + File Download + Instagram App Launch)
  const handleInstagramShare = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await generateReviewStoryBlob(review, theme);
      if (!blob) throw new Error("Generation failed");

      const filename = `Madeater-Story-${(review.restaurantName || "Review").replace(/[^a-z0-9]/gi, "_")}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // Automatically trigger download so user always has the image ready
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Check if native Web Share API with files is supported (Mobile Chrome, Safari iOS, Android Webview)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Madeater Critic: ${review.restaurantName}`,
          text: `Rated ${ratingScore}/10 on Madeater! Check out my food review.`,
        });
        toast.success("Shared! Opening Instagram...");
      } else {
        toast.success("Story card saved! Redirecting to Instagram...");
        setTimeout(openInstagramDirect, 400);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Share fallback:", err);
        toast.success("Story card saved! Opening Instagram...");
        setTimeout(openInstagramDirect, 300);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Copy Story Card Image to Clipboard
  const handleCopy = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await generateReviewStoryBlob(review, theme);
      if (!blob) throw new Error("Generation failed");

      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob })
        ]);
        setCopied(true);
        toast.success("9:16 Story card copied to clipboard! Paste into Instagram.");
        setTimeout(() => setCopied(false), 2500);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Review link copied to clipboard!");
      }
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Review link copied to clipboard!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-xl">
        {/* Studio Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl z-10 text-white flex flex-col items-center my-auto max-h-[95vh] overflow-y-auto"
        >
          {/* Studio Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Story Studio</h3>
                <p className="text-[10px] text-white/50">9:16 Instagram Story & Reel Card</p>
              </div>
            </div>

            <button
              onClick={() => { triggerHaptic(); onClose(); }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Theme Selector Pills */}
          <div className="w-full grid grid-cols-3 gap-2 p-1 bg-zinc-900 rounded-2xl border border-white/10 my-3">
            <button
              onClick={() => { triggerHaptic(); setTheme("cinematic"); }}
              className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                theme === "cinematic" ? "bg-orange-500 text-black shadow-md" : "text-white/50 hover:text-white"
              }`}
            >
              🎬 Cinematic
            </button>
            <button
              onClick={() => { triggerHaptic(); setTheme("editorial"); }}
              className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                theme === "editorial" ? "bg-orange-500 text-black shadow-md" : "text-white/50 hover:text-white"
              }`}
            >
              📰 Editorial
            </button>
            <button
              onClick={() => { triggerHaptic(); setTheme("neon"); }}
              className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                theme === "neon" ? "bg-orange-500 text-black shadow-md" : "text-white/50 hover:text-white"
              }`}
            >
              ⚡ Street Neon
            </button>
          </div>

          {/* Story Card Preview Stage (9:16 Responsive Frame) */}
          <div className="relative w-full aspect-[9/16] max-w-[280px] sm:max-w-[300px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 select-none bg-black my-1">
            <div
              className={`w-full h-full flex flex-col justify-between p-4 relative text-white ${
                theme === "cinematic"
                  ? "bg-gradient-to-b from-[#0a0a0c] via-[#111116] to-[#0a0a0c]"
                  : theme === "editorial"
                  ? "bg-[#0b0b0d] border-[4px] border-amber-950/40"
                  : "bg-gradient-to-b from-[#140b04] via-[#0d0906] to-[#050302]"
              }`}
            >
              {/* Ambient backdrop */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* CARD TOP: Madeater Critic Badge & Location */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[9px] font-black uppercase tracking-widest text-orange-400">
                  <Award size={11} />
                  <span>Critic Pass</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-white/80 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  <MapPin size={10} className="text-orange-400" />
                  <span>{review.city || "Verified Spot"}</span>
                </div>
              </div>

              {/* CARD CENTER: Hero Photo + Dish + Rating */}
              <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-2">
                {/* Photo Frame */}
                <div className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ${
                  theme === "cinematic"
                    ? "border-2 border-white/20"
                    : theme === "editorial"
                    ? "border-2 border-amber-400/30"
                    : "border-2 border-orange-500/50 shadow-orange-500/20"
                }`}>
                  <img
                    src={heroImage}
                    alt={review.restaurantName}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Must-Order Ribbon */}
                  {primaryDish?.isMustOrder && (
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[8px] font-black uppercase tracking-wider shadow-md">
                      <Flame size={10} />
                      <span>Must-Order</span>
                    </div>
                  )}

                  {/* Score Pill overlay */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 shadow-lg">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-white">{ratingScore}</span>
                    <span className="text-[8px] text-white/50">/10</span>
                  </div>
                </div>

                {/* Restaurant & Dish Title */}
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-white line-clamp-1">
                    {review.restaurantName}
                  </h2>
                  {primaryDish?.name && (
                    <p className="text-xs font-serif italic text-orange-400 font-bold line-clamp-1 mt-0.5">
                      "{primaryDish.name}"
                    </p>
                  )}
                </div>

                {/* Critic Quote Snippet */}
                {review.content && (
                  <div className="relative px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 max-w-full">
                    <Quote size={10} className="text-orange-400/60 mb-0.5 mx-auto" />
                    <p className="text-[10px] text-white/80 font-serif italic line-clamp-3 leading-relaxed">
                      "{review.content}"
                    </p>
                  </div>
                )}
              </div>

              {/* CARD BOTTOM: Critic Signature & Madeater Watermark */}
              <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={avatar}
                    alt={review.userName}
                    className="w-6 h-6 rounded-full border border-white/20 object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="text-left">
                    <p className="text-[9px] font-black text-white leading-none line-clamp-1">
                      {review.userName}
                    </p>
                    <p className="text-[7px] text-white/40 font-mono mt-0.5">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-wider text-orange-400 block leading-none">
                    MADEATER
                  </span>
                  <span className="text-[7px] text-white/40 uppercase tracking-widest font-mono">
                    Dish Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="w-full space-y-2 mt-3">
            {/* 1-Tap Share to Instagram Story */}
            <button
              onClick={handleInstagramShare}
              disabled={isGenerating}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <>
                  <Instagram size={17} />
                  <span>Share to Instagram Story</span>
                </>
              )}
            </button>

            {/* Secondary Actions Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="h-10 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={13} />
                <span>Save HD</span>
              </button>

              <button
                onClick={handleCopy}
                disabled={isGenerating}
                className="h-10 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={openInstagramDirect}
                className="h-10 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-orange-400 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Instagram</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
