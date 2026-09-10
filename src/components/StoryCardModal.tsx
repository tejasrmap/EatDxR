import React, { useState, useRef, useEffect } from "react";
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
  ExternalLink,
  Instagram
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
  const [base64Hero, setBase64Hero] = useState<string>("");
  const [base64Avatar, setBase64Avatar] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  const images = review?.dishes?.filter(d => d.image).map(d => d.image) || [];
  const rawHeroImage = images[0] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";
  const rawAvatar = review?.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${review?.userId || 'critic'}`;
  const primaryDish = review?.dishes?.[0];
  const date = parseFirebaseDate(review?.createdAt);
  const formattedDate = format(date, "MMM dd, yyyy");
  const ratingScore = review ? (review.rating <= 5 ? (review.rating * 2).toFixed(1) : review.rating.toFixed(1)) : "9.0";

  // Pre-load and convert images to Base64 in state to prevent canvas CORS tainting & UI glitches
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const toBase64 = async (url: string): Promise<string> => {
      if (!url) return "";
      if (url.startsWith("data:")) return url;
      try {
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png`;
        const res = await fetch(proxyUrl, { mode: 'cors' });
        const blob = await res.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(url);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return url;
      }
    };

    toBase64(rawHeroImage).then((b64) => {
      if (isMounted) setBase64Hero(b64);
    });

    toBase64(rawAvatar).then((b64) => {
      if (isMounted) setBase64Avatar(b64);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, rawHeroImage, rawAvatar]);

  if (!isOpen || !review) return null;

  const getCardBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: "#050505",
        cacheBust: true,
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (err) {
      console.error("Story card capture error:", err);
      // Fallback capture
      try {
        const fallbackDataUrl = await htmlToImage.toPng(cardRef.current, {
          pixelRatio: 1.5,
        });
        const res = await fetch(fallbackDataUrl);
        return await res.blob();
      } catch {
        return null;
      }
    }
  };

  const openInstagramApp = () => {
    // Attempt mobile Instagram deep-links
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Instagram Stories camera deep link
      window.location.href = "instagram://story-camera";
      setTimeout(() => {
        window.location.href = "instagram://app";
      }, 500);
    } else {
      window.open("https://www.instagram.com", "_blank");
    }
  };

  // 1. Download to device
  const handleDownload = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await getCardBlob();
      if (!blob) throw new Error("Could not capture card");

      const link = document.createElement("a");
      link.download = `Madeater-Story-${review.restaurantName.replace(/[^a-z0-9]/gi, "_")}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      toast.success("Story card saved to your photos!");
    } catch (err) {
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Share to Instagram Stories (Native Share + Direct Deep Link Fallback)
  const handleInstagramShare = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await getCardBlob();
      if (!blob) throw new Error("Capture failed");

      const file = new File([blob], `Madeater-${review.restaurantName.replace(/[^a-z0-9]/gi, '_')}.png`, { type: "image/png" });

      // Automatically download first as a reliable backup
      const link = document.createElement("a");
      link.download = file.name;
      link.href = URL.createObjectURL(blob);
      link.click();

      // Check if navigator.share with files is supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Madeater Review: ${review.restaurantName}`,
          text: `Rated ${ratingScore}/10 on Madeater! Check out my food review.`,
        });
        toast.success("Shared! Opening Instagram...");
        setTimeout(openInstagramApp, 800);
      } else {
        toast.success("Card saved! Redirecting to Instagram...");
        setTimeout(openInstagramApp, 500);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.success("Card downloaded! Redirecting to Instagram...");
        setTimeout(openInstagramApp, 300);
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

  const displayHero = base64Hero || rawHeroImage;
  const displayAvatar = base64Avatar || rawAvatar;

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
                <p className="text-[10px] text-white/50">9:16 Instagram & Social Story Card</p>
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
            {/* The Actual Rendered Card */}
            <div
              ref={cardRef}
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
              <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-2.5">
                {/* Photo Frame */}
                <div className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ${
                  theme === "cinematic"
                    ? "border-2 border-white/20"
                    : theme === "editorial"
                    ? "border-2 border-amber-400/30"
                    : "border-2 border-orange-500/50 shadow-orange-500/20"
                }`}>
                  <img
                    src={displayHero}
                    alt={review.restaurantName}
                    className="w-full h-full object-cover"
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
                  {primaryDish && (
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
              <div className="relative z-10 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={displayAvatar}
                    alt={review.userName}
                    className="w-6 h-6 rounded-full border border-white/20 object-cover"
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
          <div className="w-full space-y-2 mt-4">
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={14} />
                <span>Save Photo</span>
              </button>

              <button
                onClick={openInstagramApp}
                className="h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-orange-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Open Instagram</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
