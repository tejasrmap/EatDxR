import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, User, Restaurant } from "../types";
import { ReviewCard } from "./ReviewCard";
import { useAuth } from "../App";
import { Star, Loader2, MapPin, Calendar, Edit2, Grid, List as ListIcon, Clock, MessageSquare, Heart, Settings, Plus } from "lucide-react";
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
  const [eatlistRestaurants, setEatlistRestaurants] = useState<Restaurant[]>([]);
  const [loadingEatlist, setLoadingEatlist] = useState(false);

  const isFollowing = dishdUser?.stats?.followingList?.includes(user?.uid || "");

  const toggleFollow = async () => {
    if (!currentUser || !user) {
      toast.error("Please log in to follow users");
      return;
    }
    
    setIsUpdatingFollow(true);
    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserRef = doc(db, "users", user.uid);
      const notifId = `${currentUser.uid}_${user.uid}_FOLLOW`;
      
      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, { "stats.followingList": arrayRemove(user.uid) });
        await updateDoc(currentUserRef, { "stats.following": increment(-1) });
        await updateDoc(targetUserRef, { "stats.followers": increment(-1) });
        await deleteDoc(doc(db, "notifications", notifId)).catch(() => {});
        toast.success(`Unfollowed ${user.displayName}`);
      } else {
        // Follow
        await updateDoc(currentUserRef, { "stats.followingList": arrayUnion(user.uid) });
        await updateDoc(currentUserRef, { "stats.following": increment(1) });
        await updateDoc(targetUserRef, { "stats.followers": increment(1) });
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
          
          unsubscribeFollowers = onSnapshot(followersQuery, async (snapshot) => {
            const count = snapshot.size;
            setFollowerCount(count);

            // Silent Sync: Correct the 'stats.followers' count if it's out of sync
            // This fixes legacy data issues (where count was 0) automatically when you visit the profile
            if (resolvedUser && resolvedUser.stats?.followers !== count) {
                await updateDoc(doc(db, "users", resolvedUser.uid), {
                    "stats.followers": count
                }).catch(e => console.warn("Silent sync failed:", e));
            }
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

  useEffect(() => {
    if (activeTab === "eatlist" && user?.eatlist && user.eatlist.length > 0) {
      setLoadingEatlist(true);
      const fetchEatlist = async () => {
        try {
          const restaurantDocs = await Promise.all(
            user.eatlist!.map(id => getDoc(doc(db, "restaurants", id)))
          );
          const restaurantData = restaurantDocs
            .filter(d => d.exists())
            .map(d => ({ ...d.data(), id: d.id })) as Restaurant[];
          setEatlistRestaurants(restaurantData);
        } catch (error) {
          console.error("Error fetching eatlist:", error);
        } finally {
          setLoadingEatlist(false);
        }
      };
      fetchEatlist();
    }
  }, [activeTab, user?.eatlist]);

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

          {/* Insta-Elite Bio & Stats (Shifted Above Content) */}
          <div className="mt-8 pt-6 border-t border-white/5 space-y-4 text-center md:text-left">
            {user.bio ? (
               <p className="text-sm md:text-base text-white/80 leading-relaxed font-serif italic max-w-2xl mx-auto md:mx-0">
                  "{user.bio}"
               </p>
            ) : (
               <p className="text-sm text-white/20 italic">No bio written yet.</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                   <Star size={12} className="text-orange-500 fill-orange-500" />
                   <span className="text-[10px] uppercase font-black tracking-widest text-white/60">
                      Average: {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)}
                   </span>
                </div>
                {user.favoriteCuisines?.map((cuisine, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-zinc-800 border border-white/5 rounded-full text-[10px] uppercase tracking-widest font-black text-white/40">
                    {cuisine}
                  </span>
                ))}
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
        <div className="w-full">
          <div className="flex items-center justify-between mb-8 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
               <Grid size={14} className="text-orange-500" />
               <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-white">Memories</h2>
            </div>
            <span className="text-[10px] font-bold text-white/20">{reviews.length} Posts</span>
          </div>
          
          <div className="grid grid-cols-3 gap-1 md:gap-4 lg:gap-6 mb-12">
            {reviews.map(review => {
              const allImages = review.dishes?.filter(d => d.image).map(d => d.image) || [];
              const firstImage = allImages[0];
              return (
                <div 
                  key={review.id} 
                  onClick={() => {
                    setActiveTab("diary");
                    setTimeout(() => {
                        const el = document.getElementById(`review-${review.id}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('ring-2', 'ring-orange-500', 'ring-offset-4', 'ring-offset-black');
                            setTimeout(() => el.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-4', 'ring-offset-black'), 2000);
                        }
                    }, 50);
                  }}
                  className="aspect-square bg-zinc-800 rounded-sm md:rounded-xl overflow-hidden border border-white/5 group relative shadow-2xl hover:border-orange-500/50 transition-all cursor-pointer"
                >
                  {firstImage ? (
                    <img 
                      src={firstImage} 
                      alt={review.restaurantName} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest text-center px-2 italic">
                      {review.restaurantName}
                    </div>
                  )}

                  {/* Multi-photo indicator (top right) */}
                  {allImages.length > 1 && (
                    <div className="absolute top-2 right-2 p-1 bg-black/40 backdrop-blur-md rounded-md z-10">
                       <Plus size={10} className="text-white" />
                    </div>
                  )}

                  {/* Frosted Insta-Overlay */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 transition-all duration-300 transform group-hover:scale-100 scale-110">
                    <div className="flex items-center gap-0.5 text-orange-500 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "fill-orange-500" : "text-white/20"} />
                      ))}
                    </div>
                    <p className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest truncate w-full text-center px-2">{review.restaurantName}</p>
                    <div className="mt-2 flex items-center gap-3 text-white/60">
                        <div className="flex items-center gap-1">
                            <Heart size={10} fill="currentColor" className="text-rose-500" />
                            <span className="text-[10px] font-bold">{review.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageSquare size={10} fill="currentColor" />
                            <span className="text-[10px] font-bold">0</span>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {reviews.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                  <p className="text-sm italic text-white/20 serif">No memories captured yet.</p>
              </div>
          )}
        </div>
      )}

      {activeTab === "diary" && (
        <div className="w-full">
          <DiaryTable reviews={reviews} showUser={false} />
        </div>
      )}

      {activeTab === "eatlist" && (
        <div className="w-full">
          {loadingEatlist ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/20 mb-4" />
              <p className="text-xs uppercase tracking-widest font-bold text-white/20">Loading Eatlist...</p>
            </div>
          ) : eatlistRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eatlistRestaurants.map(rest => (
                <Link 
                  key={rest.id} 
                  to={`/restaurant/${rest.id}`}
                  className="group bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all p-4 flex gap-4"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img src={rest.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors truncate">{rest.name}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{rest.cuisine}</p>
                    <p className="text-[10px] text-white/20 mt-1 truncate">{rest.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="w-full text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/40 italic serif">Your Eatlist (Watchlist) is currently empty.</p>
              <Link to="/restaurants" className="inline-block mt-4 text-[10px] uppercase tracking-widest font-bold text-orange-500 hover:text-orange-400">Explore Restaurants</Link>
            </div>
          )}
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
