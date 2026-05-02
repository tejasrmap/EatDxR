
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
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="space-y-6 text-center">
           <Loader2 className="w-12 h-12 animate-spin text-[#ccff00] mx-auto" />
           <p className="font-black uppercase tracking-widest text-[12px] text-[#00ffff]">Syncing Regional Eateries</p>
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
          className="font-black text-4xl md:text-6xl uppercase tracking-tighter text-white mb-8" style={{ textShadow: '4px 4px 0px #ff00ff' }}
        >
          Discover <span className="text-[#ccff00]" style={{ textShadow: '4px 4px 0px #00ffff' }}>NEARBY</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-6"
        >
          <div className="flex items-center gap-4 bg-black border-4 border-[#333333] shadow-[4px_4px_0px_#00ffff] px-6 py-3">
             <MapPin size={18} className={locationStatus === 'granted' ? "text-[#ccff00]" : "text-[#ff00ff]"} />
              <div className="flex flex-col">
                <span className="font-black uppercase tracking-widest text-[10px] text-white/40">Precision Status</span>
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  {locationStatus === 'granted' ? 'High Precision Active' : 'Locating Pulse...'}
                </span>
              </div>
          </div>

          <button 
            onClick={setSRMAPLocation}
            className="group flex items-center gap-3 bg-[#ff00ff] text-black px-8 py-3.5 border-4 border-black font-black uppercase text-[12px] tracking-widest shadow-[4px_4px_0px_#ccff00] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <Navigation size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            Quick Access: SRMAP Hub
          </button>
        </motion.div>
      </header>

      {/* Nearby Section */}
      {nearby.length > 0 && (
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10 border-b-4 border-[#333333] pb-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-black border-4 border-[#333333] shadow-[4px_4px_0px_#ccff00] flex items-center justify-center">
                  <Navigation className="text-[#ccff00]" size={20} />
               </div>
               <h2 className="font-black uppercase tracking-widest text-[16px] text-white">Immediate Proximity</h2>
            </div>
            <p className="font-black uppercase tracking-widest text-[10px] text-white/40 bg-[#111111] border-2 border-[#333333] px-3 py-1">{nearby.length} High-Ranked Places</p>
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
          <div className="flex items-center justify-between mb-10 border-b-4 border-[#333333] pb-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-black border-4 border-[#333333] shadow-[4px_4px_0px_#00ffff] flex items-center justify-center">
                  <Compass className="text-[#00ffff]" size={20} />
               </div>
               <h2 className="font-black uppercase tracking-widest text-[16px] text-white">Regional Gastronomy</h2>
            </div>
          </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {others.length > 0 ? (
            others.map((res, i) => (
              <RestaurantCard key={res.id} restaurant={res} index={i} isSmall />
            ))
          ) : (
             <div className="col-span-full py-32 text-center bg-[#111] border-4 border-dashed border-[#333333] p-12">
                <UtensilsCrossed className="w-16 h-16 text-white/40 mx-auto mb-6" />
                <p className="text-white font-black uppercase tracking-widest text-lg">No additional findings in this region sweep.</p>
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
          className="bg-[#ccff00] text-black hover:bg-[#ff00ff] p-3 border-2 border-black transition-all flex items-center justify-center shadow-[4px_4px_0px_#00ffff]"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation size={18} />
        </a>
      </div>
      <Link to={`/restaurant/${restaurant.id}`} className="block h-full">
        <div className={`relative overflow-hidden rounded-none bg-black border-4 border-[#333333] shadow-[8px_8px_0px_#ff00ff] transition-all duration-300 hover:border-[#ccff00] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_#ff00ff] h-full ${isSmall ? 'aspect-[3/4]' : 'aspect-[16/10]'}`}>
          {restaurant.image ? (
            <img 
              src={restaurant.image} 
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-[#111111]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 md:p-8 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
                <span className="font-black text-[10px] uppercase tracking-widest text-[#00ffff] px-3 py-1 border-2 border-[#333333] bg-black shadow-[2px_2px_0px_#ccff00]">
                   {formatDistance(restaurant.distance)}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-black border-2 border-[#333333] shadow-[2px_2px_0px_#00ffff]">
                   <Star size={14} className="fill-[#ccff00] text-[#ccff00]" />
                   <span className="text-xs font-black text-[#ccff00]">
                      {restaurant.rating?.toFixed ? restaurant.rating.toFixed(1) : restaurant.rating || "0.0"}
                   </span>
                </div>
            </div>
            <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white group-hover:text-[#ff00ff] transition-colors leading-tight mb-2">{restaurant.name}</h3>
            <p className="font-black text-[10px] text-white/60 tracking-widest uppercase truncate">{restaurant.location}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
