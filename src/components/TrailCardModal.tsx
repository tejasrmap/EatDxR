import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Copy, Sparkles, Check, 
  MapPin, Clock, IndianRupee,
  Instagram, ExternalLink, Loader2
} from 'lucide-react';
import { FoodTrail } from '../types';
import { triggerHaptic } from '../services/nativeService';
import { toast } from 'sonner';
import { generateTrailStoryBlob, StoryTheme } from '../utils/storyCanvasGenerator';

interface TrailCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  trail: FoodTrail;
}

export function TrailCardModal({ isOpen, onClose, trail }: TrailCardModalProps) {
  const [theme, setTheme] = useState<StoryTheme>('cinematic');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !trail) return null;

  const openInstagramDirect = () => {
    triggerHaptic();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = "instagram://story-camera";
      setTimeout(() => {
        window.location.href = "https://instagram.com";
      }, 1000);
    } else {
      window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = async () => {
    triggerHaptic();
    setIsExporting(true);
    try {
      const blob = await generateTrailStoryBlob(trail, theme);
      if (!blob) throw new Error('Generation failed');

      const filename = `Madeater-Trail-${trail.title.replace(/[^a-z0-9]/gi, '_')}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Food Trail Story Card saved to photos!');
    } catch (err) {
      toast.error('Failed to export story card');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    triggerHaptic();
    setIsExporting(true);
    try {
      const blob = await generateTrailStoryBlob(trail, theme);
      if (!blob) throw new Error('Generation failed');

      const filename = `Madeater-Trail-${trail.title.replace(/[^a-z0-9]/gi, '_')}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // Trigger download backup
      const link = document.createElement('a');
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Food Trail: ${trail.title}`,
          text: `Check out the ${trail.title} food trail in ${trail.city} on Madeater!`,
        });
        toast.success('Shared! Opening Instagram...');
      } else {
        toast.success('Trail card saved! Opening Instagram...');
        setTimeout(openInstagramDirect, 400);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.success('Trail card saved! Opening Instagram...');
        setTimeout(openInstagramDirect, 300);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    triggerHaptic();
    setIsExporting(true);
    try {
      const blob = await generateTrailStoryBlob(trail, theme);
      if (!blob) throw new Error('Generation failed');

      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob })
        ]);
        setCopied(true);
        toast.success('Trail story card copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Trail link copied to clipboard!');
      }
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Trail link copied to clipboard!');
    } finally {
      setIsExporting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl z-10 text-white flex flex-col items-center my-auto max-h-[95vh] overflow-y-auto gpu-accelerated"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Trail Story Card</h3>
                <p className="text-[10px] text-white/50">9:16 Instagram Story Format</p>
              </div>
            </div>

            <button
              onClick={() => { triggerHaptic(); onClose(); }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* 9:16 Preview Card */}
          <div className="relative w-full aspect-[9/16] max-w-[280px] sm:max-w-[300px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 select-none bg-black my-3">
            <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-stone-950 via-zinc-900 to-black text-white relative">
              {/* Header Badge */}
              <div className="flex items-center justify-between z-10">
                <div className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-[9px] font-black uppercase tracking-wider text-orange-400">
                  🗺️ Trail Route
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-white/80 bg-black/60 px-2 py-0.5 rounded-full">
                  <MapPin size={10} className="text-orange-400" />
                  <span>{trail.city}</span>
                </div>
              </div>

              {/* Cover Image & Title */}
              <div className="my-auto space-y-2 z-10">
                <div className="w-full h-28 rounded-2xl overflow-hidden border border-white/20 relative shadow-lg">
                  <img
                    src={trail.coverImage}
                    alt={trail.title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[8px] text-white/80">
                    <span className="flex items-center gap-0.5"><Clock size={9} /> {trail.estimatedTime}</span>
                    <span className="flex items-center gap-0.5"><IndianRupee size={9} /> {trail.estimatedCost}</span>
                  </div>
                </div>

                <h2 className="text-sm font-black uppercase tracking-tight text-white line-clamp-1">
                  {trail.title}
                </h2>

                {/* Stops */}
                <div className="space-y-1">
                  {trail.stops.slice(0, 3).map((stop, i) => (
                    <div key={stop.id || i} className="p-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500 text-black text-[9px] font-black flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-white line-clamp-1">{stop.restaurantName}</p>
                        <p className="text-[8px] text-orange-400 italic line-clamp-1 font-serif">"{stop.signatureDish}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-white/60 z-10">
                <span className="font-black text-orange-400 tracking-wider">MADEATER</span>
                <span className="font-mono">{trail.stops.length} Stops Crawl</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-2">
            <button
              onClick={handleShare}
              disabled={isExporting}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Instagram size={16} />}
              <span>Share to Instagram Story</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="h-10 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={13} />
                <span>Save HD</span>
              </button>

              <button
                onClick={handleCopy}
                disabled={isExporting}
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
    </AnimatePresence>,
    document.body
  );
}
