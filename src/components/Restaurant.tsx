import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, Restaurant as RestaurantType } from "../types";
import { ReviewCard } from "./ReviewCard";
import { Star, Bookmark, Heart, Edit3, Map } from "lucide-react";
import { useAuth } from "../App";
import { toast } from "sonner";
import { LogMealModal } from "./LogMealModal";

export const Restaurant: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { user, dishdUser, login } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingEatlist, setIsUpdatingEatlist] = useState(false);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
 
  const isInEatlist = dishdUser?.eatlist?.includes(restaurantId || "");
  const hasLiked = dishdUser?.likes?.includes(restaurantId || "");

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

      // Update local restaurant state for immediate feedback
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

    // Fetch restaurant details
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

    // Fetch restaurant reviews
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <div className="w-32 h-32 rounded-3xl overflow-hidden border border-white/20 shrink-0">
          <img 
            src={restaurant.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80`} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl font-bold serif italic mb-2 text-white">{restaurant.name}</h1>
          <p className="text-white/60 small-caps tracking-widest mb-6">{restaurant.cuisine} • {restaurant.location}</p>
          
          <div className="flex flex-wrap gap-8 justify-center md:justify-start items-center">
            <div>
              <p className="text-2xl font-bold flex items-center gap-1 text-white">
                {averageRating} <Star className="w-4 h-4 fill-white" />
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Avg Rating</p>
            </div>
            
            <div className="w-px h-8 bg-white/10" />
            
            <div>
              <p className="text-2xl font-bold text-white">{reviews.length}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Reviews</p>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div className="flex gap-6">
              <button 
                onClick={toggleEatlist}
                disabled={isUpdatingEatlist}
                className={`flex flex-col items-center gap-1 transition-all hover:-translate-y-1 ${isInEatlist ? 'text-orange-500' : 'text-white/40 hover:text-white'}`}
              >
                <Bookmark className={`w-6 h-6 ${isInEatlist ? 'fill-orange-500 text-orange-500' : ''}`} />
                <span className="text-[9px] uppercase tracking-widest font-bold">Eatlist</span>
              </button>

              <button 
                onClick={toggleLike}
                disabled={isUpdatingLike}
                className={`flex flex-col items-center gap-1 transition-all hover:-translate-y-1 ${hasLiked ? 'text-rose-500' : 'text-white/40 hover:text-white'}`}
              >
                <Heart className={`w-6 h-6 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="text-[9px] uppercase tracking-widest font-bold">{restaurant.likesCount || 0} Likes</span>
              </button>
            </div>
          </div>
        </div>

        <div className="md:ml-auto shrink-0 self-center flex flex-col gap-3">
          <button 
            onClick={() => {
              if (!user) {
                login();
              } else {
                setIsLogModalOpen(true);
              }
            }}
            className="bg-[#00e054] hover:bg-[#00c044] text-black text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#00e054]/10 hover:-translate-y-1 flex items-center gap-3"
          >
            <Edit3 size={18} />
            Write a Review
          </button>
          
          {restaurant.lat && restaurant.lng && (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}+${restaurant.lat},${restaurant.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[9px] font-bold uppercase tracking-[0.2em] px-8 py-3 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <Map size={14} className="text-[#00e054]" />
              Open in Maps
            </a>
          )}
        </div>
      </div>

      <div className="h-px bg-white/5 w-full mb-12" />

      {restaurant.menuItems && restaurant.menuItems.length > 0 && (
        <div className="mb-16">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 mb-6">Signature Menu Items</h2>
          <div className="flex flex-wrap gap-3">
            {restaurant.menuItems.map((item, i) => (
              <div 
                key={i} 
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="col-span-full h-64 flex flex-col items-center justify-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
            <p className="text-white/20 italic serif text-xl">No reviews yet.</p>
            <p className="text-white/10 text-[10px] uppercase tracking-widest mt-2">Be the first to share your experience!</p>
          </div>
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
