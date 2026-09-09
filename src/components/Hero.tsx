import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { searchRestaurants } from "../services/mapsService";
import { RestaurantSearchResult } from "../types";
import { useNavigate, Link } from "react-router-dom";

export function Hero() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RestaurantSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        
        try {
          const { getCurrentCity } = await import("../services/mapsService");
          const city = await getCurrentCity(lat, lng);
          if (city) setCurrentCity(city);
        } catch (err) {
          console.error("Failed to get city:", err);
        }
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 1) {
        setIsLoading(true);
        try {
          const searchResults = await searchRestaurants(query.trim(), location?.lat, location?.lng);
          setResults(searchResults);
          setShowResults(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [query, location]);

  const cityBackgrounds: Record<string, string> = {
    "Mumbai": "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1920&q=80",
    "Delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1920&q=80",
    "Bangalore": "https://images.unsplash.com/photo-1596760407110-2f75d0d2475d?auto=format&fit=crop&w=1920&q=80",
    "Hyderabad": "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?auto=format&fit=crop&w=1920&q=80",
    "Chennai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1920&q=80",
    "Kolkata": "https://images.unsplash.com/photo-1558431382-bb7b68c4b5d7?auto=format&fit=crop&w=1920&q=80",
  };

  const currentBg = currentCity && cityBackgrounds[currentCity] 
    ? cityBackgrounds[currentCity] 
    : "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1920&q=80";

  const handleGetStarted = () => {
    const element = document.getElementById("popular-meals");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-[72vh] py-16 md:py-24 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentBg}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            src={currentBg} 
            alt="Atmospheric restaurant" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      </div>

      <div className="relative z-10 text-center max-w-5xl px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
        >
          <span className="font-bold uppercase tracking-[0.25em] text-[11px] mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">
            Track Every Meal • Discover Iconic Dishes
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 uppercase">
            The Network for <br />
            <span className="text-white/60 font-serif italic lowercase tracking-normal">food critics &amp; enthusiasts.</span>
          </h1>
          
          <div className="max-w-xl mx-auto mb-6 relative" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-orange-400 transition-colors duration-300" />
              <input
                type="text"
                placeholder={currentCity ? `Search food spots in ${currentCity}...` : "Search dishes or spots across India..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 1 && setShowResults(true)}
                className="w-full bg-zinc-900/80 border border-white/15 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/80 transition-all shadow-2xl backdrop-blur-2xl font-medium text-sm"
              />
              {isLoading && (
                <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400 animate-spin" />
              )}
            </div>

            <AnimatePresence>
              {showResults && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl z-50 text-left overflow-hidden"
                >
                  <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                    {results.map((res, i) => (
                      <button
                        key={i}
                        className="w-full p-4 hover:bg-white/5 flex items-start gap-4 transition-colors border-b border-white/10 last:border-0 group/item cursor-pointer"
                        onClick={() => {
                          setShowResults(false);
                          navigate(`/restaurant/${res.id}`);
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10 group-hover/item:border-orange-500 transition-all">
                          <img 
                            src={res.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=100&q=80`} 
                            alt={res.name}
                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white group-hover/item:text-orange-400 transition-colors">{res.name}</p>
                          <p className="text-[11px] text-white/50 line-clamp-1 mb-1">{res.location}</p>
                          <div className="flex items-center gap-2">
                             <span className="font-black text-[9px] uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{res.cuisine}</span>
                            {res.menuItems && res.menuItems.length > 0 && (
                              <>
                                <span className="text-white/20 text-xs font-light">/</span>
                                <p className="text-[10px] text-white/50 font-medium line-clamp-1">
                                  Try {res.menuItems.slice(0, 2).join(", ")}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick trending suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs text-white/60">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Trending:</span>
            {["Hyderabadi Biryani", "Butter Dosa", "Irani Chai", "Seafood Thali"].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(item)}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/40 text-[11px] text-white/70 hover:text-white transition-all cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4">
            <button 
              onClick={handleGetStarted}
              className="bg-orange-500 hover:bg-orange-400 text-black px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(249,115,22,0.35)] w-full sm:w-auto cursor-pointer active:scale-95"
            >
              Explore Madeater Feed
            </button>
            <Link to="/dishes" className="bg-zinc-900/60 border border-white/15 text-white px-8 py-3.5 rounded-full flex items-center justify-center w-full sm:w-auto group font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all">
              Browse Signature Dishes
              <span className="ml-2 text-white/50 group-hover:translate-x-1 group-hover:text-orange-400 transition-all">→</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
