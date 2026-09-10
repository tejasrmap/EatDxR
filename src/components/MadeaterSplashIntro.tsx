import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { triggerHaptic } from "../services/nativeService";

interface MadeaterSplashIntroProps {
  onComplete?: () => void;
  duration?: number;
}

export function MadeaterSplashIntro({ onComplete, duration = 1400 }: MadeaterSplashIntroProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerHaptic();
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 350);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-[#050505] text-white select-none pointer-events-auto"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Top subtle spacer */}
          <div className="h-16" />

          {/* Center: Iconic Animated Madeater Emblem & Typography */}
          <div className="flex flex-col items-center justify-center -mt-6">
            
            {/* Emblem Icon with Instagram-like Scale In & Glow */}
            <motion.div
              initial={{ scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-5"
            >
              {/* Ambient Glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-orange-600/30 to-red-600/30 rounded-3xl blur-xl" />
              
              {/* Squircle Container */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-0.5 shadow-2xl flex items-center justify-center border border-white/10">
                <div className="w-full h-full rounded-[14px] sm:rounded-[22px] bg-[#0c0c0e] flex items-center justify-center overflow-hidden">
                  <svg
                    viewBox="0 0 512 512"
                    className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[0_4px_12px_rgba(249,115,22,0.5)]"
                  >
                    <defs>
                      <linearGradient id="intro-flame-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff7a00" />
                        <stop offset="50%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M128 384 L128 176 C128 160 144 148 160 156 L240 204 C250 210 262 210 272 204 L352 156 C368 148 384 160 384 176 L384 384 C384 396 372 408 360 408 L348 408 C336 408 324 396 324 384 L324 232 L276 264 C264 272 248 272 236 264 L188 232 L188 384 C188 396 176 408 164 408 L152 408 C140 408 128 396 128 384 Z"
                      fill="url(#intro-flame-grad)"
                    />
                    <circle cx="256" cy="132" r="28" fill="#fbbf24" />
                    <path d="M256 92 L260 120 L288 124 L260 128 L256 156 L252 128 L224 124 L252 120 Z" fill="#ffffff" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Wordmark: MADEATER. */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
              className="flex items-baseline tracking-tight"
            >
              <span className="font-black text-2xl sm:text-3xl text-white tracking-tight uppercase">MAD</span>
              <span className="font-black text-2xl sm:text-3xl text-orange-500 tracking-tight uppercase">EATER</span>
              <span className="w-2 h-2 rounded-full bg-orange-500 ml-1 mb-0.5" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase mt-1"
            >
              Taste Cartography Network
            </motion.p>
          </div>

          {/* Bottom Instagram-style "from MADEATER" signature */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col items-center gap-1 mb-8"
          >
            <span className="text-[10px] tracking-widest text-white/40 uppercase font-medium">from</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-orange-500 uppercase">MADEATER</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
