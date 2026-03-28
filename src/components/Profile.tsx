import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Review, User } from "../types";
import { ReviewCard } from "./ReviewCard";
import { useAuth } from "../App";
import { Star, Loader2, MapPin, Calendar, Edit2, Grid, List as ListIcon, Clock, MessageSquare, Heart, Settings } from "lucide-react";
import { toast } from "sonner";
import { DiaryTable } from "./DiaryTable";
import { FollowListModal } from "./FollowListModal";
import { EditProfileModal } from "./EditProfileModal";

export const Profile: React.FC = () => {
  const { userId: identifier } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, dishdUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "diary" | "eatlist">("profile");
  const [followerCount, setFollowerCount] = useState(0);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following" | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isFollowing = dishdUser?.stats?.followingList?.includes(user?.uid || "");

  const toggleFollow = async () => {
    if (!currentUser || !user) {
      toast.error("Please log in to follow users");
      return;
    }
    
    setIsUpdatingFollow(true);
    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const notifId = `${currentUser.uid}_${user.uid}_FOLLOW`;
      
      if (isFollowing) {
        await updateDoc(currentUserRef, { "stats.followingList": arrayRemove(user.uid) });
        await deleteDoc(doc(db, "notifications", notifId)).catch(() => {});
        toast.success(`Unfollowed ${user.displayName}`);
      } else {
        await updateDoc(currentUserRef, { "stats.followingList": arrayUnion(user.uid) });
        await setDoc(doc(db, "notifications", notifId), {
          id: notifId,
          recipientId: user.uid,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          actorPhoto: currentUser.photoURL,
          type: "FOLLOW",
          read: false,
          createdAt: serverTimestamp()
        });
        toast.success(`Following ${user.displayName}`);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const handleAction = (action: string) => {
    toast.info(`${action} feature coming soon!`);
  };

  useEffect(() => {
    if (!identifier) return;

    // Aggressively flush all old user state when the URL changes so we don't leak User A's data into User B's screen while fetching
    setLoading(true);
    setUser(null);
    setReviews([]);
    setFollowerCount(0);

    let unsubscribeReviews: any;
    let unsubscribeFollowers: any;

    const resolveProfile = async () => {
      try {
        let resolvedUser: User | null = null;

        // 1. Try treating identifier as a username natively
        const usernameQuery = query(collection(db, "users"), where("username", "==", identifier.toLowerCase()));
        const snap = await getDocs(usernameQuery);
        
        if (!snap.empty) {
          resolvedUser = snap.docs[0].data() as User;
        } else {
          // 2. Fallback to raw Firebase ID lookup
          const docSnap = await getDoc(doc(db, "users", identifier));
          if (docSnap.exists()) {
            resolvedUser = docSnap.data() as User;
            // 3. The "Snap-Route"
            if (resolvedUser.username) {
              navigate(`/profile/${resolvedUser.username}`, { replace: true });
              return;
            }
          }
        }

        if (resolvedUser) {
          setUser(resolvedUser);

          // Now that we have the TRUE uid, attach the streams
          const q = query(
            collection(db, "reviews"),
            where("userId", "==", resolvedUser.uid),
            orderBy("createdAt", "desc")
          );

          unsubscribeReviews = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
              createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            })) as Review[];
            setReviews(reviewsData);
            setLoading(false);
          });

          const followersQuery = query(
            collection(db, "users"),
            where("stats.followingList", "array-contains", resolvedUser.uid)
          );
          
          unsubscribeFollowers = onSnapshot(followersQuery, (snapshot) => {
            setFollowerCount(snapshot.size);
          });
        } else {
          setLoading(false); // User not found
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setLoading(false);
      }
    };

    resolveProfile();

    return () => {
      if (unsubscribeReviews) unsubscribeReviews();
      if (unsubscribeFollowers) unsubscribeFollowers();
    };
  }, [identifier, navigate]);

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
              onClick={() => setIsEditModalOpen(true)}
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer flex-col gap-1"
            >
              <Edit2 size={16} className="text-white" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-white">Edit</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">{user.displayName}</h1>
            {user.pronouns && (
              <span className="text-sm font-medium text-white/40 italic mb-1.5">{user.pronouns}</span>
            )}
            {currentUser?.uid !== user.uid && (
              <button 
                onClick={toggleFollow}
                disabled={isUpdatingFollow}
                className={`px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors md:ml-4 ${
                  isFollowing 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {user.username && (
            <p className="text-orange-500 font-bold mb-4 tracking-wide text-center md:text-left">@{user.username}</p>
          )}
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
            <div 
              className="text-center md:text-left border-r border-white/10 pr-8 last:border-0 cursor-pointer group"
              onClick={() => setFollowModalType("following")}
            >
              <p className="text-2xl font-bold text-white group-hover:text-orange-500 transition-colors">
                {user.stats?.followingList?.length || user.stats?.following || 0}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold group-hover:text-orange-500/50 transition-colors">Following</p>
            </div>
            <div 
              className="text-center md:text-left cursor-pointer group"
              onClick={() => setFollowModalType("followers")}
            >
              <p className="text-2xl font-bold text-white group-hover:text-orange-500 transition-colors">{followerCount}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold group-hover:text-orange-500/50 transition-colors">Followers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-white/10 mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button 
          onClick={() => setActiveTab("profile")}
          className={`pb-4 text-[10px] uppercase tracking-widest font-bold transition-colors ${activeTab === "profile" ? "text-white border-b-2 border-orange-500" : "text-white/40 hover:text-white"}`}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab("diary")}
          className={`pb-4 text-[10px] uppercase tracking-widest font-bold transition-colors ${activeTab === "diary" ? "text-white border-b-2 border-orange-500" : "text-white/40 hover:text-white"}`}
        >
          Diary
        </button>
        <button 
          onClick={() => setActiveTab("eatlist")}
          className={`pb-4 text-[10px] uppercase tracking-widest font-bold transition-colors ${activeTab === "eatlist" ? "text-white border-b-2 border-orange-500" : "text-white/40 hover:text-white"}`}
        >
          Eatlist
        </button>
      </div>

      {activeTab === "profile" && (
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
              {user.bio ? `"${user.bio}"` : "This user hasn't written a bio yet."}
            </p>
          </div>

          <div>
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4 pb-2 border-b border-white/10">Favorite Cuisines</h2>
            {user.favoriteCuisines && user.favoriteCuisines.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.favoriteCuisines.map((cuisine, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold text-white/60">
                    {cuisine}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 italic">No favorite cuisines tagged.</p>
            )}
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
      )}

      {activeTab === "diary" && (
        <div className="w-full">
          <DiaryTable reviews={reviews} showUser={false} />
        </div>
      )}

      {activeTab === "eatlist" && (
        <div className="w-full text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <p className="text-white/40 italic serif">The Eatlist (Watchlist) is currently empty.</p>
        </div>
      )}
      
      <FollowListModal 
        isOpen={followModalType !== null}
        onClose={() => setFollowModalType(null)}
        type={followModalType || "followers"}
        userId={user.uid}
        followingListIds={user.stats?.followingList || []}
      />

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
      />
    </div>
  );
};
