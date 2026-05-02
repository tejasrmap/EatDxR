
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="space-y-6 text-center">
           <Loader2 className="w-12 h-12 animate-spin text-white/40 mx-auto" />
           <p className="font-medium tracking-widest text-[12px] text-white/60">Syncing Regional Eateries</p>
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
          className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8"
        >
          Discover <span className="text-white/60 font-medium">Nearby Places</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-6"
        >
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 backdrop-blur-md">
             <MapPin size={18} className={locationStatus === 'granted' ? "text-white" : "text-white/40"} />
              <div className="flex flex-col">
                <span className="font-medium text-[10px] text-white/40 uppercase tracking-widest">Precision Status</span>
                <span className="text-xs font-medium text-white">
                  {locationStatus === 'granted' ? 'High Precision Active' : 'Locating Pulse...'}
                </span>
              </div>
          </div>

          <button 
            onClick={setSRMAPLocation}
            className="group flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-full font-medium text-[13px] hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
          >
            <Navigation size={16} className="group-hover:rotate-12 transition-transform" />
            Quick Access: SRMAP Hub
          </button>
        </motion.div>
      </header>

      {/* Nearby Section */}
      {nearby.length > 0 && (
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <Navigation className="text-white" size={18} />
               </div>
               <h2 className="font-semibold text-white/80 tracking-wide text-[16px]">Immediate Proximity</h2>
            </div>
            <p className="font-medium text-[12px] text-white/40">{nearby.length} High-Ranked Places</p>
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
               <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <Compass className="text-white" size={18} />
               </div>
               <h2 className="font-semibold text-[16px] text-white/80 tracking-wide">Regional Gastronomy</h2>
            </div>
          </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {others.length > 0 ? (
            others.map((res, i) => (
              <RestaurantCard key={res.id} restaurant={res} index={i} isSmall />
            ))
          ) : (
             <div className="col-span-full py-32 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-12">
                <UtensilsCrossed className="w-16 h-16 text-white/20 mx-auto mb-6" />
                <p className="text-white/60 font-medium text-lg">No additional findings in this region sweep.</p>
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
          className="bg-white/10 backdrop-blur-xl hover:bg-white text-white hover:text-black p-3.5 rounded-full border border-white/20 transition-all flex items-center justify-center shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation size={16} />
        </a>
      </div>
      <Link to={`/restaurant/${restaurant.id}`} className="block h-full">
        <div className={`relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/10 shadow-2xl transition-all duration-500 hover:border-white/30 hover:-translate-y-1 h-full ${isSmall ? 'aspect-[3/4]' : 'aspect-[16/10]'}`}>
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 md:p-8 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-[11px] text-white px-3 py-1 rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
                   {formatDistance(restaurant.distance)}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                   <Star size={12} className="fill-white text-white" />
                   <span className="text-xs font-medium text-white">
                      {restaurant.rating?.toFixed ? restaurant.rating.toFixed(1) : restaurant.rating || "0.0"}
                   </span>
                </div>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white transition-colors leading-tight mb-2">{restaurant.name}</h3>
            <p className="font-medium text-[12px] text-white/60 truncate">{restaurant.location}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
