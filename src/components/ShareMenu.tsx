import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Review } from "../types";
import { X, Send, Instagram, MessageCircle, Share2, Copy, Download, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { triggerHaptic } from "../services/nativeService";
import { generateReviewStoryBlob } from "../utils/storyCanvasGenerator";
import { getShareUrl, openInstagramStoryDirect } from "../utils/shareUrl";

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ isOpen, onClose, review }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lock background scroll when open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const reviewUrl = getShareUrl(`/restaurant/${review.restaurantId}`);
  const shareTitle = `${review.restaurantName} on Madeater`;
  const shareText = `Check out this review of ${review.restaurantName} (${review.rating}★) on Madeater! 🍽️✨`;

  // 1. Native System Share (WhatsApp, Instagram, AirDrop, etc.)
  const handleNativeShare = async () => {
    triggerHaptic();
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: reviewUrl,
        });
        toast.success("Shared successfully!");
        onClose();
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn("Native share error:", err);
        }
      }
    }

    // Fallback: Copy link
    handleCopyLink();
  };

  // 2. Share directly to Instagram Story with 9:16 Story Card
  const handleInstagramStoryShare = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await generateReviewStoryBlob(review, 'cinematic');
      if (!blob) throw new Error("Could not generate story card");

      const filename = `Madeater-Story-${(review.restaurantName || "Review").replace(/\s+/g, '_')}.png`;

      // Download/save copy to device
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      // Copy image to clipboard so user can paste into story if desired
      if (navigator.clipboard && (window as any).ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ "image/png": blob })
          ]);
        } catch {
          // ignore clipboard errors
        }
      }

      toast.success("Story card saved! Opening Instagram Story...");
      setTimeout(() => {
        openInstagramStoryDirect();
      }, 350);
    } catch (error) {
      console.error("Story generation error:", error);
      toast.success("Opening Instagram Story...");
      openInstagramStoryDirect();
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Share to WhatsApp Direct
  const handleShareWhatsApp = () => {
    triggerHaptic();
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${reviewUrl}`)}`;
    window.open(url, "_blank");
  };

  // 4. Share to X (Twitter)
  const handleShareX = () => {
    triggerHaptic();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(reviewUrl)}`;
    window.open(url, "_blank");
  };

  // 5. Copy Link
  const handleCopyLink = () => {
    triggerHaptic();
    navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden pointer-events-auto">
      {/* Fullscreen Backdrop */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerHaptic();
          onClose();
        }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer transition-opacity"
      />
      
      {/* Modal Dialog (Bottom Sheet on Mobile, Centered Card on Desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 80, scale: 0.98 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="relative w-full max-w-md bg-zinc-950 border border-white/15 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col pointer-events-auto my-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe / Drag Pill Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-zinc-950">
          <div className="w-12 h-1.5 rounded-full bg-white/25" />
        </div>

        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Share2 size={15} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white truncate">{review.restaurantName}</h3>
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Share Critic Experience</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation();
              triggerHaptic(); 
              onClose(); 
            }} 
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer active:scale-90 shrink-0 shadow-lg"
            title="Close Share Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Action Stack */}
        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto max-h-[calc(90vh-130px)] scrollbar-hide">
          
          {/* 1. Native System Share */}
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button 
              type="button"
              onClick={handleNativeShare}
              className="w-full h-14 flex items-center justify-between px-5 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Share2 size={18} />
                <span>Share via Device Apps...</span>
              </div>
              <span className="text-[10px] font-bold bg-black/20 px-2.5 py-0.5 rounded-full">Native</span>
            </button>
          )}

          {/* 2. Direct Instagram Story Action */}
          <button 
            type="button"
            onClick={handleInstagramStoryShare}
            disabled={isGenerating}
            className="w-full h-14 flex items-center justify-between px-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-pink-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Instagram size={18} />
              <div className="flex flex-col text-left">
                <span>Share to Instagram Story</span>
                <span className="text-[9px] text-white/70 font-mono normal-case">Direct 9:16 Story Poster</span>
              </div>
            </div>
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Instagram size={16} />}
          </button>

          {/* 3. Quick Share Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* WhatsApp */}
            <button 
              type="button"
              onClick={handleShareWhatsApp} 
              className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95 cursor-pointer group"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-[#25D366]/15 text-[#25D366] rounded-full group-hover:scale-110 transition-transform">
                <MessageCircle size={20} />
              </div>
              <span className="text-[10px] font-bold text-white/70 group-hover:text-white">WhatsApp</span>
            </button>

            {/* X / Twitter */}
            <button 
              type="button"
              onClick={handleShareX} 
              className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95 cursor-pointer group"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-full group-hover:scale-110 transition-transform">
                <Send size={18} />
              </div>
              <span className="text-[10px] font-bold text-white/70 group-hover:text-white">X / Twitter</span>
            </button>

            {/* Copy Link */}
            <button 
              type="button"
              onClick={handleCopyLink} 
              className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95 cursor-pointer group"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-orange-500/15 text-orange-400 rounded-full group-hover:scale-110 transition-transform">
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </div>
              <span className="text-[10px] font-bold text-white/70 group-hover:text-white">{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-black/40 border-t border-white/5 text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">MADEATER • Food Discovery & Reviews</p>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
