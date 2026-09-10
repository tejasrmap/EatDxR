import React, { useEffect, useState, useMemo } from "react";
import { Restaurant } from "../types";
import { Link } from "react-router-dom";
import { Star, MapPin, Navigation, Loader2, Compass, UtensilsCrossed, Search, Globe, SlidersHorizontal } from "lucide-react";
import { getDistanceKM, formatDistance } from "../lib/distance";
import { motion, AnimatePresence } from "motion/react";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";
import { toast } from "sonner";
import { GLOBAL_CITIES, GLOBAL_RESTAURANTS } from "../data/globalRestaurants";
import { preloadAllRestaurants, getCurrentCity } from "../services/mapsService";
import { Geolocation } from "@capacitor/geolocation";

export function Restaurants() {
  const { getAppUrl } = useAppUrl();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null); // null = all
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "reviews">("distance");
  const [detectedCityName, setDetectedCityName] = useState<string | null>(null);

  useEffect(() => {
    // 1. Request GPS Location
    const initLocation = async () => {
      try {
        let lat: number, lng: number;
        try {
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 6000 });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          const webPos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 6000 });
          });
          lat = webPos.coords.latitude;
          lng = webPos.coords.longitude;
        }

        setUserLocation({ lat, lng });
        setLocationStatus('granted');
        
        getCurrentCity(lat, lng).then(c => {
          if (c) setDetectedCityName(c);
        });
      } catch (err) {
        console.warn("GPS resolution error:", err);
        setLocationStatus('denied');
        // Default to Hyderabad / Global hub
        setUserLocation({ lat: 17.3850, lng: 78.4867 });
      }
    };

    initLocation();

    // 2. Fetch all local and global restaurants
    const fetchRestaurants = async () => {
      try {
        const data = await preloadAllRestaurants();
        const formatted: Restaurant[] = data.map(d => ({
          id: d.id,
          name: d.name,
          cuisine: d.cuisine || "Gourmet",
          location: d.location || "World Culinary Destination",
          city: d.city,
          rating: (d as any).rating || 4.8,
          reviewCount: (d as any).reviewCount || 1200,
          priceLevel: (d as any).priceLevel || "₹₹",
          image: d.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
          lat: (d as any).lat,
          lng: (d as any).lng
        }));
        setRestaurants(formatted);
      } catch (e) {
        console.error("Failed to fetch restaurants", e);
        setRestaurants(GLOBAL_RESTAURANTS);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const selectCityHub = (city: typeof GLOBAL_CITIES[0]) => {
    triggerHaptic();
    setUserLocation({ lat: city.lat, lng: city.lng });
    setSelectedCity(city.name);
    toast.success(`📍 Teleported to ${city.name}, ${city.country}`);
  };

  const useLiveGPS = async () => {
    triggerHaptic();
    try {
      let lat: number, lng: number;
      try {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 6000 });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        const webPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 6000 });
        });
        lat = webPos.coords.latitude;
        lng = webPos.coords.longitude;
      }
      setUserLocation({ lat, lng });
      setSelectedCity("GPS");
      const c = await getCurrentCity(lat, lng);
      if (c) setDetectedCityName(c);
      toast.success(c ? `📍 Nearest to ${c}` : "📍 GPS Location calibrated");
    } catch {
      toast.error("Could not obtain GPS permission");
    }
  };

  // Filtered and Sorted Restaurants
  const processedRestaurants = useMemo(() => {
    let list = [...restaurants];

    // 1. Calculate Distances
    if (userLocation) {
      list = list.map(res => {
        const dist = (typeof res.lat === 'number' && typeof res.lng === 'number')
          ? getDistanceKM(userLocation.lat, userLocation.lng, res.lat, res.lng)
          : Infinity;
        return { ...res, distance: dist };
      });
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.cuisine?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        (r.city && r.city.toLowerCase().includes(q))
      );
    }

    // 3. City Filter
    if (selectedCity !== "All" && selectedCity !== "GPS") {
      list = list.filter(r => 
        (r.city && r.city.toLowerCase().includes(selectedCity.toLowerCase())) ||
        (r.location && r.location.toLowerCase().includes(selectedCity.toLowerCase()))
      );
    }

    // 4. Radius Filter
    if (radiusFilter !== null) {
      list = list.filter(r => (r.distance || Infinity) <= radiusFilter);
    }

    // 5. Sorting
    if (sortBy === "distance") {
      list.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "reviews") {
      list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }

    return list;
  }, [restaurants, userLocation, searchQuery, selectedCity, radiusFilter, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="space-y-4 text-center">
           <Loader2 className="w-9 h-9 animate-spin text-orange-500 mx-auto" />
           <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Discovering Culinary Gems...</p>
        </div>
      </div>
    );
  }

  const activeCityCount = selectedCity === "All" ? processedRestaurants.length : processedRestaurants.length;

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-8 max-w-7xl mx-auto selection:bg-orange-500 selection:text-black">
      
      {/* 1. Header with Clean Dignity */}
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                Curated Spots
              </span>
              <span className="text-white/30 text-xs font-mono">• {processedRestaurants.length} destinations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase">
              Dining <span className="text-orange-500">Spots</span>
            </h1>
          </div>

          {/* Quick GPS Calibrator */}
          <button
            onClick={useLiveGPS}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/40 text-white/80 hover:text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Navigation size={12} className="text-orange-500 animate-pulse" />
            <span>{detectedCityName ? `Near ${detectedCityName}` : "My Location"}</span>
          </button>
        </div>

        {/* 2. Unified Discovery Dock (Search + Top Cities + Sort) */}
        <div className="mt-6 p-2 rounded-2xl sm:rounded-3xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl shadow-2xl space-y-2.5">
          
          {/* Search + Sort Row */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, cuisines, dishes (e.g. Biryani, Sushi, Cafe)..."
                className="w-full pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={e => { triggerHaptic(); setSortBy(e.target.value as any); }}
                className="appearance-none px-3.5 py-2.5 pr-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/80 hover:text-white focus:outline-none cursor-pointer transition-all"
              >
                <option value="distance" className="bg-zinc-950 text-white">Nearest</option>
                <option value="rating" className="bg-zinc-950 text-white">Top Rated</option>
                <option value="reviews" className="bg-zinc-950 text-white">Popular</option>
              </select>
              <SlidersHorizontal size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Clean City Filter Pills (Curated Top Hubs + Dropdown) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => { triggerHaptic(); setSelectedCity("All"); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCity === "All"
                  ? "bg-white text-black font-black shadow-sm"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              All Hubs
            </button>

            {GLOBAL_CITIES.slice(0, 8).map(c => (
              <button
                key={c.name}
                onClick={() => selectCityHub(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCity === c.name
                    ? "bg-orange-500 text-black font-black shadow-md shadow-orange-500/20"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {c.name}
              </button>
            ))}

            {/* Overflow Cities Select */}
            <div className="relative shrink-0 ml-auto">
              <select
                value={GLOBAL_CITIES.slice(8).some(c => c.name === selectedCity) ? selectedCity : ""}
                onChange={(e) => {
                  const found = GLOBAL_CITIES.find(c => c.name === e.target.value);
                  if (found) selectCityHub(found);
                }}
                className={`appearance-none px-3 py-1.5 pr-6 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  GLOBAL_CITIES.slice(8).some(c => c.name === selectedCity)
                    ? "bg-orange-500 text-black font-black border-orange-500"
                    : "bg-white/5 text-white/60 hover:text-white border-white/5"
                }`}
              >
                <option value="" disabled className="bg-zinc-950 text-white">More Cities ▾</option>
                {GLOBAL_CITIES.slice(8).map(c => (
                  <option key={c.name} value={c.name} className="bg-zinc-950 text-white">{c.name} ({c.country})</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </header>

      {/* 3. Clean Restaurant Grid */}
      <main>
        {processedRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {processedRestaurants.map((res, i) => (
              <RestaurantCard key={res.id} restaurant={res} index={i} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-zinc-950/40 border border-dashed border-white/15 rounded-3xl p-10 max-w-xl mx-auto">
            <UtensilsCrossed className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-bold text-base mb-1">No Spots Found</h3>
            <p className="text-xs text-white/40 mb-5">Try resetting your search query or switching to "All Hubs".</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCity("All"); }}
              className="px-4 py-2 rounded-full bg-orange-500 text-black font-black text-xs uppercase tracking-wider hover:bg-orange-400 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

    </div>
  );
}

function RestaurantCard({ restaurant, index }: { restaurant: any, index: number }) {
  const { getAppUrl } = useAppUrl();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + " " + (restaurant.location || ""))}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.35 }}
      className="group relative h-full flex flex-col"
    >
      {/* Quick Directions Button */}
      <div className="absolute top-3 right-3 z-10">
        <a 
          href={mapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-black/60 backdrop-blur-md hover:bg-orange-500 hover:text-black text-white p-2 rounded-full border border-white/15 transition-all flex items-center justify-center shadow-lg active:scale-90 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); triggerHaptic(); }}
          title="Open in Maps"
        >
          <Navigation size={12} />
        </a>
      </div>

      <Link 
        to={getAppUrl(`/restaurant/${restaurant.id}`)} 
        onClick={() => triggerHaptic()} 
        className="block h-full active:scale-[0.98] transition-transform touch-manipulation flex-1"
      >
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950/80 border border-white/10 hover:border-orange-500/50 shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
          
          {/* Card Image */}
          <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-900">
            <img 
              src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"} 
              alt={restaurant.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80";
              }}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Distance Pill */}
            {restaurant.distance !== undefined && restaurant.distance !== Infinity && (
              <div className="absolute top-3 left-3">
                <span className="font-bold text-[10px] text-white px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 flex items-center gap-1">
                  <MapPin size={9} className="text-orange-400" />
                  {formatDistance(restaurant.distance)}
                </span>
              </div>
            )}

            {/* Bottom Overlay Info */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/15">
                <Star size={11} className="fill-orange-400 text-orange-400" />
                <span className="text-xs font-black">
                  {typeof restaurant.rating === 'number' ? restaurant.rating.toFixed(1) : restaurant.rating || "4.8"}
                </span>
              </div>
              <span className="text-[10px] font-bold text-white/70 bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                {restaurant.priceLevel || "₹₹"}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                {restaurant.name}
              </h3>
              <p className="text-xs font-semibold text-orange-400/90 mt-1 line-clamp-1">
                {restaurant.cuisine || "Specialty Dining"}
              </p>
              <p className="text-[11px] text-white/40 mt-1 line-clamp-1 flex items-center gap-1">
                <MapPin size={10} className="shrink-0 text-white/30" />
                <span>{restaurant.location || restaurant.city || "Global Hub"}</span>
              </p>
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}

