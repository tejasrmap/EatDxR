import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, User, Restaurant } from "../types";
import { useAuth } from "../App";
import { Star, Loader2, MapPin, Calendar, Edit2, Grid, List as ListIcon, Clock, MessageSquare, Heart, Settings, Plus, Edit3, Share2, UtensilsCrossed, Sparkles, ListOrdered, ShieldCheck, Award } from "lucide-react";
import { toast } from "sonner";
import { DiaryTable } from "./DiaryTable";
import { FollowListModal } from "./FollowListModal";
import { EditProfileModal } from "./EditProfileModal";
import { DiaryEntryModal } from "./DiaryEntryModal";
import { StarRating } from "./StarRating";
import { RatingGraph } from "./RatingGraph";
import { TasteDNAView } from "./TasteDNAView";
import { MOCK_LISTS } from "../data/mockData";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";

export const Profile: React.FC = () => {
  const { userId: identifier } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, dishdUser } = useAuth();
  const { getAppUrl } = useAppUrl();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "diary" | "eatlist" | "taste" | "lists">("profile");
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
          <div className="absolute -inset-4 bg-gradient-to-br from-orange-500/20 to-rose-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-full will-change-transform" />
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
            alt={user.displayName}
            className="w-40 h-40 md:w-48 md:h-48 rounded-full border border-border shadow-2xl object-cover cursor-pointer hover:scale-105 hover:border-muted-foreground transition-all duration-300 relative z-10"
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
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full z-20">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {user.username && (
              <span className="font-medium text-xs text-foreground/80 bg-muted/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-border">
                @{user.username}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3.5 py-1.5 rounded-full shadow-sm">
              <Award size={13} className="text-orange-400" />
              <span>{user.criticLevel || "Food Critic"}</span>
              <span className="text-white/40">• {user.credibilityScore || 94}/100 Credibility</span>
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-baseline gap-6 mb-8">
            <div className="flex flex-wrap items-baseline gap-4 justify-center md:justify-start">
                <h1 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-none">{user.displayName}</h1>
                {user.pronouns && (
                    <span className="font-medium text-[11px] text-muted-foreground border border-border px-2.5 py-1 rounded-full bg-muted/30">{user.pronouns}</span>
                )}
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser?.uid !== user.uid ? (
                <button
                  onClick={toggleFollow}
                  disabled={isUpdatingFollow}
                  className={`px-8 py-2.5 font-medium text-sm rounded-full transition-all shadow-lg hover:scale-105 ${isFollowing
                      ? "bg-muted text-foreground border border-border"
                      : "bg-foreground text-background border border-foreground"
                    }`}
                >
                  {isFollowing ? "Following" : "Follow Critic"}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2.5 rounded-full glass-panel border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all"
                  title="Edit Profile"
                >
                  <Edit3 size={18} />
                </button>
              )}

              <Link
                to={getAppUrl('/wrapped')}
                onClick={() => triggerHaptic()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-orange-500 hover:text-black border border-white/15 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 touch-manipulation"
              >
                <Sparkles size={13} />
                <span>Year in Food</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-12 md:gap-16 border-t border-border pt-8 w-full">
            <div className="text-center md:text-left">
              <span className="text-4xl font-semibold text-foreground tracking-tight">{reviews.length}</span>
              <p className="font-medium tracking-wide text-[11px] text-muted-foreground mt-2">Logs recorded</p>
            </div>
            <div
              className="text-center md:text-left cursor-pointer group/stat"
              onClick={() => setFollowModalType("followers")}
            >
              <span className="text-4xl font-semibold text-foreground tracking-tight group-hover/stat:text-foreground/80 transition-colors">{followerCount}</span>
              <p className="font-medium tracking-wide text-[11px] text-muted-foreground group-hover/stat:text-foreground transition-colors mt-2">Followers</p>
            </div>
            <div
              className="text-center md:text-left cursor-pointer group/stat"
              onClick={() => setFollowModalType("following")}
            >
              <span className="text-4xl font-semibold text-foreground tracking-tight group-hover/stat:text-foreground/80 transition-colors">
                {user.stats?.followingList?.length || user.stats?.following || 0}
              </span>
              <p className="font-medium tracking-wide text-[11px] text-muted-foreground group-hover/stat:text-foreground transition-colors mt-2">Following</p>
            </div>
            <div className="text-center md:text-left">
              <span className="text-4xl font-semibold text-foreground tracking-tight">
                 {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                  : "0.0"}
              </span>
              <p className="font-medium tracking-wide text-[11px] text-muted-foreground mt-2">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center md:justify-start gap-8 md:gap-10 border-b border-border mb-12 overflow-x-auto scrollbar-hide">
        {[
          { id: "profile", label: "Overview", icon: Grid },
          { id: "diary", label: "Diary", icon: Clock },
          { id: "taste", label: "Taste DNA", icon: Sparkles },
          { id: "lists", label: "Lists", icon: ListOrdered },
          { id: "eatlist", label: "Want-to-Eat", icon: Heart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-5 font-medium text-sm tracking-wide relative whitespace-nowrap transition-all ${activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? "text-foreground" : "text-inherit"} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="profileTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
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
              <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-medium text-lg text-foreground/80">The Gastronomic Stream</h2>
                </div>
                <span className="font-medium text-xs text-muted-foreground bg-muted/30 border border-border rounded-full px-3 py-1">{reviews.length} Experiences</span>
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
                      className="aspect-[3/4] bg-muted/30 rounded-2xl overflow-hidden border border-border group relative shadow-lg hover:border-muted-foreground transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl"
                    >
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={review.restaurantName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-muted">
                           <UtensilsCrossed size={20} className="text-muted-foreground mb-3" />
                           <span className="font-medium text-xs text-muted-foreground">{review.restaurantName}</span>
                        </div>
                      )}

                      {allImages.length > 1 && (
                        <div className="absolute top-4 right-4 p-1.5 bg-background/50 backdrop-blur-md border border-border rounded-full z-10">
                          <Plus size={14} className="text-foreground" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent opacity-0 group-hover:opacity-100 flex flex-col items-center justify-end p-6 transition-all duration-500">
                        <StarRating rating={review.rating} size={14} className="flex items-center gap-0.5 text-foreground mb-2" />
                        <p className="font-medium text-sm text-foreground truncate w-full text-center mb-3">{review.restaurantName}</p>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Heart size={14} className={review.likes ? "fill-rose-500 text-rose-500" : ""} />
                            <span className="text-xs font-medium">{review.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare size={14} />
                            <span className="text-xs font-medium">4</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {reviews.length === 0 && (
                <div className="py-32 text-center bg-muted/30 border border-dashed border-border rounded-3xl p-12">
                  <p className="text-sm font-medium text-muted-foreground">Empty stream.</p>
                </div>
              )}
            </div>

            {/* Sidebar Section */}
            <div className="space-y-16">
              {/* BIO Section */}
              <section>
                <h3 className="font-medium uppercase tracking-wider text-[11px] text-muted-foreground mb-6 pb-4 border-b border-border">Biography</h3>
                {user.bio ? (
                   <p className="text-base text-foreground/80 leading-relaxed font-normal">
                      "{user.bio}"
                   </p>
                ) : (
                   <p className="text-sm text-muted-foreground font-normal">A mysterious critic with no bio captured yet...</p>
                )}
              </section>

              {/* CUISINES Section */}
              <section>
                <h3 className="font-medium uppercase tracking-wider text-[11px] text-muted-foreground mb-6 pb-4 border-b border-border">Expertise</h3>
                <div className="flex flex-wrap gap-3">
                  {(user.favoriteCuisines && user.favoriteCuisines.length > 0) ? (
                     user.favoriteCuisines.map((cuisine, idx) => (
                      <span key={idx} className="bg-muted/30 border border-border text-foreground rounded-full px-4 py-1.5 font-medium text-xs hover:bg-muted/50 transition-all cursor-default">
                          {cuisine}
                      </span>
                     ))
                  ) : (
                     <span className="text-[11px] font-medium text-muted-foreground">None added</span>
                  )}
                </div>
              </section>

              {/* STATS Section */}
              <section>
                <h3 className="font-medium uppercase tracking-wider text-[11px] text-muted-foreground mb-6 pb-4 border-b border-border">Analytics</h3>
                <div className="space-y-6">
                   <div className="flex justify-between items-end">
                      <span className="font-medium tracking-wide text-xs text-muted-foreground">Mean Rating</span>
                      <span className="text-2xl font-semibold text-foreground tracking-tight">
                          {reviews.length > 0 
                             ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                             : "0.0"}
                      </span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="font-medium tracking-wide text-xs text-muted-foreground">Primary Territory</span>
                      <span className="text-xl font-medium text-foreground/80 tracking-tight">
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
                     <h3 className="text-xs md:text-sm font-medium tracking-widest uppercase text-white/60">Ratings Distribution</h3>
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
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Loading Eatlist...</p>
              </div>
            ) : eatlistRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {eatlistRestaurants.map(rest => (
                  <Link
                    key={rest.id}
                    to={getAppUrl(`/restaurant/${rest.id}`)}
                    onClick={() => triggerHaptic()}
                    className="group bg-muted/30 border border-border rounded-2xl overflow-hidden hover:border-muted-foreground transition-all p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 active:scale-[0.98] touch-manipulation"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-border">
                      <img loading="lazy" decoding="async" src={rest.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-foreground/80 transition-colors truncate">{rest.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 sm:mt-1">{rest.cuisine}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 sm:mt-1 truncate">{rest.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="w-full text-center py-16 sm:py-20 border border-dashed border-border rounded-2xl">
                <p className="text-muted-foreground italic serif text-xs sm:text-sm">Your Eatlist (Watchlist) is currently empty.</p>
                <Link to={getAppUrl("/restaurants")} onClick={() => triggerHaptic()} className="inline-block mt-4 text-[10px] uppercase tracking-widest font-bold text-orange-500 hover:text-orange-400">Explore Restaurants</Link>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "taste" && (
          <motion.div
            key="taste"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 45 }}
            className="w-full"
          >
            <TasteDNAView user={user} />
          </motion.div>
        )}

        {activeTab === "lists" && (
          <motion.div
            key="lists"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 45 }}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-border">
              <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Curated Food Collections</h3>
              <Link to={getAppUrl("/lists")} onClick={() => triggerHaptic()} className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider">Explore Community Lists →</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {MOCK_LISTS.slice(0, 2).map((list) => (
                <Link
                  key={list.id}
                  to={getAppUrl(`/list/${list.id}`)}
                  onClick={() => triggerHaptic()}
                  className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-muted/30 border border-border hover:border-muted-foreground transition-all flex flex-col justify-between group active:scale-[0.98] touch-manipulation"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Curated List</span>
                    <h4 className="text-base font-bold text-foreground group-hover:text-orange-400 transition-colors">{list.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 font-serif italic">"{list.description}"</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>{list.items?.length || 4} Entries</span>
                    <span className="text-foreground font-bold group-hover:text-orange-400">View →</span>
                  </div>
                </Link>
              ))}
            </div>
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
