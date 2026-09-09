
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Restaurant } from "../types";
import { Link } from "react-router-dom";
import { Star, MapPin, Navigation, Loader2, Compass, UtensilsCrossed, ChevronRight } from "lucide-react";
import { getDistanceKM, formatDistance } from "../lib/distance";
import { motion, AnimatePresence } from "motion/react";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";

export function Restaurants() {
  const { getAppUrl } = useAppUrl();
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
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="space-y-6 text-center">
           <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto" />
           <p className="font-medium tracking-widest text-[12px] text-muted-foreground">Syncing Regional Eateries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-12 md:py-16 px-4 sm:px-6 max-w-7xl mx-auto elite-motion-safe">
      <header className="mb-10 sm:mb-20">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 sm:mb-8"
        >
          Discover <span className="text-muted-foreground font-medium">Nearby Places</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-6"
        >
          <div className="flex items-center gap-4 bg-muted border border-border rounded-2xl px-6 py-3 backdrop-blur-md">
             <MapPin size={18} className={locationStatus === 'granted' ? "text-foreground" : "text-muted-foreground"} />
              <div className="flex flex-col">
                <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest">Precision Status</span>
                <span className="text-xs font-medium text-foreground">
                  {locationStatus === 'granted' ? 'High Precision Active' : 'Locating Pulse...'}
                </span>
              </div>
          </div>

          <button 
            onClick={setSRMAPLocation}
            className="group flex items-center gap-3 bg-foreground text-background px-6 py-3.5 rounded-full font-medium text-[13px] hover:scale-105 shadow-lg transition-all"
          >
            <Navigation size={16} className="group-hover:rotate-12 transition-transform" />
            Quick Access: SRMAP Hub
          </button>
        </motion.div>
      </header>

      {/* Nearby Section */}
      {nearby.length > 0 && (
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10 border-b border-border pb-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-muted rounded-xl border border-border flex items-center justify-center">
                  <Navigation className="text-foreground" size={18} />
               </div>
               <h2 className="font-semibold text-foreground/80 tracking-wide text-[16px]">Immediate Proximity</h2>
            </div>
            <p className="font-medium text-[12px] text-muted-foreground">{nearby.length} High-Ranked Places</p>
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
          <div className="flex items-center justify-between mb-10 border-b border-border pb-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-muted rounded-xl border border-border flex items-center justify-center">
                  <Compass className="text-foreground" size={18} />
               </div>
               <h2 className="font-semibold text-[16px] text-foreground/80 tracking-wide">Regional Gastronomy</h2>
            </div>
          </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {others.length > 0 ? (
            others.map((res, i) => (
              <RestaurantCard key={res.id} restaurant={res} index={i} isSmall />
            ))
          ) : (
             <div className="col-span-full py-32 text-center bg-muted/30 border border-dashed border-border rounded-3xl p-12">
                <UtensilsCrossed className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
                <p className="text-muted-foreground font-medium text-lg">No additional findings in this region sweep.</p>
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
          className="bg-background/50 backdrop-blur-xl hover:bg-foreground text-foreground hover:text-background p-3.5 rounded-full border border-border transition-all flex items-center justify-center shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation size={16} />
        </a>
      </div>
      <Link 
        to={getAppUrl(`/restaurant/${restaurant.id}`)} 
        onClick={() => triggerHaptic()} 
        className="block h-full active:scale-[0.98] transition-transform touch-manipulation"
      >
        <div className={`relative overflow-hidden rounded-3xl bg-muted/30 border border-border shadow-2xl transition-all duration-500 hover:border-foreground/30 hover:-translate-y-1 h-full ${isSmall ? 'aspect-[3/4]' : 'aspect-[16/10]'}`}>
          {restaurant.image ? (
            <img 
              src={restaurant.image} 
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 md:p-8 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-[11px] text-white px-3 py-1 rounded-full border border-white/20 bg-black/50 backdrop-blur-md">
                   {formatDistance(restaurant.distance)}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/20">
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
