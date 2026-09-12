import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Review, User, Restaurant } from "../types";
import { useAuth } from "../App";
import { Star, Loader2, MapPin, Calendar, Edit2, Grid, List as ListIcon, Clock, MessageSquare, Heart, Settings, Plus, Edit3, Share2, UtensilsCrossed, Sparkles, ListOrdered, ShieldCheck, Award, Layers, Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DiaryTable } from "./DiaryTable";
import { FollowListModal } from "./FollowListModal";
import { EditProfileModal } from "./EditProfileModal";
import { DiaryEntryModal } from "./DiaryEntryModal";
import { StarRating } from "./StarRating";
import { RatingGraph } from "./RatingGraph";
import { TasteDNAView } from "./TasteDNAView";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic, isNative } from "../services/nativeService";
import { uploadMedia, upsertProfile } from "../services/supabaseService";

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
      // 1. Upload to Supabase Storage bucket 'profiles'
      const filePath = `profiles/${user.uid}_${Date.now()}.jpg`;
      const supabaseUrl = await uploadMedia(file, 'profiles', filePath);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const finalUrl = supabaseUrl || (reader.result as string);
          // Optimistically update local state for instant feedback
          setUser(prev => prev ? ({ ...prev, photoURL: finalUrl }) : null);

          await updateDoc(doc(db, "users", user.uid), { photoURL: finalUrl });
          if (user) {
            upsertProfile({ ...user, photoURL: finalUrl });
          }
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

  const shareProfile = async () => {
    triggerHaptic();
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.displayName || "Critic"} on Madeater`,
          text: `Check out ${user?.displayName || "Critic"}'s gastronomic profile on Madeater!`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback
      }
    }
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
              const isAppRoute = isNative && window.location.pathname.startsWith('/app');
              const targetPath = isAppRoute ? `/app/profile/${resolvedUser.username}` : `/profile/${resolvedUser.username}`;
              navigate(targetPath, { replace: true });
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

  const primaryCity = (() => {
    if (reviews.length === 0) return user.location || user.city || null;
    const cities = reviews.map(r => {
      if (r.city) return r.city.trim();
      const parts = r.restaurantLocation?.split(',') || [];
      return parts[parts.length - 1]?.trim() || null;
    }).filter(Boolean);
    if (cities.length === 0) return user.location || user.city || null;
    const counts: Record<string, number> = {};
    cities.forEach(c => {
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  })();

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 pt-2 sm:pt-4 pb-28 elite-motion-safe">
      {/* 1. Instagram Profile Header Row (Avatar + 4 Stats) */}
      <div className="flex items-center gap-4 sm:gap-7 mb-3">
        {/* Left: Avatar with Instagram gradient ring */}
        <div className="relative shrink-0 select-none">
          <div className="p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full shadow-lg">
            <div className="p-0.5 bg-black rounded-full">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                alt={user.displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
                loading="lazy"
                onClick={() => currentUser?.uid === user.uid && profileFileInputRef.current?.click()}
              />
            </div>
          </div>
          <input
            type="file"
            ref={profileFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleProfilePicChange}
          />
          {currentUser?.uid === user.uid && (
            <button
              onClick={() => profileFileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-orange-500 text-black border-2 border-black flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
              title="Change avatar"
            >
              <Plus size={13} strokeWidth={3} />
            </button>
          )}
          {isUpdatingPhoto && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-full z-20">
              <Loader2 className="animate-spin text-orange-400 w-6 h-6" />
            </div>
          )}
        </div>

        {/* Right: Instagram 4-Column Stats */}
        <div className="flex-1 grid grid-cols-4 gap-1 text-center py-1 select-none">
          <div 
            onClick={() => { triggerHaptic(); setActiveTab("profile"); }} 
            className="cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-base sm:text-lg font-black text-white tracking-tight block leading-tight">
              {reviews.length}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium tracking-tight block mt-0.5">
              Logs
            </span>
          </div>

          <div 
            onClick={() => { triggerHaptic(); setFollowModalType("followers"); }} 
            className="cursor-pointer active:scale-95 transition-transform group/stat"
          >
            <span className="text-base sm:text-lg font-black text-white group-hover/stat:text-orange-400 tracking-tight block leading-tight transition-colors">
              {followerCount}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium tracking-tight block mt-0.5">
              Followers
            </span>
          </div>

          <div 
            onClick={() => { triggerHaptic(); setFollowModalType("following"); }} 
            className="cursor-pointer active:scale-95 transition-transform group/stat"
          >
            <span className="text-base sm:text-lg font-black text-white group-hover/stat:text-orange-400 tracking-tight block leading-tight transition-colors">
              {user.stats?.followingList?.length || user.stats?.following || 0}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium tracking-tight block mt-0.5">
              Following
            </span>
          </div>

          <div className="active:scale-95 transition-transform">
            <span className="text-base sm:text-lg font-black text-orange-400 tracking-tight block leading-tight">
              {reviews.length > 0 
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                : "0.0"}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium tracking-tight block mt-0.5">
              Avg Rating
            </span>
          </div>
        </div>
      </div>

      {/* 2. Identity & Bio Section */}
      <div className="space-y-1.5 mb-3 text-left">
        {/* Full Name & Verification */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
            {user.displayName}
          </h1>
          {currentUser?.uid === user.uid && currentUser.emailVerified ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold" title="Email Verified">
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>Verified</span>
            </span>
          ) : (
            <ShieldCheck size={14} className="text-orange-400 fill-orange-400/20 shrink-0" />
          )}
          {user.pronouns && (
            <span className="text-[11px] text-zinc-500 font-normal">({user.pronouns})</span>
          )}
        </div>

        {/* Critic Credibility Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider text-orange-400">
          <Award size={11} className="text-orange-400" />
          <span>{user.criticLevel || "Food Critic"}</span>
          <span className="text-white/40">•</span>
          <span className="text-white/90">{user.credibilityScore || 94}/100 Credibility</span>
        </div>

        {/* Bio */}
        {user.bio ? (
          <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed whitespace-pre-line pt-0.5">
            {user.bio}
          </p>
        ) : (
          <p className="text-xs text-zinc-500 font-normal italic pt-0.5">
            Culinary critic & taste explorer documenting noteworthy dishes 🍷
          </p>
        )}

        {/* Territory & Favorite Cuisines */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {primaryCity && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-300 bg-zinc-900 border border-white/10 px-2.5 py-0.5 rounded-full">
              <MapPin size={9} className="text-orange-400" />
              <span>{primaryCity}</span>
            </span>
          )}
          {user.favoriteCuisines && user.favoriteCuisines.length > 0 && (
            user.favoriteCuisines.map((cuisine, idx) => (
              <span key={idx} className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full">
                #{cuisine}
              </span>
            ))
          )}
        </div>
      </div>

      {/* 3. Instagram Action Buttons Row */}
      <div className="flex items-center gap-2 mb-3.5">
        {currentUser?.uid === user.uid ? (
          <>
            <button
              onClick={() => { triggerHaptic(); setIsEditModalOpen(true); }}
              className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/15 rounded-lg text-xs font-bold text-white text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={shareProfile}
              className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/15 rounded-lg text-xs font-bold text-white text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 size={13} />
              <span>Share Profile</span>
            </button>

            <Link
              to={getAppUrl('/wrapped')}
              onClick={() => triggerHaptic()}
              className="py-1.5 px-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 border border-orange-500/30 rounded-lg text-xs font-black uppercase tracking-wider text-orange-400 flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-[0.98]"
            >
              <Sparkles size={13} />
              <span className="hidden xs:inline">My Food Year</span>
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={() => { triggerHaptic(); toggleFollow(); }}
              disabled={isUpdatingFollow}
              className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer ${
                isFollowing
                  ? "bg-zinc-900 text-white border border-white/15 hover:bg-zinc-800"
                  : "bg-gradient-to-r from-orange-500 to-amber-400 hover:brightness-110 text-black font-black shadow-md"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>

            <button
              onClick={shareProfile}
              className="py-1.5 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/15 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>
          </>
        )}
      </div>

      {/* 4. Instagram Story Highlights Tray */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2.5 mb-2 scrollbar-hide pt-0.5 select-none">
        {/* Taste DNA */}
        <button
          onClick={() => { triggerHaptic(); setActiveTab("taste"); }}
          className="flex flex-col items-center gap-1 shrink-0 group active:scale-95 transition-transform cursor-pointer"
        >
          <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] transition-all ${
            activeTab === "taste" 
              ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600" 
              : "bg-zinc-800 group-hover:bg-amber-500/50"
          }`}>
            <div className="w-full h-full rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-orange-400 group-hover:text-white transition-colors">
              <Sparkles size={19} />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white truncate max-w-[62px]">Taste DNA</span>
        </button>

        {/* Top Rated */}
        <button
          onClick={() => { triggerHaptic(); setActiveTab("profile"); }}
          className="flex flex-col items-center gap-1 shrink-0 group active:scale-95 transition-transform cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] bg-zinc-800 group-hover:bg-orange-500/50 transition-all">
            <div className="w-full h-full rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-orange-400">
              <Star size={19} />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white truncate max-w-[62px]">Top Rated</span>
        </button>

        {/* Radar Map */}
        <Link
          to={getAppUrl("/map")}
          onClick={() => triggerHaptic()}
          className="flex flex-col items-center gap-1 shrink-0 group active:scale-95 transition-transform cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] bg-zinc-800 group-hover:bg-emerald-500/50 transition-all">
            <div className="w-full h-full rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-emerald-400">
              <MapPin size={19} />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white truncate max-w-[62px]">Food Radar</span>
        </Link>

        {/* Food Lists */}
        <button
          onClick={() => { triggerHaptic(); setActiveTab("lists"); }}
          className="flex flex-col items-center gap-1 shrink-0 group active:scale-95 transition-transform cursor-pointer"
        >
          <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] transition-all ${
            activeTab === "lists" 
              ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600" 
              : "bg-zinc-800 group-hover:bg-blue-500/50"
          }`}>
            <div className="w-full h-full rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-blue-400">
              <ListOrdered size={19} />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white truncate max-w-[62px]">Food Lists</span>
        </button>

        {/* Want to Try / Cravings */}
        <button
          onClick={() => { triggerHaptic(); setActiveTab("eatlist"); }}
          className="flex flex-col items-center gap-1 shrink-0 group active:scale-95 transition-transform cursor-pointer"
        >
          <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] transition-all ${
            activeTab === "eatlist" 
              ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600" 
              : "bg-zinc-800 group-hover:bg-rose-500/50"
          }`}>
            <div className="w-full h-full rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-rose-400">
              <Heart size={19} className="fill-rose-400/20" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white truncate max-w-[62px]">Want to Try</span>
        </button>
      </div>

      {/* 5. Instagram Sticky Tab Bar */}
      <div className="sticky top-14 z-30 bg-black/95 backdrop-blur-xl border-t border-b border-white/10 -mx-3 sm:-mx-6 px-3 sm:px-6 mb-2.5 select-none">
        <div className="flex items-center justify-around">
          {[
            { id: "profile", label: "Food History", icon: Grid },
            { id: "diary", label: "Food Diary", icon: Clock },
            { id: "taste", label: "Taste DNA", icon: Sparkles },
            { id: "eatlist", label: "Want to Try", icon: Heart },
            { id: "lists", label: "Food Lists", icon: ListOrdered },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { triggerHaptic(); setActiveTab(tab.id as any); }}
                className={`flex-1 py-2.5 flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
                  isActive ? "text-orange-500 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
                title={tab.label}
              >
                <tab.icon size={19} className={isActive ? "stroke-[2.3]" : "stroke-[1.6]"} />
                {isActive && (
                  <motion.div
                    layoutId="instagramActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 dark:bg-white shadow-[0_0_8px_rgba(249,115,22,0.6)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Tab Contents */}
      <AnimatePresence mode="wait">
        {/* TAB 1: INSTAGRAM 3-COLUMN SQUARE PHOTO GRID */}
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {reviews.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                {reviews.map((review, i) => {
                  const allImages = review.dishes?.filter(d => d.image).map(d => d.image) || [];
                  const firstImage = allImages[0];
                  return (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      onClick={() => { triggerHaptic(); setSelectedReview(review); }}
                      className="aspect-square bg-zinc-900 relative group overflow-hidden cursor-pointer active:scale-[0.98] transition-transform select-none rounded-none sm:rounded-md"
                    >
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={review.restaurantName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-zinc-900">
                          <UtensilsCrossed size={18} className="text-zinc-600 mb-1" />
                          <span className="text-[10px] font-bold text-zinc-400 line-clamp-2 px-1 leading-tight">
                            {review.restaurantName}
                          </span>
                        </div>
                      )}

                      {/* Rating Badge in Corner */}
                      <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] font-black text-amber-400 flex items-center gap-0.5 shadow-sm">
                        <Star size={9} className="fill-amber-400 text-amber-400" />
                        <span>{review.rating.toFixed(1)}</span>
                      </div>

                      {/* Multiple Photos Indicator if > 1 */}
                      {allImages.length > 1 && (
                        <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 p-1 rounded-md bg-black/60 backdrop-blur-md text-white/80">
                          <Layers size={11} />
                        </div>
                      )}

                      {/* Hover / Tap overlay showing restaurant name & stats */}
                      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-opacity duration-200">
                        <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight mb-1.5">
                          {review.restaurantName}
                        </p>
                        <div className="flex items-center gap-3 text-white/90 text-[10px] font-bold">
                          <span className="flex items-center gap-1">
                            <Heart size={11} className="fill-white text-white" />
                            {review.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={11} className="fill-white text-white" />
                            4
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Instagram-Style Empty State */
              <div className="py-14 px-4 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 my-3">
                <div className="w-13 h-13 rounded-full border border-white/15 flex items-center justify-center text-zinc-400 mb-2.5 bg-zinc-900">
                  <Camera size={24} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">No Food Logs Yet</h3>
                <p className="text-xs text-zinc-400 max-w-xs mb-3.5">
                  When you critique dining experiences and snap dish photos, they will appear here on your profile grid.
                </p>
                <Link
                  to={getAppUrl("/app")}
                  onClick={() => triggerHaptic()}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
                >
                  Record Food Critique
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: DIARY TABLE & RATINGS DISTRIBUTION */}
        {activeTab === "diary" && (
          <motion.div
            key="diary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 45 }}
            className="w-full flex flex-col pb-8 pt-1"
          >
            <DiaryTable reviews={reviews} showUser={false} />
            {reviews.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10 max-w-2xl mx-auto w-full px-2">
                <div className="text-center mb-4">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-white/60">Ratings Distribution</h3>
                </div>
                <RatingGraph reviews={reviews} />
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: TASTE DNA */}
        {activeTab === "taste" && (
          <motion.div
            key="taste"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 45 }}
            className="w-full pt-1"
          >
            <TasteDNAView user={user} />
          </motion.div>
        )}

        {/* TAB 4: WANT-TO-EAT (EATLIST) */}
        {activeTab === "eatlist" && (
          <motion.div
            key="eatlist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 45 }}
            className="w-full pt-1"
          >
            {loadingEatlist ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400 mb-3" />
                <p className="text-xs uppercase tracking-widest font-bold text-zinc-400">Loading Want-to-Eat...</p>
              </div>
            ) : eatlistRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {eatlistRestaurants.map(rest => (
                  <Link
                    key={rest.id}
                    to={getAppUrl(`/restaurant/${rest.id}`)}
                    onClick={() => triggerHaptic()}
                    className="group bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all p-3 flex gap-3 active:scale-[0.98] touch-manipulation"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <img loading="lazy" decoding="async" src={rest.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors truncate">{rest.name}</h3>
                      <p className="text-[10px] uppercase tracking-wider text-orange-400/90 mt-0.5">{rest.cuisine}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{rest.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="w-full text-center py-14 border border-dashed border-zinc-800 rounded-2xl my-2">
                <Heart size={22} className="mx-auto text-zinc-600 mb-2" />
                <p className="text-zinc-400 text-xs sm:text-sm">Your Want-to-Eat list is currently empty.</p>
                <Link to={getAppUrl("/restaurants")} onClick={() => triggerHaptic()} className="inline-block mt-3 text-[10px] uppercase tracking-widest font-black text-orange-400 hover:text-orange-300">Explore Restaurants →</Link>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: CURATED LISTS */}
        {activeTab === "lists" && (
          <motion.div
            key="lists"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 45 }}
            className="w-full pt-1"
          >
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-white/10">
              <h3 className="font-bold uppercase tracking-wider text-xs text-zinc-400">Curated Food Collections</h3>
              <Link to={getAppUrl("/lists")} onClick={() => triggerHaptic()} className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider">Explore Community Lists →</Link>
            </div>
            
            <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
              <p className="text-xs text-zinc-400">No curated collections created yet.</p>
              <Link to={getAppUrl("/lists")} onClick={() => triggerHaptic()} className="text-xs text-orange-400 hover:text-orange-300 font-bold inline-block">
                Browse Community Lists →
              </Link>
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
