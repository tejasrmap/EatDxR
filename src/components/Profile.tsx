import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Review, User } from "../types";
import { ReviewCard } from "./ReviewCard";
import { useAuth } from "../App";
import { Star, Loader2, MapPin, Calendar, Edit2, Grid, List as ListIcon, Clock, MessageSquare, Heart, Settings } from "lucide-react";
import { toast } from "sonner";

export const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const handleAction = (action: string) => {
    toast.info(`${action} feature coming soon!`);
  };

  useEffect(() => {
    if (!userId) return;

    // Fetch user profile
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();

    // Fetch user reviews
    const q = query(
      collection(db, "reviews"),
      where("userId", "==", userId),
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
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl serif italic">User not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">
        <div className="relative group">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
            alt={user.displayName}
            className="w-32 h-32 rounded-full border-4 border-zinc-900 shadow-2xl object-cover"
            referrerPolicy="no-referrer"
          />
          {currentUser?.uid === user.uid && (
            <div 
              onClick={() => handleAction("Edit Profile")}
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
            >
              <span className="text-[10px] uppercase tracking-widest font-bold">Edit</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">{user.displayName}</h1>
            {currentUser?.uid !== user.uid && (
              <button 
                onClick={() => handleAction("Follow")}
                className="nav-pill px-6 py-1.5 bg-white text-black border-none hover:bg-white/90 text-xs font-bold uppercase tracking-widest"
              >
                Follow
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4">
            <div className="text-center md:text-left border-r border-white/10 pr-8 last:border-0">
              <p className="text-2xl font-bold text-white">{reviews.length}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Meals</p>
            </div>
            <div className="text-center md:text-left border-r border-white/10 pr-8 last:border-0">
              <p className="text-2xl font-bold text-white">
                {reviews.filter(r => new Date(r.createdAt).getFullYear() === new Date().getFullYear()).length}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">This Year</p>
            </div>
            <div className="text-center md:text-left border-r border-white/10 pr-8 last:border-0">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Lists</p>
            </div>
            <div className="text-center md:text-left border-r border-white/10 pr-8 last:border-0">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Following</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Followers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-white/10 mb-8">
        <button 
          onClick={() => handleAction("Switch Tab")}
          className="pb-4 text-[10px] uppercase tracking-widest font-bold text-white border-b-2 border-orange-500"
        >
          Profile
        </button>
        <button 
          onClick={() => handleAction("Switch Tab")}
          className="pb-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
        >
          Activity
        </button>
        <button 
          onClick={() => handleAction("Switch Tab")}
          className="pb-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
        >
          Meals
        </button>
        <button 
          onClick={() => handleAction("Switch Tab")}
          className="pb-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
        >
          Diary
        </button>
        <button 
          onClick={() => handleAction("Switch Tab")}
          className="pb-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
        >
          Reviews
        </button>
        <button 
          onClick={() => handleAction("Switch Tab")}
          className="pb-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
        >
          Lists
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Recent Activity Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Recent Activity</h2>
            <button 
              onClick={() => handleAction("View All Activity")}
              className="text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors"
            >
              All
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {reviews.slice(0, 8).map(review => {
              const dishesWithImages = review.dishes?.filter(d => d.image) || [];
              const firstImage = dishesWithImages[0]?.image;
              return (
                <Link 
                  key={review.id} 
                  to={`/restaurant/${review.restaurantId}`}
                  className="aspect-[2/3] bg-zinc-800 rounded-sm overflow-hidden border border-white/10 group relative shadow-lg"
                >
                  {firstImage ? (
                    <img 
                      src={firstImage} 
                      alt={review.restaurantName} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 uppercase tracking-widest text-center px-2">
                      {review.restaurantName}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 transition-opacity text-center">
                    <div className="flex items-center gap-0.5 text-orange-500 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "fill-orange-500" : "text-white/20"} />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-white uppercase tracking-tighter line-clamp-2">{review.dishes?.[0]?.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Recent Reviews</h2>
            <button className="text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors">All</button>
          </div>
          
          <div className="space-y-2">
            {reviews.slice(0, 3).map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>

        {/* Right Column: Bio & Stats */}
        <div className="space-y-12">
          <div>
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4 pb-2 border-b border-white/10">Bio</h2>
            <p className="text-sm text-white/60 leading-relaxed font-serif italic">
              "Passionate about discovering hidden gems and local flavors. Always on the hunt for the perfect meal."
            </p>
          </div>

          <div>
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4 pb-2 border-b border-white/10">Favorite Cuisines</h2>
            <div className="flex flex-wrap gap-2">
              {["Italian", "Japanese", "Indian", "Thai"].map(cuisine => (
                <span key={cuisine} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold text-white/60">
                  {cuisine}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4 pb-2 border-b border-white/10">Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Average Rating</span>
                <span className="text-xs font-bold text-white">
                  {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Most Visited City</span>
                <span className="text-xs font-bold text-white">Mumbai</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
