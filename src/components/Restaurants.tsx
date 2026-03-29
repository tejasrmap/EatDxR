import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Restaurant } from "../types";
import { Link } from "react-router-dom";
import { Star, MapPin, Navigation, Loader2, Compass, UtensilsCrossed, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getDistanceKM, formatDistance } from "../lib/distance";
import { motion, AnimatePresence } from "motion/react";

export function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');

  useEffect(() => {
    // 1. Get User Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationStatus('granted');
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (error.code === 1) setLocationStatus('denied');
          else setLocationStatus('error');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('error');
    }

    // 2. Fetch Restaurants
    const fetchRestaurants = async () => {
      try {
        const q = query(collection(db, "restaurants"), limit(500));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Restaurant[];
        setRestaurants(data);
      } catch (e) {
        console.error("Failed to fetch restaurants", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const setSRMAPLocation = () => {
    setUserLocation({ lat: 16.4819, lng: 80.5050 });
    setLocationStatus('granted');
    toast.success("Location set to SRMAP Campus Hub.");
  };

  // Calculate distances and sort
  const sortedRestaurants = useMemo(() => {
    if (!userLocation) return restaurants.sort((a,b) => (b.rating || 0) - (a.rating || 0));

    return restaurants.map(res => {
      const distance = (res.lat && res.lng) 
        ? getDistanceKM(userLocation.lat, userLocation.lng, res.lat, res.lng)
        : Infinity;
      return { ...res, distance };
    }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }, [restaurants, userLocation]);

  // Split into Nearby (< 5km) and Others
  const nearby = sortedRestaurants.filter(r => (r.distance || Infinity) < 5);
  const others = sortedRestaurants.filter(r => (r.distance || Infinity) >= 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="space-y-4 text-center">
           <Loader2 className="w-12 h-12 animate-spin text-[#00e054] mx-auto" />
           <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-black">Syncing Regional Eateries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-32 md:pb-20 px-4 md:px-6 max-w-7xl mx-auto">
      <header className="mb-10 md:mb-16">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Discover <span className="text-[#00e054] italic serif lowercase">nearby</span></h1>
        
        <div className="flex flex-col gap-4">
           <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-md">
                 <MapPin size={14} className={locationStatus === 'granted' ? "text-[#00e054]" : "text-rose-500"} />
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-white/40">Status</span>
                    <span className="text-[10px] md:text-xs font-bold text-white uppercase">
                      {locationStatus === 'granted' ? 'High Precision' : 'Locating...'}
                    </span>
                  </div>
              </div>

              <button 
                onClick={setSRMAPLocation}
                className="bg-white hover:bg-[#00e054] text-black px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[11px] transition-all active:scale-95 shadow-xl flex items-center gap-2"
              >
                <Navigation size={12} className="fill-black" />
                I'm at SRMAP
              </button>
           </div>
        </div>
      </header>

      {/* Nearby Section - Horizontal Carousel for Mobile */}
      {nearby.length > 0 && (
        <section className="mb-12 md:mb-20 -mx-4 md:mx-0">
          <div className="flex items-center justify-between mb-4 md:mb-8 px-4 md:px-0">
            <div className="flex items-center gap-3">
               <div className="hidden md:flex w-8 h-8 bg-[#00e054] rounded-lg items-center justify-center">
                  <Navigation className="text-black" size={16} />
               </div>
               <h2 className="small-caps text-base md:text-lg tracking-[0.1em] text-white/80">Right Now & Nearby</h2>
            </div>
            <p className="text-[8px] md:text-[10px] uppercase font-bold text-white/20 tracking-widest">{nearby.length} Places</p>
          </div>

          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 overflow-x-auto md:overflow-visible px-4 md:px-0 pb-4 md:pb-0 scroll-smooth snap-x">
            <AnimatePresence>
              {nearby.map((res, i) => (
                <div key={res.id} className="min-w-[280px] md:min-w-0 snap-center">
                  <RestaurantCard restaurant={res} index={i} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Others / More Section - 2 Column Grid for Mobile */}
      <section>
        <div className="flex items-center justify-between mb-4 md:mb-8 pb-3 border-b border-white/10">
           <div className="flex items-center gap-3">
              <div className="hidden md:flex w-8 h-8 bg-zinc-800 rounded-lg items-center justify-center">
                 <Compass className="text-white/40" size={16} />
              </div>
              <h2 className="small-caps text-base md:text-lg tracking-[0.1em] text-white/80">Explore the Region</h2>
           </div>
           <ChevronRight className="text-white/10 md:hidden" size={20} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {others.length > 0 ? (
            others.map((res, i) => (
              <RestaurantCard key={res.id} restaurant={res} index={i} isSmall />
            ))
          ) : (
             <div className="col-span-full py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                <UtensilsCrossed className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-serif italic text-sm">No other restaurants gathered in this sweep yet.</p>
             </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RestaurantCard({ restaurant, index, isSmall = false }: { restaurant: any, index: number, isSmall?: boolean }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <div className="absolute top-3 right-3 z-10 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={mapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/10 hover:bg-[#00e054] text-white hover:text-black p-2 rounded-full backdrop-blur-md border border-white/20 transition-all flex items-center justify-center shadow-xl"
        >
          <Navigation size={12} />
        </a>
      </div>
      <Link to={`/restaurant/${restaurant.id}`} className="block">
        <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-zinc-900 border border-white/10 shadow-xl transition-all ${isSmall ? 'aspect-[3/4] md:aspect-[4/3]' : 'aspect-square md:aspect-video'}`}>
          <img 
            src={restaurant.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80`} 
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover md:grayscale transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 md:p-6">
            <div className="flex items-center justify-between mb-1 md:mb-2">
               <span className="bg-[#00e054] text-black text-[7px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                  {formatDistance(restaurant.distance)}
               </span>
               <div className="flex items-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-bold text-white/80">
                  <Star className="w-2 md:w-3 h-2 md:h-3 fill-[#00e054] text-[#00e054]" />
                  {restaurant.rating?.toFixed ? restaurant.rating.toFixed(1) : restaurant.rating || "0.0"}
               </div>
            </div>
            <h3 className="text-sm md:text-2xl font-black text-white uppercase tracking-tight line-clamp-1 leading-tight">{restaurant.name}</h3>
            <p className="text-white/40 text-[7px] md:text-[10px] uppercase font-bold tracking-widest mt-0.5 truncate">{restaurant.location}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
