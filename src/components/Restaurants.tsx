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

  const nearby = processedRestaurants.filter(r => (r.distance || Infinity) < 5);
  const others = processedRestaurants.filter(r => (r.distance || Infinity) >= 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="space-y-6 text-center">
           <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
           <p className="font-bold tracking-widest text-xs text-white/50 uppercase">Loading Global Culinary Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-6 max-w-7xl mx-auto elite-motion-safe">
      
      {/* Header & Location Pulse */}
      <header className="mb-6 sm:mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Worldwide</span>
              <span className="text-orange-500 font-black">Food Map</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Locating top-ranked culinary destinations across global food capitals & local hotspots.
            </p>
          </div>

          {/* GPS Quick Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={useLiveGPS}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Navigation size={13} className="text-orange-500 animate-pulse" />
              <span>{detectedCityName ? `Near ${detectedCityName}` : "My GPS Location"}</span>
            </button>
          </div>
        </div>

        {/* Global Cities Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => { triggerHaptic(); setSelectedCity("All"); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCity === "All"
                ? "bg-white text-black font-black shadow-sm"
                : "bg-white/5 text-white/70 hover:text-white border border-white/10"
            }`}
          >
            🌎 All Food Capitals
          </button>
          {GLOBAL_CITIES.map(c => (
            <button
              key={c.name}
              onClick={() => selectCityHub(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCity === c.name
                  ? "bg-orange-500 text-white font-black shadow-md shadow-orange-500/20"
                  : "bg-white/5 text-white/70 hover:text-white border border-white/10"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search & Radius Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-3 pt-3 border-t border-border">
          {/* Search Bar */}
          <div className="relative w-full sm:flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by restaurant name, cuisine (e.g. Sushi, Biryani, Pasta)..."
              className="w-full pl-9 pr-3.5 py-2 bg-muted/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>

          {/* Radius Filters */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => { triggerHaptic(); setRadiusFilter(radiusFilter === 2 ? null : 2); }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                radiusFilter === 2
                  ? "bg-foreground text-background font-black"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              &lt; 2 km (Walking)
            </button>
            <button
              onClick={() => { triggerHaptic(); setRadiusFilter(radiusFilter === 5 ? null : 5); }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                radiusFilter === 5
                  ? "bg-foreground text-background font-black"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              &lt; 5 km
            </button>
            <button
              onClick={() => { triggerHaptic(); setRadiusFilter(radiusFilter === 25 ? null : 25); }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                radiusFilter === 25
                  ? "bg-foreground text-background font-black"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              &lt; 25 km
            </button>

            {/* Sorting Toggle */}
            <select
              value={sortBy}
              onChange={e => { triggerHaptic(); setSortBy(e.target.value as any); }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-muted/50 text-foreground border border-border shrink-0 focus:outline-none"
            >
              <option value="distance">Nearest First</option>
              <option value="rating">Top Rated</option>
              <option value="reviews">Most Reviewed</option>
            </select>
          </div>
        </div>
      </header>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Found {processedRestaurants.length} Restaurants
        </span>
        {userLocation && (
          <span className="text-[11px] font-medium text-orange-400">
            📍 Sorted by proximity
          </span>
        )}
      </div>

      {/* Immediate Proximity (< 5km) if available */}
      {nearby.length > 0 && selectedCity !== "All" && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
            <Navigation className="text-orange-500" size={16} />
            <h2 className="font-black text-sm text-foreground uppercase tracking-wider">Immediate Proximity</h2>
            <span className="ml-auto text-[11px] font-bold text-muted-foreground">{nearby.length} Places</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence>
              {nearby.map((res, i) => (
                <RestaurantCard key={res.id} restaurant={res} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* All / Regional Eateries */}
      <section>
        {nearby.length > 0 && selectedCity !== "All" && (
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
            <Compass className="text-white/60" size={16} />
            <h2 className="font-black text-sm text-foreground uppercase tracking-wider">Regional & Global Culinary Gems</h2>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {(nearby.length > 0 && selectedCity !== "All" ? others : processedRestaurants).length > 0 ? (
            (nearby.length > 0 && selectedCity !== "All" ? others : processedRestaurants).map((res, i) => (
              <RestaurantCard key={res.id} restaurant={res} index={i} isSmall />
            ))
          ) : (
             <div className="col-span-full py-20 text-center bg-muted/20 border border-dashed border-border rounded-3xl p-8">
                <UtensilsCrossed className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-foreground font-bold text-base mb-1">No restaurants matched your filters</p>
                <p className="text-xs text-muted-foreground">Try clearing radius filters or switching to "All Food Capitals".</p>
             </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RestaurantCard({ restaurant, index, isSmall = false }: { restaurant: any, index: number, isSmall?: boolean }) {
  const { getAppUrl } = useAppUrl();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + " " + (restaurant.location || ""))}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.4 }}
      className="group relative h-full flex flex-col"
    >
      {/* Quick Google Maps directions icon on hover / tap */}
      <div className="absolute top-3 right-3 z-10">
        <a 
          href={mapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-black/60 backdrop-blur-md hover:bg-orange-500 text-white p-2 rounded-full border border-white/15 transition-all flex items-center justify-center shadow-lg active:scale-90"
          onClick={(e) => { e.stopPropagation(); triggerHaptic(); }}
          title="Open Directions in Google Maps"
        >
          <Navigation size={13} />
        </a>
      </div>

      <Link 
        to={getAppUrl(`/restaurant/${restaurant.id}`)} 
        onClick={() => triggerHaptic()} 
        className="block h-full active:scale-[0.98] transition-transform touch-manipulation flex-1"
      >
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border shadow-md transition-all duration-300 hover:border-orange-500/40 hover:-translate-y-0.5 h-full flex flex-col">
          
          {/* Image */}
          <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-900">
            {restaurant.image ? (
              <img 
                src={restaurant.image} 
                alt={restaurant.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <UtensilsCrossed size={24} className="text-white/20" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Distance & Rating Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              {restaurant.distance !== undefined && restaurant.distance !== Infinity && (
                <span className="font-bold text-[10px] text-white px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-1">
                  <MapPin size={9} className="text-orange-400" />
                  {formatDistance(restaurant.distance)}
                </span>
              )}
            </div>

            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                <Star size={11} className="fill-orange-400 text-orange-400" />
                <span className="text-[11px] font-black">
                  {typeof restaurant.rating === 'number' ? restaurant.rating.toFixed(1) : restaurant.rating || "4.8"}
                </span>
              </div>
              <span className="text-[10px] font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                {restaurant.priceLevel || "₹₹"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-3.5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-foreground group-hover:text-orange-400 transition-colors line-clamp-1">
                {restaurant.name}
              </h3>
              <p className="text-[11px] font-semibold text-orange-400 mt-0.5 line-clamp-1">
                {restaurant.cuisine}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                {restaurant.location}
              </p>
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
