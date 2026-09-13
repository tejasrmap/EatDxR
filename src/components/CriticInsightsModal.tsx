import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Eye, 
  Bookmark, 
  Heart, 
  Flame, 
  Star, 
  MapPin, 
  BarChart3, 
  Award,
  Sparkles,
  Calendar
} from "lucide-react";
import { triggerHaptic } from "../services/nativeService";

interface CriticInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const CriticInsightsModal: React.FC<CriticInsightsModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden pointer-events-auto bg-black select-none">
      <div className="relative w-full h-full md:max-w-xl md:h-[92vh] md:rounded-3xl bg-[#09090b] text-white border-0 md:border md:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#09090b]/95 backdrop-blur-xl px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => {
                triggerHaptic();
                onClose();
              }} 
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white"
              title="Back"
            >
              <ArrowLeft size={22} className="stroke-[2.2]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Professional Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
            <Calendar size={12} className="text-orange-400" />
            <span>Last 30 days</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
          
          {/* Main Hero Metric Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent border border-orange-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Total Critic Impressions</span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                <TrendingUp size={13} /> +24.8%
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              1,482
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your restaurant ratings and cravings reached <strong>1,482 foodies</strong> in your city this month.
            </p>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#18181b] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-medium">Profile Views</span>
                <Eye size={15} className="text-blue-400" />
              </div>
              <p className="text-xl font-black text-white">824</p>
              <span className="text-[10px] text-emerald-400 font-semibold">+12.4% vs last month</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#18181b] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-medium">Saved to Eatlists</span>
                <Bookmark size={15} className="text-amber-400" />
              </div>
              <p className="text-xl font-black text-white">342</p>
              <span className="text-[10px] text-emerald-400 font-semibold">+18.2% saves</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#18181b] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-medium">Discussion Replies</span>
                <Users size={15} className="text-emerald-400" />
              </div>
              <p className="text-xl font-black text-white">156</p>
              <span className="text-[10px] text-zinc-400">from 48 critics</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#18181b] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-medium">Taste Compatibility</span>
                <Sparkles size={15} className="text-orange-400" />
              </div>
              <p className="text-xl font-black text-white">89%</p>
              <span className="text-[10px] text-orange-400 font-semibold">High Palate Match</span>
            </div>
          </div>

          {/* Top Performing Review */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 px-1">Top Performing Dish Review</h3>
            <div className="p-3 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=150"
                alt="Truffle Butter Chicken"
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
              />
              <div className="flex-1 min-w-0 space-y-0.5">
                <h4 className="text-sm font-bold text-white truncate">Truffle Butter Chicken</h4>
                <p className="text-xs text-zinc-400 truncate">at Jewel of Nizam</p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <Eye size={12} /> 412
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-rose-400">
                    <Heart size={12} /> 38
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <Bookmark size={12} /> 14
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Follower Palate Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 px-1">Follower Palate DNA Breakdown</h3>
            
            <div className="p-4 rounded-3xl bg-[#18181b] border border-white/[0.08] space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Flame size={13} className="text-orange-500" /> Spicy / Fiery Palate
                  </span>
                  <span className="text-orange-400 font-black">48%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full w-[48%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>🌶️</span> Medium / Balanced Heat
                  </span>
                  <span className="text-amber-400 font-black">36%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full w-[36%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>🌿</span> Mild & Aromatic
                  </span>
                  <span className="text-emerald-400 font-black">16%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[16%]" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
