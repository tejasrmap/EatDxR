import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Globe, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { triggerHaptic } from "../services/nativeService";

export function ModeSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAppMode = location.pathname.startsWith("/app");

  const switchToWeb = () => {
    triggerHaptic();
    if (!isAppMode) return;
    const cleanPath = location.pathname.replace(/^\/app/, "") || "/";
    navigate(cleanPath + location.search);
  };

  const switchToApp = () => {
    triggerHaptic();
    if (isAppMode) return;
    const path = location.pathname === "/" ? "" : location.pathname;
    navigate(`/app${path}` + location.search);
  };

  return (
    <div 
      role="group" 
      aria-label="Experience Mode Switcher"
      className="relative flex items-center bg-zinc-900/90 p-1 rounded-full border border-white/15 shadow-inner backdrop-blur-md select-none"
    >
      {/* Sliding Pill Indicator */}
      <motion.div
        layout
        transition={{ type: "spring", damping: 28, stiffness: 400 }}
        className={`absolute top-1 bottom-1 rounded-full ${
          isAppMode
            ? "left-1/2 right-1 bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30"
            : "left-1 right-1/2 bg-white text-black shadow-md shadow-white/20"
        }`}
      />

      {/* Web Button */}
      <button
        type="button"
        onClick={switchToWeb}
        className={`relative z-10 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
          !isAppMode ? "text-black" : "text-white/60 hover:text-white"
        }`}
        title="Switch to Web Experience"
      >
        <Globe size={12} className={!isAppMode ? "text-black" : "text-white/50"} />
        <span>Web</span>
      </button>

      {/* App Button */}
      <button
        type="button"
        onClick={switchToApp}
        className={`relative z-10 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
          isAppMode ? "text-black" : "text-white/60 hover:text-white"
        }`}
        title="Switch to Instagram-Style App Experience"
      >
        <Smartphone size={12} className={isAppMode ? "text-black" : "text-white/50"} />
        <span>App</span>
      </button>
    </div>
  );
}
