import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Restaurant } from "../types";
import { Link } from "react-router-dom";
import { Star, MapPin, Navigation, Loader2, Compass, UtensilsCrossed } from "lucide-react";
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
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <header className="mb-16">
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Discover <span className="text-[#00e054] italic serif lowercase">nearby</span></h1>
        <div className="flex flex-col gap-6">
           <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-md">
                 <MapPin size={16} className={locationStatus === 'granted' ? "text-[#00e054]" : "text-rose-500"} />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Status</span>
                    <span className="text-xs font-bold text-white uppercase mt-0.5">
                      {locationStatus === 'granted' ? 'High Precision Active' : locationStatus === 'denied' ? 'Location Hidden' : 'Locating...'}
                    </span>
                  </div>
              </div>

              {userLocation && (
                <div className="flex items-center gap-4 bg-[#00e054]/5 border border-[#00e054]/20 px-5 py-3 rounded-2xl">
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#00e054]/60">Detected Coordinates</span>
                      <span className="text-sm font-mono text-white font-bold mt-0.5">
                        {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                      </span>
                   </div>
                </div>
              )}

              <button 
                onClick={setSRMAPLocation}
                className="bg-white hover:bg-[#00e054] text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all hover:-translate-y-1 shadow-xl flex items-center gap-2"
              >
                <Navigation size={14} className="fill-black" />
                I'm at SRMAP Campus
              </button>
           </div>
           
           <p className="text-white/30 text-base font-serif italic max-w-2xl border-l-2 border-[#00e054]/40 pl-6 leading-relaxed">
              If the distances seem wrong, your laptop is likely reporting your internet provider's office location. Click <span className="text-white underline font-bold cursor-pointer" onClick={setSRMAPLocation}>"I'm at SRMAP"</span> to force campus accuracy.
           </p>
        </div>
      </header>

      {/* Nearby Section */}
      {nearby.length > 0 && (
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-[#00e054] rounded-lg flex items-center justify-center">
                  <Navigation className="text-black" size={16} />
               </div>
               <h2 className="small-caps text-lg tracking-[0.1em]">Right Now & Nearby</h2>
            </div>
            <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest">{nearby.length} places found within 5km</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {nearby.map((res, i) => (
                <RestaurantCard key={res.id} restaurant={res} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Others / More Section */}
      <section>
        <div className="flex items-center gap-3 mb-8 pb-3 border-b border-white/10">
           <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
              <Compass className="text-white/40" size={16} />
           </div>
           <h2 className="small-caps text-lg tracking-[0.1em]">Explore the Region</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {others.length > 0 ? (
            others.map((res, i) => (
              <RestaurantCard key={res.id} restaurant={res} index={i} isSmall />
            ))
          ) : (
             <div className="col-span-full py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                <UtensilsCrossed className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-serif italic">No other restaurants gathered in this sweep yet.</p>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group relative"
    >
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={mapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/10 hover:bg-[#00e054] text-white hover:text-black p-2 rounded-full backdrop-blur-md border border-white/20 transition-all flex items-center justify-center shadow-xl"
          title="Open in Google Maps"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation size={14} />
        </a>
      </div>
      <Link to={`/restaurant/${restaurant.id}`} className="block">
        <div className={`relative overflow-hidden rounded-3xl bg-zinc-900 border border-white/10 shadow-xl transition-all ${isSmall ? 'aspect-[4/3]' : 'aspect-square md:aspect-video'}`}>
          <img 
            src={restaurant.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80`} 
            alt={restaurant.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-6">
            <div className="flex items-center justify-between mb-2">
               <span className="bg-[#00e054] text-black text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                  {formatDistance(restaurant.distance)}
               </span>
               <div className="flex items-center gap-1 text-[10px] font-bold text-white/60">
                  <Star className="w-3 h-3 fill-[#00e054] text-[#00e054]" />
                  {restaurant.rating?.toFixed ? restaurant.rating.toFixed(1) : restaurant.rating || "0.0"}
               </div>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight line-clamp-1">{restaurant.name}</h3>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">{restaurant.cuisine} • {restaurant.location}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
