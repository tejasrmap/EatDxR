import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, User, Restaurant } from "../types";
import { useAuth } from "../App";
import { Star, Loader2, MapPin, Calendar, Edit2, Grid, List as ListIcon, Clock, MessageSquare, Heart, Settings, Plus, Edit3, Share2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { DiaryTable } from "./DiaryTable";
import { FollowListModal } from "./FollowListModal";
import { EditProfileModal } from "./EditProfileModal";
import { DiaryEntryModal } from "./DiaryEntryModal";
import { StarRating } from "./StarRating";
import { RatingGraph } from "./RatingGraph";

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
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

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
    <div className="max-w-6xl mx-auto px-6 py-20 elite-motion-safe">
      {/* Letterboxd-Elite Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16 mb-20">
        <div className="relative group shrink-0">
          <div className="absolute -inset-4 bg-gradient-to-br from-orange-500/20 to-rose-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
            alt={user.displayName}
            className="w-48 h-48 rounded-full border-4 border-zinc-900 shadow-2xl object-cover cursor-pointer hover:scale-[1.02] transition-all duration-700 grayscale-[20%] hover:grayscale-0 relative z-10"
            referrerPolicy="no-referrer"
            loading="lazy"
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
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 rounded-full z-20">
              <Loader2 className="animate-spin text-white/40" />
            </div>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left">
          <div className="mb-4">
            {user.username && (
              <span className="small-caps text-accent/60 bg-accent/5 border border-accent/10 px-3 py-1 rounded-full">
                @{user.username}
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-baseline gap-6 mb-8">
            <div className="flex flex-wrap items-baseline gap-4 justify-center md:justify-start">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter leading-none">{user.displayName}</h1>
                {user.pronouns && (
                    <span className="small-caps text-[10px] text-white/20 tracking-normal font-serif italic">{user.pronouns}</span>
                )}
            </div>
            {currentUser?.uid !== user.uid && (
              <button
                onClick={toggleFollow}
                disabled={isUpdatingFollow}
                className={`px-8 py-2.5 rounded-full small-caps transition-all active:scale-95 ${isFollowing
                    ? "bg-zinc-900 text-white/40 border border-white/10 hover:text-white"
                    : "bg-white text-black hover:bg-zinc-200"
                  }`}
              >
                {isFollowing ? "Following" : "Follow Critic"}
              </button>
            )}
            {currentUser?.uid === user.uid && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2.5 rounded-full glass-panel border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all"
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center md:justify-start gap-12 md:gap-16 border-t border-white/5 pt-8 w-full">
            <div className="text-center md:text-left">
              <span className="text-3xl font-extrabold text-white italic tracking-tighter">{reviews.length}</span>
              <p className="small-caps text-[9px] text-white/20 mt-1">Logs recorded</p>
            </div>
            <div
              className="text-center md:text-left cursor-pointer group/stat"
              onClick={() => setFollowModalType("followers")}
            >
              <span className="text-3xl font-extrabold text-white group-hover/stat:text-accent transition-colors italic tracking-tighter">{followerCount}</span>
              <p className="small-caps text-[9px] text-white/20 group-hover/stat:text-white/40 transition-colors mt-1">Followers</p>
            </div>
            <div
              className="text-center md:text-left cursor-pointer group/stat"
              onClick={() => setFollowModalType("following")}
            >
              <span className="text-3xl font-extrabold text-white group-hover/stat:text-accent transition-colors italic tracking-tighter">
                {user.stats?.followingList?.length || user.stats?.following || 0}
              </span>
              <p className="small-caps text-[9px] text-white/20 group-hover/stat:text-white/40 transition-colors mt-1">Following</p>
            </div>
            <div className="text-center md:text-left">
              <span className="text-3xl font-extrabold text-white italic tracking-tighter">
                 {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                  : "0.0"}
              </span>
              <p className="small-caps text-[9px] text-white/20 mt-1">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center md:justify-start gap-10 md:gap-12 border-b border-white/5 mb-12">
        {[
          { id: "profile", label: "Overview", icon: Grid },
          { id: "diary", label: "Diary", icon: Clock },
          { id: "eatlist", label: "Eatlist", icon: Heart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-5 small-caps relative transition-all ${activeTab === tab.id ? "text-white" : "text-white/20 hover:text-white/40"}`}
          >
            <tab.icon size={12} className={activeTab === tab.id ? "text-accent" : "text-inherit"} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="profileTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-20 w-full"
          >
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="small-caps text-white/40">The Gastronomic Stream</h2>
                </div>
                <span className="small-caps text-[9px] text-white/10">{reviews.length} Experiences</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                {reviews.map((review, i) => {
                  const allImages = review.dishes?.filter(d => d.image).map(d => d.image) || [];
                  const firstImage = allImages[0];
                  return (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedReview(review)}
                      className="aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 group relative shadow-2xl hover:border-accent/40 transition-all duration-500 cursor-pointer hover:-translate-y-1"
                    >
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={review.restaurantName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out grayscale-[20%] group-hover:grayscale-0 shadow-inner"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                           <UtensilsCrossed size={20} className="text-white/5 mb-3" />
                           <span className="small-caps text-[9px] text-white/20">{review.restaurantName}</span>
                        </div>
                      )}

                      {allImages.length > 1 && (
                        <div className="absolute top-4 right-4 p-1.5 glass-panel border-white/10 rounded-lg z-10">
                          <Plus size={10} className="text-white/40" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-0 group-hover:opacity-100 flex flex-col items-center justify-end p-6 transition-all duration-500">
                        <StarRating rating={review.rating} size={12} className="flex items-center gap-0.5 text-accent mb-2" />
                        <p className="small-caps text-[9px] text-white tracking-widest truncate w-full text-center mb-3">{review.restaurantName}</p>
                        <div className="flex items-center gap-4 text-white/40">
                          <div className="flex items-center gap-1.5">
                            <Heart size={12} className={review.likes ? "fill-rose-500 text-rose-500" : ""} />
                            <span className="text-[10px] font-bold">{review.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare size={12} />
                            <span className="text-[10px] font-bold">4</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {reviews.length === 0 && (
                <div className="py-32 text-center glass-panel border-dashed border-white/10 p-12">
                  <p className="text-lg italic text-white/20 font-serif leading-relaxed">No culinary memories captured in this strip yet.</p>
                </div>
              )}
            </div>

            {/* Sidebar Section */}
            <div className="space-y-16">
              {/* BIO Section */}
              <section>
                <h3 className="small-caps text-white/20 mb-8 pb-4 border-b border-white/5">Biography</h3>
                {user.bio ? (
                   <p className="text-lg text-white/60 leading-relaxed font-serif italic">
                      "{user.bio}"
                   </p>
                ) : (
                   <p className="text-sm italic text-white/10 font-serif">A mysterious critic with no bio captured yet...</p>
                )}
              </section>

              {/* CUISINES Section */}
              <section>
                <h3 className="small-caps text-white/20 mb-8 pb-4 border-b border-white/5">Expertise</h3>
                <div className="flex flex-wrap gap-3">
                  {(user.favoriteCuisines && user.favoriteCuisines.length > 0) ? (
                     user.favoriteCuisines.map((cuisine, idx) => (
                      <span key={idx} className="small-caps text-[10px] text-white/40 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] hover:text-white hover:border-white/20 transition-all cursor-default">
                          {cuisine}
                      </span>
                     ))
                  ) : (
                     <span className="small-caps text-[10px] text-white/10">No curated cuisines added</span>
                  )}
                </div>
              </section>

              {/* STATS Section */}
              <section>
                <h3 className="small-caps text-white/20 mb-8 pb-4 border-b border-white/5">Analytics</h3>
                <div className="space-y-6">
                   <div className="flex justify-between items-end">
                      <span className="small-caps text-[10px] text-white/20 tracking-normal">Mean Rating</span>
                      <span className="text-2xl font-extrabold text-white italic tracking-tighter">
                          {reviews.length > 0 
                             ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                             : "0.0"}
                      </span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="small-caps text-[10px] text-white/20 tracking-normal">Primary Territory</span>
                      <span className="text-xl font-bold text-white/80 italic tracking-tight">
                          {(() => {
                             if (reviews.length === 0) return "N/A";
                             const cities = reviews.map(r => {
                               if (r.city) return r.city.trim();
                               const parts = r.restaurantLocation?.split(',') || [];
                               return parts[parts.length - 1]?.trim() || null;
                             }).filter(Boolean);
                             
                             if (cities.length === 0) return "Global";
                             const counts: Record<string, number> = {};
                             cities.forEach(c => {
                               if (c) counts[c] = (counts[c] || 0) + 1;
                             });
                             return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
                          })()}
                      </span>
                   </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {activeTab === "diary" && (
          <motion.div
            key="diary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 45 }}
            className="w-full flex flex-col pb-16"
          >
            <DiaryTable reviews={reviews} showUser={false} />
            {reviews.length > 0 && (
               <div className="mt-16 pt-8 border-t border-white/5 max-w-2xl mx-auto w-full px-4">
                  <div className="text-center mb-6">
                     <h3 className="text-xs md:text-sm uppercase tracking-[0.4em] font-black text-white/60">Ratings Distribution</h3>
                  </div>
                  <RatingGraph reviews={reviews} />
               </div>
            )}
          </motion.div>
        )}

        {activeTab === "eatlist" && (
          <motion.div
            key="eatlist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 45 }}
            className="w-full"
          >
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
                      <img loading="lazy" src={rest.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
          </motion.div>
        )}
      </AnimatePresence>

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

      <DiaryEntryModal 
        isOpen={selectedReview !== null}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
      />
    </div>
  );
};
