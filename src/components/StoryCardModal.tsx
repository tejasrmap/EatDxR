import React, { useState, useRef } from "react";
import { Review } from "../types";
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Sparkles, 
  Star, 
  MapPin, 
  Quote, 
  Check, 
  Loader2, 
  Flame, 
  Award, 
  Utensils 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { triggerHaptic } from "../services/nativeService";

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
}

type StoryTheme = "cinematic" | "editorial" | "neon";

export const StoryCardModal: React.FC<StoryCardModalProps> = ({ isOpen, onClose, review }) => {
  const [theme, setTheme] = useState<StoryTheme>("cinematic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const images = review.dishes?.filter(d => d.image).map(d => d.image) || [];
  const heroImage = images[0] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";
  const primaryDish = review.dishes?.[0];
  const date = parseFirebaseDate(review.createdAt);
  const formattedDate = format(date, "MMM dd, yyyy");
  const ratingScore = review.rating <= 5 ? (review.rating * 2).toFixed(1) : review.rating.toFixed(1);

  // Convert remote image to safe data URL to avoid CORS tainting
  const convertImagesToBase64 = async (element: HTMLElement) => {
    const imgElements = Array.from(element.getElementsByTagName("img"));
    const promises = imgElements.map(async (img) => {
      if (!img.src || img.src.startsWith("data:")) return;
      try {
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(img.src)}&output=png`;
        const res = await fetch(proxyUrl);
        const blob = await res.blob();
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result as string;
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn("Could not proxy image:", err);
      }
    });
    await Promise.all(promises);
  };

  const getCardBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    await convertImagesToBase64(cardRef.current);
    await new Promise(r => setTimeout(r, 250));

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0a0a0c",
        cacheBust: true,
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (err) {
      console.error("Story card capture error:", err);
      return null;
    }
  };

  // 1. Download to phone
  const handleDownload = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await getCardBlob();
      if (!blob) throw new Error("Could not capture card");

      const link = document.createElement("a");
      link.download = `Madeater-Story-${review.restaurantName.replace(/\s+/g, "_")}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      toast.success("Story card saved to your photos!");
    } catch (err) {
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Native Share (Instagram Stories, WhatsApp, etc.)
  const handleNativeShare = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await getCardBlob();
      if (!blob) throw new Error("Capture failed");

      const file = new File([blob], "madeater-story.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${review.restaurantName} Review by ${review.userName}`,
          text: `Read my critique of ${review.restaurantName} on Madeater! ⭐ ${ratingScore}/10`,
        });
        toast.success("Shared successfully!");
      } else if (navigator.share) {
        await navigator.share({
          title: `${review.restaurantName} Review`,
          text: `"${review.content}" — Rated ${ratingScore}/10 on Madeater`,
          url: window.location.href,
        });
      } else {
        // Fallback: download automatically
        const link = document.createElement("a");
        link.download = `Madeater-Story-${review.restaurantName.replace(/\s+/g, "_")}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        toast.success("Image saved! Open Instagram to share to your Story.");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Share cancelled or not supported on this device.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Copy to Clipboard
  const handleCopy = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await getCardBlob();
      if (!blob) throw new Error("Capture failed");

      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob })
        ]);
        setCopied(true);
        toast.success("Story card copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      } else {
        navigator.clipboard.writeText(window.location.href);
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
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Studio Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative w-full max-w-lg bg-[#0f0f13] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 text-white flex flex-col items-center max-h-[95vh] overflow-y-auto"
        >
          {/* Studio Header */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Story Studio</h3>
                <p className="text-[10px] text-white/50">9:16 Instagram & Social Story Card</p>
              </div>
            </div>

            <button
              onClick={() => { triggerHaptic(); onClose(); }}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer active:scale-90"
            >
              <X size={16} />
            </button>
          </div>

          {/* Theme Selector Pills */}
          <div className="w-full grid grid-cols-3 gap-2 p-1 bg-zinc-900/90 rounded-2xl border border-white/10 mb-4">
            <button
              onClick={() => { triggerHaptic(); setTheme("cinematic"); }}
              className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                theme === "cinematic" ? "bg-white text-black shadow-md" : "text-white/50 hover:text-white"
              }`}
            >
              🎬 Cinematic
            </button>
            <button
              onClick={() => { triggerHaptic(); setTheme("editorial"); }}
              className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                theme === "editorial" ? "bg-white text-black shadow-md" : "text-white/50 hover:text-white"
              }`}
            >
              📰 Editorial
            </button>
            <button
              onClick={() => { triggerHaptic(); setTheme("neon"); }}
              className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                theme === "neon" ? "bg-white text-black shadow-md" : "text-white/50 hover:text-white"
              }`}
            >
              ⚡ Street Neon
            </button>
          </div>

          {/* Story Card Preview Stage (9:16 Responsive Frame) */}
          <div className="relative w-[280px] sm:w-[320px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-white/20 select-none bg-black">
            {/* The Actual Rendered Card (Used by htmlToImage) */}
            <div
              ref={cardRef}
              className={`w-full h-full flex flex-col justify-between p-5 relative text-white ${
                theme === "cinematic"
                  ? "bg-gradient-to-b from-[#0a0a0c] via-[#111116] to-[#0a0a0c]"
                  : theme === "editorial"
                  ? "bg-[#0b0b0d] border-[6px] border-amber-950/40"
                  : "bg-gradient-to-b from-[#140b04] via-[#0d0906] to-[#050302]"
              }`}
            >
              {/* Background ambient texture */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center opacity-25 filter blur-sm scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90 pointer-events-none" />

              {/* CARD TOP: Madeater Critic Badge & Location */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[9px] font-black uppercase tracking-widest text-orange-400">
                  <Award size={11} />
                  <span>Critic Pass</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-white/70 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  <MapPin size={10} className="text-orange-400" />
                  <span>{review.city || "Verified Spot"}</span>
                </div>
              </div>

              {/* CARD CENTER: Hero Photo + Dish + Rating */}
              <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-3">
                {/* Photo Frame */}
                <div className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ${
                  theme === "cinematic"
                    ? "border-2 border-white/20"
                    : theme === "editorial"
                    ? "border-4 border-amber-400/30"
                    : "border-2 border-orange-500/50 shadow-orange-500/20"
                }`}>
                  <img
                    src={heroImage}
                    alt={review.restaurantName}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Must-Order Ribbon */}
                  {primaryDish?.isMustOrder && (
                    <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider shadow-md">
                      <Flame size={10} />
                      <span>Must-Order</span>
                    </div>
                  )}

                  {/* Score Pill overlay */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 shadow-lg">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-white">{ratingScore}</span>
                    <span className="text-[9px] text-white/50">/10</span>
                  </div>
                </div>

                {/* Restaurant & Dish Title */}
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-white line-clamp-1">
                    {review.restaurantName}
                  </h2>
                  {primaryDish && (
                    <p className="text-xs font-serif italic text-orange-400 font-bold line-clamp-1 mt-0.5">
                      "{primaryDish.name}"
                    </p>
                  )}
                </div>

                {/* Critic Quote Snippet */}
                {review.content && (
                  <div className="relative px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 max-w-full">
                    <Quote size={12} className="text-orange-400/60 mb-1 mx-auto" />
                    <p className="text-[11px] text-white/80 font-serif italic line-clamp-3 leading-relaxed">
                      "{review.content}"
                    </p>
                  </div>
                )}
              </div>

              {/* CARD BOTTOM: Critic Signature & Madeater Watermark */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={review.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${review.userId}`}
                    alt={review.userName}
                    crossOrigin="anonymous"
                    className="w-7 h-7 rounded-full border border-white/20 object-cover"
                  />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white leading-none line-clamp-1">
                      {review.userName}
                    </p>
                    <p className="text-[8px] text-white/40 font-mono mt-0.5">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-wider text-orange-400 block leading-none">
                    MADEATER
                  </span>
                  <span className="text-[7px] text-white/30 uppercase tracking-widest font-mono">
                    Dish Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5">
            {/* Share via Native */}
            <button
              onClick={handleNativeShare}
              disabled={isGenerating}
              className="col-span-2 sm:col-span-1 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin text-black" />
              ) : (
                <>
                  <Share2 size={15} />
                  <span>Share Story</span>
                </>
              )}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>Save Photo</span>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              disabled={isGenerating}
              className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
