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
import { getShareUrl } from "../utils/shareUrl";
import { getRestaurantById, getReviews, toggleLike as toggleSupabaseLike, upsertProfile } from "../services/supabaseService";

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
      if (dishdUser) {
        const currentEatlist = dishdUser.eatlist || [];
        const nextEatlist = isInEatlist
          ? currentEatlist.filter(id => id !== restaurantId)
          : [...currentEatlist, restaurantId];
        await upsertProfile({
          uid: user.uid,
          eatlist: nextEatlist
        });
      }

      try {
        const userRef = doc(db, "users", user.uid);
        if (isInEatlist) {
          await updateDoc(userRef, { eatlist: arrayRemove(restaurantId) });
        } else {
          await updateDoc(userRef, { eatlist: arrayUnion(restaurantId) });
        }
      } catch {}

      toast.success(isInEatlist ? "Removed from your Eatlist!" : "Added to your Eatlist!");
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
      await toggleSupabaseLike(restaurantId, 'restaurant', user.uid);

      if (dishdUser) {
        const currentLikes = dishdUser.likes || [];
        const nextLikes = hasLiked
          ? currentLikes.filter(id => id !== restaurantId)
          : [...currentLikes, restaurantId];
        await upsertProfile({
          uid: user.uid,
          likes: nextLikes
        });
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const restaurantRef = doc(db, "restaurants", restaurantId);
        if (hasLiked) {
          await updateDoc(userRef, { likes: arrayRemove(restaurantId) });
          await updateDoc(restaurantRef, { likesCount: increment(-1) });
        } else {
          await updateDoc(userRef, { likes: arrayUnion(restaurantId) });
          await updateDoc(restaurantRef, { likesCount: increment(1) });
        }
      } catch {}

      toast.success(hasLiked ? "Removed from your likes" : "Added to your likes!");
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

    let isMounted = true;
    const fetchRestaurantData = async () => {
      try {
        // 1. Fetch restaurant from Supabase
        const supaRest = await getRestaurantById(restaurantId);
        if (!isMounted) return;
        if (supaRest) {
          setRestaurant(supaRest);
        } else {
          // Fallback check
          const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId)).catch(() => null);
          if (restaurantDoc && restaurantDoc.exists() && isMounted) {
            setRestaurant(restaurantDoc.data() as RestaurantType);
          }
        }

        // 2. Fetch reviews from Supabase
        const supaReviews = await getReviews(restaurantId);
        if (!isMounted) return;
        setReviews(supaReviews);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchRestaurantData();

    // 3. Fallback live listener for reviews from Firestore
    try {
      const q = query(
        collection(db, "reviews"),
        where("restaurantId", "==", restaurantId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const reviewsData = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Review[];

        if (reviewsData.length > 0) {
          reviewsData.sort((a, b) => {
            const timeA = (a.createdAt as any)?.toMillis?.() || new Date(a.createdAt || 0).getTime();
            const timeB = (b.createdAt as any)?.toMillis?.() || new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          setReviews(reviewsData);
        }
      }, () => {});

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch {
      return () => {
        isMounted = false;
      };
    }
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
    <div className="min-h-screen bg-black text-white pb-24 selection:bg-orange-500 selection:text-black">
      
      {/* Top Context & Action Bar (Clean in-flow header for website mode) */}
      {!isAppMode && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between">
          <button 
            onClick={() => { triggerHaptic(); navigate(-1); }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs uppercase font-bold text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button 
              onClick={async () => {
                triggerHaptic();
                const url = getShareUrl(`/restaurant/${restaurantId}`);
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: `${restaurant?.name || "Restaurant"} on Madeater`,
                      text: `Check out ${restaurant?.name || "this spot"} on Madeater!`,
                      url,
                    });
                    return;
                  } catch {
                    // user cancelled or fallback
                  }
                }
                navigator.clipboard.writeText(url);
                toast.success("Restaurant link copied!");
              }}
              className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Share Restaurant"
            >
              <Share2 size={16} />
            </button>
            <button 
              onClick={() => (user ? setIsLogModalOpen(true) : login())}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              <Edit3 size={14} />
              <span>Log Experience</span>
            </button>
          </div>
        </div>
      )}

      {/* Cinematic Hero */}
      <section className="relative h-[48vh] sm:h-[55vh] max-w-7xl mx-auto px-4 sm:px-8 mt-2">
        <div className="relative w-full h-full rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-white/15 shadow-2xl bg-zinc-950">
          <motion.img 
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
            src={restaurant.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80`} 
            alt={restaurant.name}
            onError={(e) => {
              // High aesthetic dark fallback if image fails
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";
            }}
            className="w-full h-full object-cover"
          />
          {/* Multi-layer gradient wash */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/30" />
          
          {/* Hero Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 md:p-12 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4"
            >
              <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-orange-400 bg-orange-500/15 backdrop-blur-md border border-orange-500/30 rounded-full px-3 py-1">
                {restaurant.cuisine || "Specialty Dining"}
              </span>
              <span className="font-medium text-[10px] sm:text-xs uppercase tracking-wider text-white/80 bg-black/60 backdrop-blur-md border border-white/15 rounded-full px-3 py-1 flex items-center gap-1">
                <MapPin size={11} className="text-orange-400" />
                <span>{restaurant.location || restaurant.city || "India"}</span>
              </span>
              {restaurant.priceLevel && (
                <span className="font-mono font-bold text-[10px] sm:text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  {restaurant.priceLevel}
                </span>
              )}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-tight max-w-4xl drop-shadow-lg"
            >
              {restaurant.name}
            </motion.h1>
          </div>
        </div>
      </section>

      {/* Main Detail Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
           
           {/* Left/Main Column */}
           <div className="lg:col-span-8 space-y-8 sm:space-y-12">
             
             {/* Unified Summary & Action Bar */}
             <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-6">
               <div className="flex items-center gap-6 sm:gap-10">
                 {/* Rating */}
                 <div>
                    <div className="flex items-baseline gap-1.5 mb-1">
                       <span className="text-3xl sm:text-5xl font-black tracking-tight text-white">{averageRating}</span>
                       <Star className="w-5 h-5 fill-orange-400 text-orange-400 inline" />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-[10px] text-white/50">Critic Score</p>
                 </div>

                 <div className="w-[1px] h-12 bg-white/10" />

                 {/* Logs */}
                 <div>
                    <p className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-1">{reviews.length}</p>
                    <p className="font-bold uppercase tracking-widest text-[10px] text-white/50">Logs Recorded</p>
                 </div>
               </div>

               {/* Social Actions + Log Action */}
               <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                 <button 
                  onClick={toggleLike}
                  disabled={isUpdatingLike}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                    hasLiked 
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-500/30'
                  }`}
                  title="Like restaurant"
                 >
                   <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                   <span className="font-bold text-xs">{restaurant.likesCount || 0}</span>
                 </button>

                 <button 
                  onClick={toggleEatlist}
                  disabled={isUpdatingEatlist}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                    isInEatlist 
                      ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                  }`}
                  title="Add to Eatlist"
                 >
                   <Bookmark className={`w-4 h-4 ${isInEatlist ? 'fill-orange-400 text-orange-400' : ''}`} />
                   <span className="font-bold text-xs">{isInEatlist ? 'Saved' : 'Eatlist'}</span>
                 </button>

                 <button 
                  onClick={() => (user ? setIsLogModalOpen(true) : login())}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-orange-500 text-black font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                 >
                   <Edit3 size={14} />
                   <span>Rate / Log</span>
                 </button>
               </div>
             </div>

              {/* Must-Order Dishes Leaderboard */}
              {rankedDishes.length > 0 && (
                <section className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-400/10 border border-orange-400/20 flex items-center justify-center text-orange-400">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                          <span>Must-Order Dishes</span>
                          <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 font-mono font-bold">
                            Ranked by Critics
                          </span>
                        </h3>
                        <p className="text-xs text-white/50">Top-rated bites at {restaurant.name}, ranked by verified critic logs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {rankedDishes.slice(0, 6).map((dish, index) => (
                      <div
                        key={dish.name}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-white/10 transition-all group relative overflow-hidden"
                      >
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          index === 0 ? "bg-orange-500 text-black shadow-md shadow-orange-500/30" :
                          index === 1 ? "bg-zinc-200 text-black" :
                          index === 2 ? "bg-amber-700 text-white" :
                          "bg-white/5 border border-white/10 text-white/60"
                        }`}>
                          #{index + 1}
                        </div>

                        {/* Image Thumbnail */}
                        {dish.image && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                        )}

                        {/* Dish Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white truncate">{dish.name}</h4>
                            {dish.mustOrderVotes > 0 && (
                              <Flame size={12} className="text-orange-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50">
                            <span className="text-orange-400 font-bold flex items-center gap-0.5">
                              <Star size={10} className="fill-orange-400" />
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
                  <h3 className="font-bold uppercase tracking-widest text-xs text-white/50 mb-4 border-b border-white/10 pb-3">Culinary Pillars</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {restaurant.menuItems.map((item, i) => (
                      <div key={i} className="bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white/90 flex items-center gap-2 hover:border-white/20 transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}

             {/* Experiences */}
             <section>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                   <h3 className="font-bold uppercase tracking-widest text-xs text-white/80">The Critic Stream</h3>
                   <span className="font-mono text-xs text-white/50">{reviews.length} Experiences</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center bg-zinc-950/40 border border-dashed border-white/15 rounded-3xl p-8">
                       <UtensilsCrossed className="w-10 h-10 text-white/20 mx-auto mb-3" />
                       <p className="text-white/60 font-bold text-sm">No Critic Logs Yet</p>
                       <p className="text-white/40 text-xs mt-1">Be the first food critic to log your meal at {restaurant.name}!</p>
                       <button
                        onClick={() => (user ? setIsLogModalOpen(true) : login())}
                        className="mt-4 px-4 py-2 rounded-full bg-orange-500 text-black font-black text-xs uppercase tracking-wider hover:bg-orange-400 transition-all cursor-pointer"
                       >
                         Log First Review
                       </button>
                    </div>
                  )}
                </div>
             </section>
           </div>

           {/* Right Column: Spatial Context / Sidebar */}
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl sticky top-24">
                 <h4 className="font-bold uppercase tracking-widest text-xs text-white/50 mb-4 flex items-center justify-between">
                   <span>Spatial Context</span>
                   <MapPin size={13} className="text-orange-500" />
                 </h4>
                 
                 <div className="aspect-video bg-zinc-900 border border-white/10 rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden shadow-inner group">
                    <img 
                      src={`https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80`} 
                      alt="Map Texture"
                      className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="relative z-10 text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <MapPin size={22} />
                      </div>
                      <p className="text-xs font-bold text-white truncate max-w-[200px]">{restaurant.name}</p>
                      <p className="text-[10px] text-white/50 truncate max-w-[200px]">{restaurant.location || restaurant.city}</p>
                    </div>
                 </div>

                 <div className="space-y-2.5 text-xs text-white/70 mb-5">
                   <div className="flex justify-between py-1.5 border-b border-white/5">
                     <span className="text-white/40">City</span>
                     <span className="font-bold text-white">{restaurant.city || "Hyderabad"}</span>
                   </div>
                   <div className="flex justify-between py-1.5 border-b border-white/5">
                     <span className="text-white/40">Cuisine</span>
                     <span className="font-bold text-orange-400">{restaurant.cuisine || "Specialty"}</span>
                   </div>
                   {restaurant.hours && (
                     <div className="flex justify-between py-1.5 border-b border-white/5">
                       <span className="text-white/40">Hours</span>
                       <span className="font-medium text-white">{restaurant.hours}</span>
                     </div>
                   )}
                 </div>

                 <a 
                   href={restaurant.lat && restaurant.lng 
                     ? `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`
                     : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + (restaurant.location || restaurant.city || ''))}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="w-full bg-white hover:bg-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl py-3 text-center transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg cursor-pointer"
                 >
                   <MapIcon size={14} />
                   <span>Open in Google Maps</span>
                 </a>
              </div>
           </div>

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

