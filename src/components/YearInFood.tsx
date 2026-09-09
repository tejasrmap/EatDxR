import React, { useRef, useState } from "react";
import { useAuth } from "../App";
import { Trophy, Star, Download, Share2, Flame, MapPin, Sparkles, UtensilsCrossed, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";

export function YearInFood() {
  const { user, dishdUser } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const stats = {
    year: "2026",
    mealsLogged: 384,
    restaurantsVisited: 91,
    citiesExplored: 14,
    cuisinesTasted: 32,
    meanScore: 8.4,
    topDish: "Hyderabadi Chicken Dum Biryani",
    topDishScore: 9.8,
    topRestaurant: "Bawarchi (RTC X Roads)",
    foodPersona: "THE SPICE SEEKER",
    spiceTolerance: "96%",
    mostVisitedCity: "Hyderabad"
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#050505",
        scale: 2
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Madeater-Year-In-Food-${stats.year}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Card downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate card image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Year in food link copied!");
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-36 px-6 max-w-4xl mx-auto flex flex-col items-center">
      
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs uppercase font-bold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Profile</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={handleDownloadCard}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 text-black text-xs font-black uppercase tracking-wider hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? "Generating..." : "Download Card"}</span>
          </button>
        </div>
      </div>

      {/* The Wrapped Shareable Card */}
      <div 
        ref={cardRef}
        className="w-full max-w-md p-8 rounded-[3rem] bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border border-white/15 shadow-2xl relative overflow-hidden space-y-8"
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Brand Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight uppercase">MAD</span>
            <span className="font-black text-lg tracking-tight uppercase text-orange-400">EATER</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-white/80">
            {stats.year} Year in Food
          </span>
        </div>

        {/* User Persona & Title */}
        <div className="text-center space-y-2 relative z-10">
          <img 
            src={dishdUser?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
            alt="" 
            className="w-20 h-20 rounded-full border-2 border-orange-400 mx-auto object-cover shadow-xl"
          />
          <h2 className="text-xl font-black uppercase tracking-tight text-white mt-3">
            {dishdUser?.displayName || user?.displayName || "Teja G."}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black uppercase tracking-wider">
            <Flame size={12} className="fill-orange-500" />
            <span>{stats.foodPersona}</span>
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-3xl font-black text-white">{stats.mealsLogged}</span>
            <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider mt-1">Dishes Eaten</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-3xl font-black text-white">{stats.restaurantsVisited}</span>
            <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider mt-1">Restaurants</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-3xl font-black text-white">{stats.citiesExplored}</span>
            <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider mt-1">Cities</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-3xl font-black text-orange-400">{stats.meanScore}</span>
            <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider mt-1">Average Score</p>
          </div>
        </div>

        {/* Number 1 Highlights */}
        <div className="space-y-3 relative z-10 border-t border-white/10 pt-5">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-orange-400 tracking-wider">#1 Most Celebrated Dish</span>
              <p className="text-sm font-bold text-white truncate max-w-[220px]">{stats.topDish}</p>
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-black text-sm">
              <Star size={13} className="fill-amber-400" />
              <span>{stats.topDishScore}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-orange-400 tracking-wider">#1 Sanctuary Restaurant</span>
              <p className="text-sm font-bold text-white truncate max-w-[220px]">{stats.topRestaurant}</p>
            </div>
            <span className="text-[10px] text-white/40 uppercase font-bold">14 Visits</span>
          </div>
        </div>

        {/* Footer Tag */}
        <div className="text-center pt-2 relative z-10">
          <p className="text-[9px] uppercase font-black tracking-[0.3em] text-white/30">
            Madeater • Gastronomic Identity Layer
          </p>
        </div>
      </div>
    </div>
  );
}
