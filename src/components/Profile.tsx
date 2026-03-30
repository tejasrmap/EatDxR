import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, User, Restaurant } from "../types";
import { useAuth } from "../App";
import { Star, Loader2, MapPin, Calendar, Edit2, Grid, List as ListIcon, Clock, MessageSquare, Heart, Settings, Plus, Edit3, Share2 } from "lucide-react";
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
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

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
        await updateDoc(currentUserRef, { "stats.followingList": arrayRemove(user.uid) });
        await updateDoc(currentUserRef, { "stats.following": increment(-1) });
        await updateDoc(targetUserRef, { "stats.followers": increment(-1) });
        await deleteDoc(doc(db, "notifications", notifId)).catch(() => { });
        toast.success(`Unfollowed ${user.displayName}`);
      } else {
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

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUpdatingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          // Optimistically update local state for instant feedback
          setUser(prev => prev ? ({ ...prev, photoURL: base64String }) : null);

          await updateDoc(doc(db, "users", user.uid), { photoURL: base64String });
          toast.success("Profile photo updated!");
        } catch (err) {
          console.error("Firestore update error:", err);
          toast.error("Failed to save to database.");
        } finally {
          setIsUpdatingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to read image file.");
      setIsUpdatingPhoto(false);
    }
  };

  const shareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  useEffect(() => {
    if (!identifier) return;

    setLoading(true);
    setUser(null);
    setReviews([]);
    setFollowerCount(0);

    let unsubscribeReviews: any;
    let unsubscribeFollowers: any;

    const resolveProfile = async () => {
      try {
        let resolvedUser: User | null = null;
        const usernameQuery = query(collection(db, "users"), where("username", "==", identifier.toLowerCase()));
        const snap = await getDocs(usernameQuery);

        if (!snap.empty) {
          resolvedUser = snap.docs[0].data() as User;
        } else {
          const docSnap = await getDoc(doc(db, "users", identifier));
          if (docSnap.exists()) {
            resolvedUser = docSnap.data() as User;
            if (resolvedUser?.username) {
              navigate(`/profile/${resolvedUser.username}`, { replace: true });
              return;
            }
          }
        }

        if (resolvedUser) {
          setUser(resolvedUser);
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
            if (resolvedUser && resolvedUser.stats?.followers !== count) {
              await updateDoc(doc(db, "users", resolvedUser.uid), {
                "stats.followers": count
              }).catch(e => console.warn("Silent sync failed:", e));
            }
          });
        } else {
          setLoading(false);
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
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Letterboxd-Elite Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-12 mb-2 md:mb-4">
        <div className="relative group shrink-0">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
            alt={user.displayName}
            className="w-40 h-40 rounded-full border-4 border-zinc-900 shadow-2xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
            referrerPolicy="no-referrer"
            onClick={() => currentUser?.uid === user.uid && profileFileInputRef.current?.click()}
          />
          <input
            type="file"
            ref={profileFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleProfilePicChange}
          />
          {isUpdatingPhoto && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full z-20">
              <Loader2 className="animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left">
          <div className="mb-2">
            {user.username && (
              <span className="inline-block bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-black tracking-widest lowercase text-white/40 mb-2">
                @{user.username}
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-baseline gap-4 mb-4 md:mb-8">
            <div className="flex flex-wrap items-baseline gap-2 justify-center md:justify-start">
                <h1 className="text-xl md:text-2xl lg:text-4xl font-black text-white tracking-tighter font-serif leading-none">{user.displayName}</h1>
                {user.pronouns && (
                    <span className="text-[9px] font-bold text-white/40 italic uppercase tracking-[0.2em]">{user.pronouns}</span>
                )}
            </div>
            {currentUser?.uid !== user.uid && (
              <button
                onClick={toggleFollow}
                disabled={isUpdatingFollow}
                className={`px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors ${isFollowing
                    ? "bg-zinc-800 text-white/60 hover:text-white"
                    : "bg-white text-black hover:bg-zinc-100"
                  }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12 mb-2 border-b border-white/5 pb-4">
            <div className="text-center md:text-left">
              <span className="text-xl md:text-2xl font-black text-white pr-1 italic font-serif">{reviews.length}</span>
              <span className="block md:inline text-[7px] md:text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">posts</span>
            </div>
            <div
              className="text-center md:text-left cursor-pointer group"
              onClick={() => setFollowModalType("followers")}
            >
              <span className="text-xl md:text-2xl font-black text-white pr-1 group-hover:text-orange-500 transition-colors italic font-serif">{followerCount}</span>
              <span className="block md:inline text-[7px] md:text-[10px] text-white/20 group-hover:text-orange-500/60 transition-colors uppercase tracking-[0.2em] font-bold">followers</span>
            </div>
            <div
              className="text-center md:text-left cursor-pointer group"
              onClick={() => setFollowModalType("following")}
            >
              <span className="text-xl md:text-2xl font-black text-white pr-1 group-hover:text-orange-500 transition-colors italic font-serif">
                {user.stats?.followingList?.length || user.stats?.following || 0}
              </span>
              <span className="block md:inline text-[7px] md:text-[10px] text-white/20 group-hover:text-orange-500/60 transition-colors uppercase tracking-[0.2em] font-bold">following</span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-lg md:text-xl font-black text-white pr-1 italic font-serif">
                 {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                  : "0.0"}
              </span>
              <span className="block md:inline text-[7px] md:text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">rating</span>
            </div>
          </div>

          <div className="space-y-4 pb-6 md:pb-0">
             {user.bio && (
                <p className="lg:hidden text-lg text-white/80 leading-relaxed font-serif italic max-w-2xl text-center md:text-left mx-auto md:mx-0">
                   "{user.bio}"
                </p>
             )}

             {/* Letterboxd-Style Cuisines (Mobile Only) */}
             {user.favoriteCuisines && user.favoriteCuisines.length > 0 && (
                <div className="lg:hidden">
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {user.favoriteCuisines.map((cuisine, idx) => (
                            <span key={idx} className="px-3 py-1 bg-zinc-800 border border-white/5 rounded-md text-[8px] uppercase tracking-widest font-black text-white/60">
                                {cuisine}
                            </span>
                        ))}
                    </div>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center md:justify-start gap-6 md:gap-8 border-b border-white/10 mb-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 w-full">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Grid size={12} className="text-orange-500" />
                <h2 className="text-[9px] uppercase tracking-[0.4em] font-black text-white/20">The Film Strip</h2>
              </div>
              <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">{reviews.length} Logs</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6 mb-12">
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

                    {allImages.length > 1 && (
                      <div className="absolute top-2 right-2 p-1 bg-black/40 backdrop-blur-md rounded-md z-10">
                        <Plus size={10} className="text-white" />
                      </div>
                    )}

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

          {/* Sidebar Section (Desktop Elite) */}
          <div className="hidden lg:block space-y-12 pl-6 pt-2 border-l border-white/5">
            {/* BIO Section */}
            <div>
              <div className="border-b border-white/5 pb-4 mb-6">
                 <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">BIO</h3>
              </div>
              {user.bio ? (
                 <p className="text-base text-white/80 leading-relaxed font-serif italic">
                    "{user.bio}"
                 </p>
              ) : (
                 <p className="text-sm italic text-white/20 font-serif">No bio captured yet.</p>
              )}
            </div>

            {/* CUISINES Section */}
            <div>
              <div className="border-b border-white/5 pb-4 mb-6">
                 <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">FAVORITE CUISINES</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(user.favoriteCuisines && user.favoriteCuisines.length > 0) ? (
                   user.favoriteCuisines.map((cuisine, idx) => (
                    <span key={idx} className="px-4 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-black text-white/60">
                        {cuisine}
                    </span>
                   ))
                ) : (
                   <span className="text-[10px] uppercase tracking-widest font-black text-white/20">None added</span>
                )}
              </div>
            </div>

            {/* STATS Section */}
            <div>
              <div className="border-b border-white/5 pb-4 mb-6">
                 <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">STATS</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-white/40 font-medium">Average Rating</span>
                    <span className="text-base font-black text-white italic">
                        {reviews.length > 0 
                           ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                           : "0.0"}
                    </span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-white/40 font-medium">Most Visited City</span>
                    <span className="text-base font-black text-white italic">
                        {(() => {
                           if (reviews.length === 0) return "N/A";
                           const cities = reviews.map(r => {
                             if (r.city) return r.city.trim();
                             const parts = r.restaurantLocation?.split(',') || [];
                             return parts[parts.length - 1]?.trim() || null;
                           }).filter(Boolean);
                           
                           if (cities.length === 0) return "N/A";
                           const counts: Record<string, number> = {};
                           cities.forEach(c => {
                             if (c) counts[c] = (counts[c] || 0) + 1;
                           });
                           return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
                        })()}
                    </span>
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
