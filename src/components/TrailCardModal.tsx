import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Share2, Copy, Sparkles, Check, 
  MapPin, Navigation, Utensils, Clock, IndianRupee, ShieldCheck
} from 'lucide-react';
import { FoodTrail } from '../types';
import * as htmlToImage from 'html-to-image';
import { triggerHaptic } from '../services/nativeService';
import { toast } from 'sonner';

interface TrailCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  trail: FoodTrail;
}

type CardTheme = 'cinematic' | 'vintage' | 'neon';

export function TrailCardModal({ isOpen, onClose, trail }: TrailCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<CardTheme>('cinematic');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !trail) return null;

  const generateCardImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      setIsExporting(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        cacheBust: true,
      });
      return dataUrl;
    } catch (err) {
      console.error('Failed to capture trail card:', err);
      toast.error('Failed to generate image');
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    triggerHaptic();
    const dataUrl = await generateCardImage();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `Madeater-Trail-${trail.title.replace(/[^a-z0-9]/gi, '_')}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Food Trail Card downloaded!');
  };

  const handleShare = async () => {
    triggerHaptic();
    const dataUrl = await generateCardImage();
    if (!dataUrl) return;

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${trail.title}-Trail.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Madeater Food Trail: ${trail.title}`,
          text: `Check out this curated food crawl on Madeater: ${trail.title} in ${trail.neighborhood}!`,
        });
        toast.success('Shared successfully!');
      } else if (navigator.share) {
        await navigator.share({
          title: trail.title,
          text: `Explore "${trail.title}" in ${trail.neighborhood} on Madeater!`,
          url: window.location.href,
        });
      } else {
        await handleDownload();
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error('Sharing failed, downloading instead.');
        await handleDownload();
      }
    }
  };

  const handleCopy = async () => {
    triggerHaptic();
    const dataUrl = await generateCardImage();
    if (!dataUrl) return;

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      await handleDownload();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[95vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Navigation size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Trail Story Card</h3>
                <p className="text-[10px] text-white/50">9:16 vertical crawl itinerary</p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic();
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center justify-center gap-2 py-3">
            {(['cinematic', 'vintage', 'neon'] as CardTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  triggerHaptic();
                  setTheme(t);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${
                  theme === t
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* PREVIEW CONTAINER (9:16 Aspect Ratio) */}
          <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/15 my-2">
            <div
              ref={cardRef}
              className={`w-full h-full flex flex-col justify-between p-5 select-none relative overflow-hidden ${
                theme === 'cinematic'
                  ? 'bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white'
                  : theme === 'vintage'
                  ? 'bg-gradient-to-b from-amber-950 via-zinc-900 to-black text-amber-100'
                  : 'bg-gradient-to-b from-purple-950 via-zinc-950 to-black text-cyan-100'
              }`}
            >
              {/* Background ambient accents */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Bar */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-orange-500 text-black text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Sparkles size={10} /> Food Crawl
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[9px] font-semibold">
                      {trail.city}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-white/40">MADEATER</span>
                </div>

                <h1 className="text-xl font-black leading-tight tracking-tight text-white mb-1">
                  {trail.title}
                </h1>
                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                  {trail.tagline}
                </p>

                {/* Quick stats strip */}
                <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-white/10 text-[10px] text-white/60">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-orange-400" /> {trail.stops.length} Stops
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-amber-400" /> ~{trail.totalDurationHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <IndianRupee size={11} className="text-emerald-400" /> {trail.estimatedBudget}
                  </span>
                </div>
              </div>

              {/* Itinerary Steps */}
              <div className="relative z-10 space-y-2.5 my-auto">
                {trail.stops.slice(0, 4).map((stop, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-2.5 relative"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-black font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{stop.name}</h4>
                        <span className="text-[9px] text-white/40">{stop.cuisine}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-400 font-semibold">
                        <Utensils size={10} /> Must-Order: <span className="text-white truncate">{stop.mustOrderDish}</span>
                      </div>
                      <p className="text-[9px] text-white/50 italic mt-0.5 line-clamp-1">
                        "{stop.criticTip}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-black font-black text-xs flex items-center justify-center">
                    {trail.curatorName.charAt(0)}
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-white flex items-center gap-1">
                      Curated by {trail.curatorName}
                      <ShieldCheck size={10} className="text-amber-400" />
                    </span>
                    <span className="text-[8px] text-white/40">Madeater Critic Trail</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[8px] text-white/40 block">Discover on</span>
                  <span className="text-[10px] font-black tracking-wider text-orange-400">madeater.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-3 gap-2 pt-3">
            <button
              onClick={handleShare}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
            >
              <Download size={15} />
              <span>Save</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
