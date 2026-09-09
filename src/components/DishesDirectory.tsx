import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MOCK_DISHES } from "../data/mockData";
import { Star, Utensils, Search, Flame, ArrowRight, Trophy } from "lucide-react";
import { motion } from "motion/react";

export function DishesDirectory() {
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
    <div className="min-h-screen bg-black text-white pt-24 pb-36 px-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest mb-4">
          <Utensils size={14} />
          <span>The Dish Graph</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
          Signature Dishes
        </h1>
        <p className="text-white/50 text-sm md:text-base font-serif italic max-w-xl">
          Madeater rates individual dishes—not just venues. Discover where to eat the finest biryanis, dosas, and seafood across India.
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-md relative mt-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            type="text"
            placeholder="Search dish, flavor, or spice level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-full pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Cuisine Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {cuisines.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCuisine(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedCuisine === c
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-white/60 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Dish Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDishes.map((dish, i) => (
          <Link
            key={dish.id}
            to={`/dish/${dish.id}`}
            className="group rounded-3xl bg-zinc-900/50 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/40 p-5 transition-all flex flex-col justify-between shadow-xl"
          >
            <div>
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 border border-white/10">
                <img 
                  src={dish.image} 
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-white">{dish.madeaterScore.toFixed(1)}</span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                    {dish.cuisine}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                {dish.name}
              </h2>
              <p className="text-xs text-white/50 line-clamp-2 mt-1 font-serif italic">
                {dish.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
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
