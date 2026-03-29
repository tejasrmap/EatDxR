import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, Restaurant as RestaurantType } from "../types";
import { ReviewCard } from "./ReviewCard";
import { Star, Bookmark, Heart, Edit3, Map, ChevronLeft, Share2, Info } from "lucide-react";
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
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Dynamic Mobile Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-[110] h-16 flex items-center justify-between px-4 transition-colors"
        style={{ backgroundColor: `rgba(20, 24, 28, ${headerOpacity})` }}
      >
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/5"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 
          className="text-xs font-black uppercase tracking-widest transition-opacity"
          style={{ opacity: headerOpacity }}
        >
          {restaurant.name}
        </h2>
        <button className="p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
          <Share2 size={18} />
        </button>
      </header>

      {/* Full-Bleed Hero */}
      <section className="relative h-[60vh] md:h-[50vh] overflow-hidden">
        <img 
          src={restaurant.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80`} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="flex items-center gap-2 mb-3">
               <span className="bg-[#00e054] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{restaurant.cuisine}</span>
               <span className="bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">{restaurant.location}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">{restaurant.name}</h1>
        </div>
      </section>

      {/* Detail Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
           {/* Summary Bar */}
           <div className="md:col-span-2 space-y-8">
             <div className="flex items-center justify-around md:justify-start md:gap-12 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
               <div className="text-center md:text-left">
                  <p className="text-3xl font-black flex items-center justify-center md:justify-start gap-1">
                     {averageRating} <Star className="w-5 h-5 fill-[#00e054] text-[#00e054]" />
                  </p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mt-1">Avg Rating</p>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <div className="text-center md:text-left">
                  <p className="text-3xl font-black">{reviews.length}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mt-1">Total Reviews</p>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <div className="flex gap-6">
                 <button 
                  onClick={toggleLike}
                  className={`flex flex-col items-center gap-1 transition-all ${hasLiked ? 'text-rose-500' : 'text-white/40'}`}
                 >
                   <Heart className={`w-7 h-7 ${hasLiked ? 'fill-rose-500' : ''}`} />
                   <span className="text-[8px] font-black uppercase">{restaurant.likesCount || 0}</span>
                 </button>
                 <button 
                  onClick={toggleEatlist}
                  className={`flex flex-col items-center gap-1 transition-all ${isInEatlist ? 'text-orange-500' : 'text-white/40'}`}
                 >
                   <Bookmark className={`w-7 h-7 ${isInEatlist ? 'fill-orange-500' : ''}`} />
                   <span className="text-[8px] font-black uppercase">List</span>
                 </button>
               </div>
             </div>

             {/* Menu / Info Section */}
              {restaurant.menuItems && restaurant.menuItems.length > 0 && (
                <section>
                  <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-4 px-2">Signature Flavors</h3>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.menuItems.map((item, i) => (
                      <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold text-white/80 flex items-center gap-2 group hover:border-[#00e054]/40 transition-colors">
                        <div className="w-1.5 h-1.5 bg-[#00e054] rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}

             {/* Reviews Section */}
             <section>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
                   <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">Experiences</h3>
                   <span className="text-[10px] font-mono text-white/20 uppercase">Sort: Newest First</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                       <p className="text-white/20 italic serif text-lg">No one has documented a stay here yet.</p>
                    </div>
                  )}
                </div>
             </section>
           </div>

           {/* Sidebar / Info */}
           <div className="hidden md:block space-y-8">
              <div className="bg-[#14181c] border border-white/10 rounded-3xl p-8 sticky top-24 shadow-2xl">
                 <h4 className="text-[10px] uppercase font-black tracking-widest text-[#00e054] mb-4">Location Access</h4>
                 <div className="aspect-square bg-zinc-800 rounded-2xl mb-6 flex items-center justify-center border border-white/5 relative group overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80`} 
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-20 group-hover:blur-0 group-hover:opacity-100 transition-all duration-700"
                    />
                    <Map className="text-white/20 group-hover:text-white transition-colors" size={40} />
                 </div>
                 {restaurant.lat && restaurant.lng && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white text-black text-center block py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#00e054] transition-all active:scale-95"
                    >
                      Open in Maps
                    </a>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Floating Action Mobile Pin (Only on mobile) */}
      <div className="md:hidden fixed bottom-24 left-6 right-6 z-[120] flex gap-3 pointer-events-none">
          <button 
            onClick={() => user ? setIsLogModalOpen(true) : login()}
            className="flex-1 bg-[#00e054] text-black font-black uppercase tracking-widest py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-all shadow-[#00e054]/20 border-b-4 border-[#00c044]"
          >
            <Edit3 size={18} />
            Write Review
          </button>
          
          {restaurant.lat && restaurant.lng && (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-800 text-white p-4 rounded-2xl flex items-center justify-center pointer-events-auto active:scale-95 border border-white/10 shadow-xl"
            >
              <Map size={20} />
            </a>
          )}
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
