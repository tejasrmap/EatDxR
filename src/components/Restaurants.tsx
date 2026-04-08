
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

    const fetchRestaurants = async () => {
      try {
        const q = query(collection(db, "restaurants"), limit(100));
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

  const sortedRestaurants = useMemo(() => {
    if (!userLocation) return restaurants.sort((a,b) => (b.rating || 0) - (a.rating || 0));

    return restaurants.map(res => {
      const distance = (res.lat && res.lng) 
        ? getDistanceKM(userLocation.lat, userLocation.lng, res.lat, res.lng)
        : Infinity;
      return { ...res, distance };
    }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }, [restaurants, userLocation]);

  const nearby = sortedRestaurants.filter(r => (r.distance || Infinity) < 5);
  const others = sortedRestaurants.filter(r => (r.distance || Infinity) >= 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="space-y-6 text-center">
           <Loader2 className="w-12 h-12 animate-spin text-white/10 mx-auto" />
           <p className="small-caps text-white/20">Syncing Regional Eateries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 max-w-7xl mx-auto elite-motion-safe">
      <header className="mb-20">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="title-text mb-8"
        >
          Discover <span className="text-accent italic font-serif font-light lowercase">nearby</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-6"
        >
          <div className="flex items-center gap-4 glass-panel px-6 py-3 border-white/10 shadow-2xl">
             <MapPin size={14} className={locationStatus === 'granted' ? "text-accent" : "text-rose-500"} />
              <div className="flex flex-col">
                <span className="small-caps text-[9px] text-white/20">Precision Status</span>
                <span className="text-xs font-bold text-white uppercase tracking-tight">
                  {locationStatus === 'granted' ? 'High Precision Active' : 'Locating Pulse...'}
                </span>
              </div>
          </div>

          <button 
            onClick={setSRMAPLocation}
            className="group flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-full font-bold transition-all active:scale-95 shadow-xl shadow-white/5 hover:bg-zinc-200"
          >
            <Navigation size={14} className="group-hover:rotate-12 transition-transform" />
            Quick Access: SRMAP Hub
          </button>
        </motion.div>
      </header>

      {/* Nearby Section */}
      {nearby.length > 0 && (
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border-white/10">
                  <Navigation className="text-accent" size={18} />
               </div>
               <h2 className="small-caps text-white/60">Immediate Proximity</h2>
            </div>
            <p className="small-caps text-white/20 tracking-normal">{nearby.length} High-Ranked Places</p>
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
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border-white/10">
                 <Compass className="text-white/20" size={18} />
              </div>
              <h2 className="small-caps text-white/60">Regional Gastronomy</h2>
           </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {others.length > 0 ? (
            others.map((res, i) => (
              <RestaurantCard key={res.id} restaurant={res} index={i} isSmall />
            ))
          ) : (
             <div className="col-span-full py-32 text-center glass-panel border-dashed p-12">
                <UtensilsCrossed className="w-16 h-16 text-white/5 mx-auto mb-6" />
                <p className="text-white/20 font-serif italic text-lg">No additional findings in this region sweep.</p>
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      className="group relative h-full"
    >
      <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
        <a 
          href={mapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-zinc-950/60 hover:bg-white text-white hover:text-black p-3.5 rounded-full backdrop-blur-xl border border-white/10 transition-all flex items-center justify-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation size={14} />
        </a>
      </div>
      <Link to={`/restaurant/${restaurant.id}`} className="block h-full">
        <div className={`relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/10 shadow-2xl transition-all duration-700 hover:border-white/20 hover:-translate-y-1 h-full ${isSmall ? 'aspect-[3/4]' : 'aspect-[16/10]'}`}>
          {restaurant.image ? (
            <img 
              src={restaurant.image} 
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent p-8 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
                <span className="small-caps text-[9px] text-white/40 px-3 py-1 rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
                   {formatDistance(restaurant.distance)}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 backdrop-blur-md rounded-full border border-accent/20 shadow-xl">
                   <Star size={12} className="fill-accent text-accent" />
                   <span className="text-xs font-black text-white">
                      {restaurant.rating?.toFixed ? restaurant.rating.toFixed(1) : restaurant.rating || "0.0"}
                   </span>
                </div>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white group-hover:text-accent transition-colors leading-tight mb-1">{restaurant.name}</h3>
            <p className="small-caps text-[10px] text-white/30 tracking-normal truncate">{restaurant.location}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
