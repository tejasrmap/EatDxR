import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, Restaurant as RestaurantType } from "../types";
import { ReviewCard } from "./ReviewCard";
import { Star, Bookmark, Heart, Edit3, Map as MapIcon, ChevronLeft, Share2, Info, UtensilsCrossed, Trophy, Flame, MapPin } from "lucide-react";
import { useAuth } from "../App";
import { toast } from "sonner";
import { LogMealModal } from "./LogMealModal";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";

export const Restaurant: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { user, dishdUser, login } = useAuth();
  const { isAppMode } = useAppUrl();
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingEatlist, setIsUpdatingEatlist] = useState(false);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
 
  const isInEatlist = dishdUser?.eatlist?.includes(restaurantId || "");
  const hasLiked = dishdUser?.likes?.includes(restaurantId || "");

  // Calculate dynamic Must-Order Dish Rankings from critic logs
  const rankedDishes = React.useMemo(() => {
    interface DishAggregate {
      name: string;
      totalScore: number;
      count: number;
      mustOrderVotes: number;
      image?: string;
    }
    const dishMap = new Map<string, DishAggregate>();

    reviews.forEach(review => {
      review.dishes?.forEach(dish => {
        if (!dish.name?.trim()) return;
        const key = dish.name.trim().toLowerCase();
        const existing: DishAggregate = dishMap.get(key) || {
          name: dish.name.trim(),
          totalScore: 0,
          count: 0,
          mustOrderVotes: 0,
          image: dish.image,
        };
        const ratingVal = dish.rating || review.rating || 4;
        existing.totalScore += ratingVal <= 5 ? ratingVal * 2 : ratingVal;
        existing.count += 1;
        if (dish.isMustOrder) existing.mustOrderVotes += 1;
        if (dish.image && !existing.image) existing.image = dish.image;
        dishMap.set(key, existing);
      });
    });

    if (restaurant?.signatureDish) {
      const key = restaurant.signatureDish.trim().toLowerCase();
      if (!dishMap.has(key)) {
        dishMap.set(key, {
          name: restaurant.signatureDish.trim(),
          totalScore: 9.6,
          count: 1,
          mustOrderVotes: 1,
          image: restaurant.image,
        });
      }
    }

    if (restaurant?.menuItems) {
      restaurant.menuItems.forEach(item => {
        const key = item.trim().toLowerCase();
        if (!dishMap.has(key)) {
          dishMap.set(key, {
            name: item.trim(),
            totalScore: 8.8,
            count: 1,
            mustOrderVotes: 0,
          });
        }
      });
    }

    const aggregates: DishAggregate[] = Array.from(dishMap.values());
    return aggregates
      .map(d => ({
        name: d.name,
        score: Number((d.totalScore / d.count).toFixed(1)),
        votes: d.count,
        mustOrderVotes: d.mustOrderVotes,
        image: d.image,
        recommendationRate: Math.min(99, Math.round((d.totalScore / (d.count * 10)) * 100)),
      }))
      .sort((a, b) => b.score - a.score);
  }, [reviews, restaurant]);

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
    <div className="min-h-screen bg-background text-foreground pb-16 elite-motion-safe">
      {/* Dynamic Header (shown in website mode; AppLayout provides unified header in app mode) */}
      {!isAppMode && (
        <header 
          className="fixed top-0 left-0 right-0 z-[110] h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 transition-all duration-500 bg-background/90 backdrop-blur-xl border-b border-border"
        >
          <button 
            onClick={() => { triggerHaptic(); navigate(-1); }}
            className="p-2 sm:p-2.5 bg-muted border border-border hover:bg-foreground hover:text-background rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 
            className="font-medium tracking-wide uppercase text-xs text-foreground/80 transition-opacity duration-300 truncate max-w-[180px] sm:max-w-[260px]"
            style={{ opacity: headerOpacity }}
          >
            {restaurant.name}
          </h2>
          <button 
            onClick={() => {
              triggerHaptic();
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied!");
            }}
            className="p-2 sm:p-2.5 bg-muted border border-border hover:bg-foreground hover:text-background rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Share2 size={16} />
          </button>
        </header>
      )}

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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-6"
            >
               <span className="font-medium text-[11px] uppercase tracking-wider text-foreground bg-background/50 backdrop-blur-md border border-border rounded-full px-4 py-1.5">{restaurant.cuisine}</span>
               <span className="font-medium text-[11px] uppercase tracking-wider text-foreground bg-background/80 backdrop-blur-md border border-border rounded-full px-4 py-1.5">{restaurant.location}</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-5xl md:text-7xl font-bold text-foreground tracking-tight leading-none mb-4"
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
             <div className="flex items-center justify-around md:justify-start md:gap-16 bg-muted/30 border border-border rounded-3xl shadow-2xl p-10 relative overflow-hidden">
               <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                     <span className="text-5xl font-semibold tracking-tight">{averageRating}</span>
                     <Star className="w-6 h-6 fill-foreground text-foreground" />
                  </div>
                  <p className="font-medium uppercase tracking-wider text-[11px] text-muted-foreground">Mean Score</p>
               </div>
               <div className="w-[1px] h-12 bg-border" />
               <div className="text-center md:text-left">
                  <p className="text-5xl font-semibold tracking-tight mb-2">{reviews.length}</p>
                  <p className="font-medium uppercase tracking-wider text-[11px] text-muted-foreground">Logs Recorded</p>
               </div>
               <div className="w-[1px] h-12 bg-border" />
               <div className="flex gap-8">
                 <button 
                  onClick={toggleLike}
                  className={`flex flex-col items-center gap-2 transition-all group ${hasLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                 >
                   <Heart className={`w-8 h-8 transition-transform group-active:scale-90 ${hasLiked ? 'fill-rose-500' : ''}`} />
                   <span className="font-medium text-[11px] uppercase tracking-wider">{restaurant.likesCount || 0}</span>
                 </button>
                 <button 
                  onClick={toggleEatlist}
                  className={`flex flex-col items-center gap-2 transition-all group ${isInEatlist ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   <Bookmark className={`w-8 h-8 transition-transform group-active:scale-90 ${isInEatlist ? 'fill-foreground' : ''}`} />
                   <span className="font-medium text-[11px] uppercase tracking-wider">List</span>
                 </button>
               </div>
             </div>

              {/* Must-Order Dishes Leaderboard */}
              {rankedDishes.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                          <span>Must-Order Dishes</span>
                          <span className="text-[10px] bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/30 font-mono">
                            Ranked by Critics
                          </span>
                        </h3>
                        <p className="text-xs text-muted-foreground">Top-rated bites at {restaurant.name}, ranked by verified critic logs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {rankedDishes.slice(0, 6).map((dish, index) => (
                      <div
                        key={dish.name}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-muted/30 hover:bg-muted/50 border border-border transition-all group relative overflow-hidden"
                      >
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          index === 0 ? "bg-amber-400 text-black shadow-md shadow-amber-400/30" :
                          index === 1 ? "bg-zinc-200 text-black" :
                          index === 2 ? "bg-amber-700/80 text-white" :
                          "bg-muted border border-border text-muted-foreground"
                        }`}>
                          #{index + 1}
                        </div>

                        {/* Image Thumbnail */}
                        {dish.image && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border">
                            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                        )}

                        {/* Dish Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-foreground truncate">{dish.name}</h4>
                            {dish.mustOrderVotes > 0 && (
                              <Flame size={12} className="text-amber-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span className="text-amber-400 font-bold flex items-center gap-0.5">
                              <Star size={10} className="fill-amber-400" />
                              {dish.score}/10
                            </span>
                            <span>•</span>
                            <span>{dish.recommendationRate}% recommend</span>
                            <span>•</span>
                            <span>{dish.votes} {dish.votes === 1 ? 'log' : 'logs'}</span>
                          </div>
                        </div>

                        {/* Rate Action */}
                        <button
                          onClick={() => {
                            triggerHaptic();
                            if (!user) login();
                            else setIsLogModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black border border-orange-500/20 text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer active:scale-95"
                        >
                          Rate
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

             {/* Signature Flavors */}
              {restaurant.menuItems && restaurant.menuItems.length > 0 && (
                <section>
                  <h3 className="font-medium uppercase tracking-wider text-[11px] text-muted-foreground mb-6 border-b border-border pb-4">Culinary Pillars</h3>
                  <div className="flex flex-wrap gap-3">
                    {restaurant.menuItems.map((item, i) => (
                      <div key={i} className="bg-muted/30 border border-border rounded-xl px-5 py-2.5 text-sm font-medium text-foreground flex items-center gap-3 hover:bg-muted/50 transition-all cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground transition-all" />
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}

             {/* Experiences */}
             <section>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                   <h3 className="font-medium uppercase tracking-wider text-[11px] text-foreground/80">The Critic Stream</h3>
                   <span className="font-medium uppercase tracking-wider text-[10px] text-muted-foreground">{reviews.length} Experiences</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="col-span-full py-24 text-center bg-muted/30 border border-dashed border-border rounded-3xl p-12">
                       <p className="text-muted-foreground font-medium text-sm">Empty Territory...</p>
                    </div>
                  )}
                </div>
             </section>
           </div>

           {/* Sidebar */}
           <div className="hidden lg:block">
              <div className="bg-muted/30 border border-border rounded-3xl shadow-2xl p-8 sticky top-32 overflow-hidden group">
                 <h4 className="font-medium uppercase tracking-wider text-[11px] text-muted-foreground mb-6">Spatial Context</h4>
                 <div className="aspect-square bg-muted border border-border rounded-2xl mb-8 flex items-center justify-center relative overflow-hidden shadow-inner">
                    <img 
                      src={`https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80`} 
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-50"
                    />
                    <MapPin className="text-foreground/80 group-hover:text-foreground transition-colors relative z-10" size={48} />
                 </div>
                 {restaurant.lat && restaurant.lng && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-foreground text-background rounded-full py-3.5 font-medium text-sm text-center hover:scale-105 shadow-lg transition-all block"
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
              className="flex-1 bg-foreground text-background font-medium text-sm h-14 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-2xl"
            >
              <Edit3 size={18} />
              Log Your Experience
            </button>
            
            {restaurant.lat && restaurant.lng && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-background/50 backdrop-blur-xl text-foreground w-14 h-14 rounded-full border border-border flex items-center justify-center transition-all hover:bg-muted shadow-lg md:hidden"
              >
                <MapPin size={20} />
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
