import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, Restaurant as RestaurantType } from "../types";
import { ReviewCard } from "./ReviewCard";
import { Star, Bookmark, Heart, Edit3, Map, ChevronLeft, Share2, Info, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../App";
import { toast } from "sonner";
import { LogMealModal } from "./LogMealModal";

export const Restaurant: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { user, dishdUser, login } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingEatlist, setIsUpdatingEatlist] = useState(false);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
 
  const isInEatlist = dishdUser?.eatlist?.includes(restaurantId || "");
  const hasLiked = dishdUser?.likes?.includes(restaurantId || "");

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleEatlist = async () => {
    if (!user || !restaurantId) {
      login();
      return;
    }
    
    setIsUpdatingEatlist(true);
    try {
      const userRef = doc(db, "users", user.uid);
      if (isInEatlist) {
        await updateDoc(userRef, { eatlist: arrayRemove(restaurantId) });
        toast.success("Removed from your Eatlist!");
      } else {
        await updateDoc(userRef, { eatlist: arrayUnion(restaurantId) });
        toast.success("Added to your Eatlist!");
      }
    } catch (error) {
      console.error("Error updating eatlist:", error);
      toast.error("Failed to update Eatlist");
    } finally {
      setIsUpdatingEatlist(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !restaurantId) {
      login();
      return;
    }
    
    setIsUpdatingLike(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const restaurantRef = doc(db, "restaurants", restaurantId);
      
      if (hasLiked) {
        await updateDoc(userRef, { likes: arrayRemove(restaurantId) });
        await updateDoc(restaurantRef, { likesCount: increment(-1) });
        toast.success("Removed from your likes");
      } else {
        await updateDoc(userRef, { likes: arrayUnion(restaurantId) });
        await updateDoc(restaurantRef, { likesCount: increment(1) });
        toast.success("Added to your likes!");
      }

      setRestaurant(prev => prev ? { 
        ...prev, 
        likesCount: (prev.likesCount || 0) + (hasLiked ? -1 : 1) 
      } : null);

    } catch (error) {
      console.error("Error updating likes:", error);
      toast.error("Failed to update likes");
    } finally {
      setIsUpdatingLike(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;

    const fetchRestaurant = async () => {
      try {
        const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
        if (restaurantDoc.exists()) {
          setRestaurant(restaurantDoc.data() as RestaurantType);
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      }
    };

    fetchRestaurant();

    const q = query(
      collection(db, "reviews"),
      where("restaurantId", "==", restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      reviewsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setReviews(reviewsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching restaurant reviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00e054]"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl serif italic text-white/40">Restaurant not found</h1>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const headerOpacity = Math.min(1, scrollY / 200);

  return (
    <div className="min-h-screen bg-black text-white pb-40 elite-motion-safe">
      {/* Dynamic Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-[110] h-20 flex items-center justify-between px-6 transition-all duration-500 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5"
      >
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white/5 border border-white/10 hover:bg-white hover:text-black rounded-full shadow-lg transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 
          className="font-medium tracking-wide uppercase text-xs text-white/80 transition-opacity duration-300"
          style={{ opacity: headerOpacity }}
        >
          {restaurant.name}
        </h2>
        <button className="p-2.5 bg-white/5 border border-white/10 hover:bg-white hover:text-black rounded-full shadow-lg transition-all">
          <Share2 size={18} />
        </button>
      </header>

      {/* Cinematic Hero */}
      <section className="relative h-[65vh] md:h-[55vh] overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
          src={restaurant.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80`} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-6"
            >
               <span className="font-medium text-[11px] uppercase tracking-wider text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5">{restaurant.cuisine}</span>
               <span className="font-medium text-[11px] uppercase tracking-wider text-white bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5">{restaurant.location}</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none mb-4"
            >
              {restaurant.name}
            </motion.h1>
        </div>
      </section>

      {/* Detail Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 md:gap-20">
           <div className="lg:col-span-2 space-y-16">
             {/* Summary Bar */}
             <div className="flex items-center justify-around md:justify-start md:gap-16 bg-white/[0.02] border border-white/10 rounded-3xl shadow-2xl p-10 relative overflow-hidden">
               <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                     <span className="text-5xl font-semibold tracking-tight">{averageRating}</span>
                     <Star className="w-6 h-6 fill-white text-white" />
                  </div>
                  <p className="font-medium uppercase tracking-wider text-[11px] text-white/40">Mean Score</p>
               </div>
               <div className="w-[1px] h-12 bg-white/10" />
               <div className="text-center md:text-left">
                  <p className="text-5xl font-semibold tracking-tight mb-2">{reviews.length}</p>
                  <p className="font-medium uppercase tracking-wider text-[11px] text-white/40">Logs Recorded</p>
               </div>
               <div className="w-[1px] h-12 bg-white/10" />
               <div className="flex gap-8">
                 <button 
                  onClick={toggleLike}
                  className={`flex flex-col items-center gap-2 transition-all group ${hasLiked ? 'text-rose-500' : 'text-white/40 hover:text-rose-500'}`}
                 >
                   <Heart className={`w-8 h-8 transition-transform group-active:scale-90 ${hasLiked ? 'fill-rose-500' : ''}`} />
                   <span className="font-medium text-[11px] uppercase tracking-wider">{restaurant.likesCount || 0}</span>
                 </button>
                 <button 
                  onClick={toggleEatlist}
                  className={`flex flex-col items-center gap-2 transition-all group ${isInEatlist ? 'text-white' : 'text-white/40 hover:text-white'}`}
                 >
                   <Bookmark className={`w-8 h-8 transition-transform group-active:scale-90 ${isInEatlist ? 'fill-white' : ''}`} />
                   <span className="font-medium text-[11px] uppercase tracking-wider">List</span>
                 </button>
               </div>
             </div>

             {/* Signature Flavors */}
              {restaurant.menuItems && restaurant.menuItems.length > 0 && (
                <section>
                  <h3 className="font-medium uppercase tracking-wider text-[11px] text-white/60 mb-6 border-b border-white/10 pb-4">Culinary Pillars</h3>
                  <div className="flex flex-wrap gap-3">
                    {restaurant.menuItems.map((item, i) => (
                      <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-2.5 text-sm font-medium text-white flex items-center gap-3 hover:bg-white/10 transition-all cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 transition-all" />
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}

             {/* Experiences */}
             <section>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                   <h3 className="font-medium uppercase tracking-wider text-[11px] text-white/80">The Critic Stream</h3>
                   <span className="font-medium uppercase tracking-wider text-[10px] text-white/40">{reviews.length} Experiences</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="col-span-full py-24 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-12">
                       <p className="text-white/40 font-medium text-sm">Empty Territory...</p>
                    </div>
                  )}
                </div>
             </section>
           </div>

           {/* Sidebar */}
           <div className="hidden lg:block">
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl shadow-2xl p-8 sticky top-32 overflow-hidden group">
                 <h4 className="font-medium uppercase tracking-wider text-[11px] text-white/60 mb-6">Spatial Context</h4>
                 <div className="aspect-square bg-[#0a0a0a] border border-white/10 rounded-2xl mb-8 flex items-center justify-center relative overflow-hidden shadow-inner">
                    <img 
                      src={`https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80`} 
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-50"
                    />
                    <Map className="text-white/80 group-hover:text-white transition-colors relative z-10" size={48} />
                 </div>
                 {restaurant.lat && restaurant.lng && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white text-black rounded-full py-3.5 font-medium text-sm text-center hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all block"
                    >
                      Open in Maps
                    </a>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Write Experience Button (Pinned) */}
      <div className="fixed bottom-12 left-0 right-0 z-[120] flex justify-center pointer-events-none px-6">
          <div className="flex gap-4 max-w-lg w-full pointer-events-auto">
            <button 
              onClick={() => (user ? setIsLogModalOpen(true) : login())}
              className="flex-1 bg-white text-black font-medium text-sm h-14 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <Edit3 size={18} />
              Log Your Experience
            </button>
            
            {restaurant.lat && restaurant.lng && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur-xl text-white w-14 h-14 rounded-full border border-white/20 flex items-center justify-center transition-all hover:bg-white/20 shadow-lg md:hidden"
              >
                <Map size={20} />
              </a>
            )}
          </div>
      </div>

      <LogMealModal 
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        initialRestaurant={{
          id: restaurantId || "",
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          location: restaurant.location,
          image: restaurant.image
        }}
      />
    </div>
  );
};
