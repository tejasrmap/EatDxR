import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Review, Restaurant as RestaurantType } from "../types";
import { ReviewCard } from "./ReviewCard";
import { Star } from "lucide-react";

export const Restaurant: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

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
      where("restaurantId", "==", restaurantId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
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
        <h1 className="text-2xl serif italic">Restaurant not found</h1>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <div className="w-32 h-32 rounded-3xl overflow-hidden border border-white/20">
          <img 
            src={restaurant.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80`} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-bold serif italic mb-2">{restaurant.name}</h1>
          <p className="text-white/60 small-caps tracking-widest mb-4">{restaurant.cuisine} • {restaurant.location}</p>
          <div className="flex gap-8 justify-center md:justify-start">
            <div>
              <p className="text-2xl font-bold flex items-center gap-1">
                {averageRating} <Star className="w-4 h-4 fill-white" />
              </p>
              <p className="text-xs text-white/40 uppercase tracking-tighter">Average Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{reviews.length}</p>
              <p className="text-xs text-white/40 uppercase tracking-tighter">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="horizontal-line mb-12" />

      {restaurant.menuItems && restaurant.menuItems.length > 0 && (
        <div className="mb-16">
          <h2 className="small-caps mb-6">Signature Menu Items</h2>
          <div className="flex flex-wrap gap-3">
            {restaurant.menuItems.map((item, i) => (
              <div 
                key={i} 
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-white/40 italic">No reviews yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
