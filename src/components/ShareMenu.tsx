import React, { useState, useRef } from "react";
import { Review } from "../types";
import { X, Send, Instagram, MessageCircle, Share2, Copy, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { ReviewPoster } from "./ReviewPoster";

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ isOpen, onClose, review }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const posterId = `share-poster-${review.id}`;

  const generatePoster = async () => {
    const element = document.getElementById(posterId);
    if (!element) return null;

    setIsGenerating(true);
    try {
      // Find all images in the poster to ensure they are loaded
      const images = element.getElementsByTagName('img');
      const loadPromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue on error
        });
      });
      await Promise.all(loadPromises);

      // Short delay to ensure browser paint
      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(element, {
        useCORS: true,
        background: "#0a0a0a",
        logging: true, // Enable console logging for debugging
        allowTaint: false, // Don't allow non-CORS images to "taint" the canvas
        // @ts-ignore - 'scale' is valid but might not be in the types
        scale: 2 
      });

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      return dataUrl;
    } catch (error) {
      console.error("Poster generation error:", error);
      toast.error("Failed to generate the cinematic poster.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToInstagram = async () => {
    const imgData = await generatePoster();
    if (!imgData) return;

    // Browser cannot direct share to IG story, so we download
    const link = document.createElement("a");
    link.download = `EatR_Poster_${review.restaurantName.replace(/\s+/g, '_')}.png`;
    link.href = imgData;
    link.click();
    
    toast.success("Poster generated! Upload it to your Instagram Story.");
  };

  const shareToWhatsApp = () => {
    const text = `Check out my latest culinary narrative at ${review.restaurantName}! 🍽️\n\nRead more on EatR: ${window.location.origin}/restaurant/${review.restaurantId}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareToX = () => {
    const text = `Just dropped a new culinary review of ${review.restaurantName} on EatR! 🍷✨`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin + '/restaurant/' + review.restaurantId)}`;
    window.open(url, "_blank");
  };

  const copyLink = () => {
    const url = `${window.location.origin}/restaurant/${review.restaurantId}`;
    navigator.clipboard.writeText(url);
    toast.success("Review link copied to clipboard!");
  };

  const downloadPoster = async () => {
    const imgData = await generatePoster();
    if (imgData) {
      const link = document.createElement("a");
      link.download = `EatR_Review_${review.id}.png`;
      link.href = imgData;
      link.click();
      toast.success("Cinematic poster downloaded!");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
               <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">The Curation Stage</h2>
               <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="p-8 space-y-4">
               {/* Primary Generation Mode */}
               <button 
                  onClick={shareToInstagram}
                  disabled={isGenerating}
                  className="w-full h-16 flex items-center justify-between px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl group active:scale-95 transition-all disabled:opacity-50"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                        <Instagram size={24} className="text-white" />
                     </div>
                     <div className="flex flex-col items-start translate-y-0.5">
                        <span className="text-sm font-black text-white uppercase tracking-widest">Instagram Story</span>
                        <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Generate Poster</span>
                     </div>
                  </div>
                  {isGenerating ? <Loader2 size={16} className="text-white animate-spin" /> : <Download size={16} className="text-white/60" />}
               </button>

               {/* Grid of Other Options */}
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={shareToWhatsApp} className="flex flex-col items-center justify-center gap-3 p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 transition-all group active:scale-95">
                     <div className="w-12 h-12 flex items-center justify-center bg-[#25D366]/10 text-[#25D366] rounded-full group-hover:scale-110 transition-transform">
                        <MessageCircle size={24} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">WhatsApp</span>
                  </button>
                  <button onClick={shareToX} className="flex flex-col items-center justify-center gap-3 p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 transition-all group active:scale-95">
                     <div className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full group-hover:scale-110 transition-transform">
                        <Send size={20} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">X / Twitter</span>
                  </button>
                  <button onClick={copyLink} className="flex flex-col items-center justify-center gap-3 p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 transition-all group active:scale-95">
                     <div className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full group-hover:scale-110 transition-transform">
                        <Copy size={20} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">Copy Link</span>
                  </button>
                  <button onClick={downloadPoster} disabled={isGenerating} className="flex flex-col items-center justify-center gap-3 p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 transition-all group active:scale-95 disabled:opacity-50">
                     <div className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full group-hover:scale-110 transition-transform">
                        {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">Poster PNG</span>
                  </button>
               </div>
            </div>
            
            <div className="p-6 bg-black/40 text-center">
               <p className="text-[8px] uppercase font-black text-white/10 tracking-[0.5em]">The Narrative Continuous • EATDxR</p>
            </div>
          </motion.div>

          {/* Hidden Poster Stage for Capture */}
          <ReviewPoster review={review} id={posterId} />
        </div>
      )}
    </AnimatePresence>
  );
};
