import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Navigation, Compass, Filter, Utensils, Flame, Sparkles, ChevronRight, X } from "lucide-react";
import { MOCK_DISHES } from "../data/mockData";

interface MapSpot {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  city: string;
  rating: number;
  image: string;
  signatureDish: string;
  isCriticPick?: boolean;
  isTrending?: boolean;
  x: number; // percentage coordinate on visual map
  y: number;
}

const SPOTS: MapSpot[] = [
  {
    id: "bawarchi-rtc",
    name: "Bawarchi",
    cuisine: "Hyderabadi",
    location: "RTC X Roads, Hyderabad",
    city: "Hyderabad",
    rating: 9.6,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    signatureDish: "Hyderabadi Chicken Dum Biryani",
    isCriticPick: true,
    isTrending: true,
    x: 48,
    y: 52
  },
  {
    id: "shadab-oldcity",
    name: "Hotel Shadab",
    cuisine: "Mughlai",
    location: "Ghansi Bazaar, Old City",
    city: "Hyderabad",
    rating: 9.4,
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80",
    signatureDish: "Mutton Biryani & Brain Fry",
    isCriticPick: true,
    x: 52,
    y: 58
  },
  {
    id: "ulavacharu",
    name: "Ulavacharu",
    cuisine: "Andhra",
    location: "Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    rating: 9.7,
    image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=400&q=80",
    signatureDish: "Andhra Gongura Mutton",
    isCriticPick: true,
    x: 42,
    y: 45
  },
  {
    id: "trishna-mumbai",
    name: "Trishna",
    cuisine: "Seafood",
    location: "Kala Ghoda, Mumbai",
    city: "Mumbai",
    rating: 9.7,
    image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=400&q=80",
    signatureDish: "Butter Garlic Crab",
    isCriticPick: true,
    isTrending: true,
    x: 32,
    y: 48
  },
  {
    id: "subko-coffee",
    name: "Subko Specialty Coffee",
    cuisine: "Coffee",
    location: "Bandra West, Mumbai",
    city: "Mumbai",
    rating: 9.6,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80",
    signatureDish: "Bloom Pour-over & Sourdough",
    isTrending: true,
    x: 30,
    y: 44
  },
  {
    id: "rameshwaram-cafe",
    name: "The Rameshwaram Cafe",
    cuisine: "South Indian",
    location: "Indiranagar, Bangalore",
    city: "Bangalore",
    rating: 9.6,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80",
    signatureDish: "Ghee Podi Roast Dosa",
    isCriticPick: true,
    isTrending: true,
    x: 45,
    y: 72
  },
  {
    id: "brahmins-coffee",
    name: "Brahmin's Coffee Bar",
    cuisine: "Heritage",
    location: "Shankarapura, Bangalore",
    city: "Bangalore",
    rating: 9.8,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80",
    signatureDish: "Idli Vada bathed in Coconut Chutney",
    isCriticPick: true,
    x: 43,
    y: 74
  }
];

export function FoodMap() {
  const [selectedCity, setSelectedCity] = useState("All");
  const [filterType, setFilterType] = useState<"all" | "critic" | "trending">("all");
  const [activeSpot, setActiveSpot] = useState<MapSpot | null>(SPOTS[0]);

  const cities = ["All", "Hyderabad", "Mumbai", "Bangalore"];

  const filteredSpots = SPOTS.filter(spot => {
    const matchesCity = selectedCity === "All" || spot.city === selectedCity;
    const matchesFilter = filterType === "all" ? true :
      filterType === "critic" ? spot.isCriticPick :
      spot.isTrending;
    return matchesCity && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-24 md:pb-12 px-4 max-w-7xl mx-auto flex flex-col">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-400 mb-1">
            <Compass size={14} />
            <span>Spatial Culinary Discovery</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
            Madeater Food Map
          </h1>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {cities.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedCity === c
                  ? "bg-white text-black border-white shadow-md"
                  : "bg-zinc-900 text-white/60 border-white/10 hover:border-white/30"
              }`}
            >
              {c}
            </button>
          ))}

          <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />

          <button
            onClick={() => setFilterType(filterType === "critic" ? "all" : "critic")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
              filterType === "critic"
                ? "bg-amber-400 text-black border-amber-400"
                : "bg-zinc-900 text-white/60 border-white/10 hover:border-white/30"
            }`}
          >
            <Star size={12} className="fill-current" />
            <span>Critic Picks</span>
          </button>

          <button
            onClick={() => setFilterType(filterType === "trending" ? "all" : "trending")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
              filterType === "trending"
                ? "bg-orange-500 text-black border-orange-500"
                : "bg-zinc-900 text-white/60 border-white/10 hover:border-white/30"
            }`}
          >
            <Flame size={12} className="fill-current" />
            <span>Trending</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 min-h-[65vh] rounded-[2.5rem] bg-zinc-950 border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Visual Map Canvas with Dark Cartographic Styling */}
        <div className="relative flex-1 w-full h-[55vh] md:h-auto bg-[#0a0a0c] overflow-hidden select-none">
          
          {/* Stylized Grid Overlay */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
          
          {/* Atmospheric Glow Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Map Region Outlines */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <Compass size={380} className="text-white animate-spin [animation-duration:180s]" />
          </div>

          {/* Regional Geo Markers */}
          {filteredSpots.map((spot) => {
            const isSelected = activeSpot?.id === spot.id;
            return (
              <div
                key={spot.id}
                style={{ top: `${spot.y}%`, left: `${spot.x}%` }}
                onClick={() => setActiveSpot(spot)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                <div className={`relative flex items-center justify-center transition-all ${
                  isSelected ? "scale-125 z-30" : "hover:scale-110"
                }`}>
                  {/* Ping effect */}
                  {isSelected && (
                    <div className="absolute -inset-2 bg-orange-500 rounded-full animate-ping opacity-40" />
                  )}
                  
                  <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xl border transition-all ${
                    isSelected
                      ? "bg-orange-500 text-black border-orange-400 font-black"
                      : "bg-zinc-900/90 backdrop-blur-md text-white border-white/20 hover:border-orange-500"
                  }`}>
                    <Utensils size={11} className={isSelected ? "text-black" : "text-orange-400"} />
                    <span className="text-xs font-bold whitespace-nowrap">{spot.name}</span>
                    <span className="text-[10px] font-black opacity-80">{spot.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Spot Details Flyout Panel */}
        {activeSpot && (
          <div className="w-full md:w-80 bg-zinc-900/90 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col justify-between shrink-0">
            <div>
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-lg">
                <img src={activeSpot.image} alt={activeSpot.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-white">{activeSpot.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">
                  {activeSpot.cuisine}
                </span>
                <span className="text-white/40 text-xs">• {activeSpot.city}</span>
              </div>

              <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                {activeSpot.name}
              </h2>
              <p className="text-xs text-white/50 flex items-center gap-1 mb-4">
                <MapPin size={11} className="text-orange-400 shrink-0" />
                {activeSpot.location}
              </p>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1 mb-4">
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Signature Flavor</span>
                <p className="text-xs font-bold text-white">{activeSpot.signatureDish}</p>
              </div>
            </div>

            <Link
              to={`/restaurant/${activeSpot.id}`}
              className="w-full py-3 rounded-full bg-orange-500 text-black font-black uppercase tracking-wider text-xs text-center hover:bg-orange-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <span>Explore Restaurant</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
