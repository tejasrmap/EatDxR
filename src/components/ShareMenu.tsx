import React, { useState } from "react";
import { Review } from "../types";
import { X, Send, Instagram, MessageCircle, Share2, Copy, Download, Loader2, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { triggerHaptic } from "../services/nativeService";
import { generateReviewStoryBlob } from "../utils/storyCanvasGenerator";

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ isOpen, onClose, review }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reviewUrl = `${window.location.origin}/restaurant/${review.restaurantId}`;
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

  // 2. Download 9:16 Canvas Story Card
  const handleDownloadStory = async () => {
    triggerHaptic();
    setIsGenerating(true);
    try {
      const blob = await generateReviewStoryBlob(review, 'cinematic');
      if (!blob) throw new Error("Could not generate story card");

      const link = document.createElement("a");
      link.download = `Madeater-Story-${(review.restaurantName || "Review").replace(/\s+/g, '_')}.png`;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success("Story card downloaded!");
    } catch (error) {
      console.error("Story generation error:", error);
      toast.error("Failed to generate Story card. Image proxy error.");
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

  return (
    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />
      
      {/* Modal Dialog (Bottom Sheet on Mobile, Centered on Desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-zinc-950 border border-white/15 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
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
            onClick={() => { triggerHaptic(); onClose(); }} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer active:scale-95 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Primary Action Stack */}
        <div className="p-4 sm:p-6 space-y-3">
          
          {/* 1. Native System Share */}
          {navigator.share && (
            <button 
              onClick={handleNativeShare}
              className="w-full h-14 flex items-center justify-between px-5 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Share2 size={18} />
                <span>Share via Device Apps...</span>
              </div>
              <span className="text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded-full">Native</span>
            </button>
          )}

          {/* 2. Download 9:16 Instagram Story Card */}
          <button 
            onClick={handleDownloadStory}
            disabled={isGenerating}
            className="w-full h-14 flex items-center justify-between px-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-pink-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Instagram size={18} />
              <div className="flex flex-col text-left">
                <span>Instagram Story Card</span>
                <span className="text-[9px] text-white/70 font-mono normal-case">9:16 High-Res Poster</span>
              </div>
            </div>
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          </button>

          {/* 3. Quick Share Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* WhatsApp */}
            <button 
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
    </div>
  );
};

