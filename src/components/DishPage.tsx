import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MOCK_DISHES } from "../data/mockData";
import { collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Review } from "../types";
import { Star, MapPin, ChevronLeft, Flame, Trophy, Utensils, Share2, Plus, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { LogMealModal } from "./LogMealModal";
import { useAuth } from "../App";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";
import { getShareUrl } from "../utils/shareUrl";

export function DishPage() {
  const { dishId } = useParams<{ dishId: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { getAppUrl, isAppMode } = useAppUrl();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [relatedCravings, setRelatedCravings] = useState<Review[]>([]);

  // Find dish by id or normalized name
  const currentDish = MOCK_DISHES.find(d => 
    d.id === dishId || 
    d.name.toLowerCase().includes((dishId || "").toLowerCase().replace("-", " "))
  ) || MOCK_DISHES[0];

  useEffect(() => {
    if (!currentDish?.name) return;
    getDocs(query(collection(db, "reviews"), limit(25))).then((snap) => {
      const live = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Review[];
      const matched = live.filter(c => 
        (c.videoUrl || c.type === "craving") && (
          c.attachedDish?.toLowerCase().includes(currentDish.name.toLowerCase()) ||
          currentDish.name.toLowerCase().includes(c.attachedDish?.toLowerCase() || "") ||
          c.dishes?.some(d => d.name.toLowerCase().includes(currentDish.name.toLowerCase()))
        )
      );
      setRelatedCravings(matched);
    }).catch(() => {});
  }, [currentDish?.name]);

  const handleShare = async () => {
    triggerHaptic();
    const url = getShareUrl(`/dish/${dishId || currentDish?.id}`);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentDish?.name || "Dish"} on Madeater`,
          text: `Check out ${currentDish?.name || "this iconic dish"} on Madeater!`,
          url,
        });
        return;
      } catch {
        // fallback
      }
    }
    navigator.clipboard.writeText(url);
    toast.success("Dish link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-black text-white py-4 sm:py-8 md:py-12">
      
      {/* Top Header Bar (Compact on mobile / app shell) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
        {!isAppMode ? (
          <button 
            onClick={() => { triggerHaptic(); navigate(-1); }}
            className="flex items-center gap-1.5 text-xs uppercase font-bold text-white/60 hover:text-white transition-colors active:scale-95"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Share2 size={16} />
          </button>
          <button 
            onClick={() => (user ? setIsLogModalOpen(true) : login())}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500 text-black text-xs font-black uppercase tracking-wider hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus size={14} />
            <span>I Ate This</span>
          </button>
        </div>
      </div>

      {/* Hero Dish Presentation */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Dish Image */}
          <div className="lg:col-span-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-white/15 shadow-2xl group"
            >
              <img 
                src={currentDish.image} 
                alt={currentDish.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-orange-400">
                  {currentDish.cuisine}
                </span>
                <span className="text-xs text-white/60 font-medium">
                  {currentDish.reviewCount.toLocaleString()} Critic Logs
                </span>
              </div>
            </motion.div>
          </div>

          {/* Dish Info & Ratings Breakdown */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/30">
                  Signature Entity
                </span>
                <span className="text-white/40 text-xs">• Verified Food Graph</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight">
                {currentDish.name}
              </h1>
              <p className="text-sm text-white/60 leading-relaxed font-serif italic mt-3">
                {currentDish.description}
              </p>
            </div>

            {/* Score Showcase */}
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-black tracking-tight text-white">
                    {currentDish.madeaterScore.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-white/40">/ 10</span>
                </div>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-orange-400 mt-1">Madeater Dish Score</p>
              </div>

              <div className="w-[1px] h-16 bg-white/10" />

              {/* Dimension Metrics */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60 font-medium">Taste</span>
                    <span className="font-bold text-white">{currentDish.ratings.taste.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${currentDish.ratings.taste * 10}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60 font-medium">Spice</span>
                    <span className="font-bold text-rose-400">{currentDish.ratings.spice.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${currentDish.ratings.spice * 10}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60 font-medium">Portion</span>
                    <span className="font-bold text-white">{currentDish.ratings.portion.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${currentDish.ratings.portion * 10}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60 font-medium">Value</span>
                    <span className="font-bold text-emerald-400">{currentDish.ratings.value.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${currentDish.ratings.value * 10}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {currentDish.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/70">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* "WHERE TO EAT IT" LEADERBOARD (The Signature Differentiator) */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="border-t border-white/10 pt-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-orange-400 text-xs font-black uppercase tracking-widest mb-1">
                <Trophy size={15} />
                <span>The Definitive Leaderboard</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                Where to Eat {currentDish.name}
              </h2>
            </div>
            <p className="hidden md:block text-xs text-white/40 max-w-xs text-right">
              Ranked strictly by verified critic dish ratings, not generic restaurant scores.
            </p>
          </div>

          {/* Restaurant Rankings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentDish.topRestaurants.map((restaurant, idx) => (
              <Link
                key={restaurant.id}
                to={getAppUrl(`/restaurant/${restaurant.id}`)}
                onClick={() => triggerHaptic()}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-zinc-900/40 hover:bg-zinc-900/90 border border-white/10 hover:border-orange-500/50 transition-all flex items-center justify-between gap-3 sm:gap-4 group active:scale-[0.98] touch-manipulation"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                    idx === 0 
                      ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" 
                      : idx === 1
                      ? "bg-slate-300 text-black"
                      : idx === 2
                      ? "bg-amber-700 text-white"
                      : "bg-white/10 text-white/60"
                  }`}>
                    #{idx + 1}
                  </div>

                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/15">
                    <img 
                      src={restaurant.image || currentDish.image} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-black text-white group-hover:text-orange-400 transition-colors truncate">
                      {restaurant.name}
                    </h3>
                    <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin size={11} className="text-orange-400 shrink-0" />
                      {restaurant.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-lg font-black text-white">{restaurant.score.toFixed(1)}</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Dish Score</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-orange-500 group-hover:text-black flex items-center justify-center transition-colors">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Community Cravings for this Dish */}
      {relatedCravings.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="border-t border-white/10 pt-10">
            <div className="flex items-center gap-2 mb-6">
              <Flame size={18} className="text-orange-500 fill-orange-500" />
              <h3 className="text-xl font-black uppercase tracking-tight">Cravings Recorded for this Dish</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCravings.map((craving) => (
                <div key={craving.id} className="p-4 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={craving.userPhoto} alt={craving.userName} className="w-8 h-8 rounded-full border border-white/20" />
                    <div>
                      <p className="text-xs font-bold text-white">{craving.userName}</p>
                      <p className="text-[10px] text-white/40">{craving.restaurantName}</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1 text-xs font-black text-amber-400">
                      <Star size={11} className="fill-amber-400" />
                      {craving.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 italic font-serif line-clamp-2">"{craving.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <button
          onClick={() => (user ? setIsLogModalOpen(true) : login())}
          className="px-8 py-3.5 rounded-full bg-white text-black font-black uppercase tracking-wider text-xs hover:bg-orange-400 transition-all flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95"
        >
          <Utensils size={16} />
          <span>Log an Experience with this Dish</span>
        </button>
      </div>

      <LogMealModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        initialRestaurant={{
          name: currentDish.topRestaurants[0]?.name || "Local Spot",
          cuisine: currentDish.cuisine,
          location: currentDish.topRestaurants[0]?.location || "India"
        }}
      />
    </div>
  );
}
