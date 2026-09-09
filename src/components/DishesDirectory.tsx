import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MOCK_DISHES } from "../data/mockData";
import { Star, Utensils, Search, Flame, ArrowRight, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";

export function DishesDirectory() {
  const { getAppUrl } = useAppUrl();
  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");

  const cuisines = ["All", "Hyderabadi / Mughlai", "South Indian", "Seafood / Konkan", "Beverage / Heritage", "Andhra"];

  const filteredDishes = MOCK_DISHES.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase()) || 
                          dish.description.toLowerCase().includes(search.toLowerCase());
    const matchesCuisine = selectedCuisine === "All" || dish.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="min-h-screen bg-black text-white py-6 sm:py-12 md:py-16 px-3.5 sm:px-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-3">
          <Utensils size={13} />
          <span>The Dish Graph</span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-2 sm:mb-3">
          Signature Dishes
        </h1>
        <p className="text-white/50 text-xs sm:text-sm font-serif italic max-w-xl px-2">
          Madeater rates individual dishes—not just venues. Discover where to eat the finest biryanis, dosas, and seafood across India.
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-md relative mt-5 sm:mt-8">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            type="text"
            placeholder="Search dish, flavor, or spice level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-full pl-10 pr-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Cuisine Filter Pills with touch horizontal scroll */}
        <div className="w-full overflow-x-auto no-scrollbar py-2 mt-4 sm:mt-6">
          <div className="flex items-center sm:justify-center gap-1.5 sm:gap-2 px-1 min-w-max mx-auto">
            {cuisines.map(c => (
              <button
                key={c}
                onClick={() => { triggerHaptic(); setSelectedCuisine(c); }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all border shrink-0 active:scale-95 touch-manipulation ${
                  selectedCuisine === c
                    ? "bg-white text-black border-white font-black"
                    : "bg-zinc-900 text-white/60 border-white/10 hover:border-white/30 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dish Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {filteredDishes.map((dish, i) => (
          <Link
            key={dish.id}
            to={getAppUrl(`/dish/${dish.id}`)}
            onClick={() => triggerHaptic()}
            className="group rounded-2xl sm:rounded-3xl bg-zinc-900/50 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/40 p-4 sm:p-5 transition-all flex flex-col justify-between shadow-xl active:scale-[0.98] touch-manipulation"
          >
            <div>
              <div className="relative aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden mb-3.5 border border-white/10">
                <img 
                  src={dish.image} 
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-black text-white">{dish.madeaterScore.toFixed(1)}</span>
                </div>
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-wider text-orange-400">
                    {dish.cuisine}
                  </span>
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                {dish.name}
              </h2>
              <p className="text-xs text-white/50 line-clamp-2 mt-1 font-serif italic">
                {dish.description}
              </p>
            </div>

            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
              <span>{dish.topRestaurants.length} Ranked Venues</span>
              <span className="flex items-center gap-1 text-orange-400 font-bold group-hover:translate-x-1 transition-transform">
                Where to eat it <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
