import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

import { Review, User, Restaurant } from "../types";
import { useAuth } from "../App";
import { Star, Loader2, MapPin, Calendar, Edit2, Grid, List as ListIcon, Clock, MessageSquare, Heart, Settings, Plus, Edit3, Share2, UtensilsCrossed, Sparkles, ListOrdered, ShieldCheck, Award, Layers, Camera, CheckCircle2, Lock, Menu, TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { FollowListModal } from "./FollowListModal";
import { EditProfileModal } from "./EditProfileModal";
import { DiaryEntryModal } from "./DiaryEntryModal";
import { SettingsOverlay } from "./SettingsOverlay";
import { CriticInsightsModal } from "./CriticInsightsModal";
import { StarRating } from "./StarRating";
import { RatingGraph } from "./RatingGraph";
import { TasteDNAView } from "./TasteDNAView";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic, isNative } from "../services/nativeService";
import { uploadMedia, upsertProfile, getProfile, getUserReviews, toggleFollow as toggleFollowUser, getRestaurantById } from "../services/supabaseService";
import { getShareUrl } from "../utils/shareUrl";

export const Profile: React.FC = () => {
  const { userId: identifier } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, dishdUser } = useAuth();
  const { getAppUrl } = useAppUrl();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "taste" | "eatlist" | "lists">("profile");
  const [followerCount, setFollowerCount] = useState(0);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following" | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
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
      const newFollowStatus = await toggleFollowUser(
        currentUser.uid,
        user.uid,
        !!isFollowing,
        {
          name: currentUser.displayName || undefined,
          photo: currentUser.photoURL || undefined
        }
      );

      // Local state update
      setFollowerCount(prev => newFollowStatus ? prev + 1 : Math.max(0, prev - 1));
      toast.success(newFollowStatus ? `Following ${user.displayName}` : `Unfollowed ${user.displayName}`);
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

          if (user) {
            await upsertProfile({ ...user, photoURL: finalUrl });
          }
          toast.success("Profile photo updated!");
        } catch (err) {
          console.error("Profile photo update error:", err);
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
    const profilePath = identifier 
      ? `/app/profile/${identifier}` 
      : user?.username 
      ? `/app/profile/${user.username}` 
      : user?.uid 
      ? `/app/profile/${user.uid}` 
      : window.location.pathname;
    const url = getShareUrl(profilePath);

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

    let isMounted = true;

    const resolveProfile = async () => {
      try {
        // 1. Primary: Resolve user profile directly from Supabase
        const resolvedUser: User | null = await getProfile(identifier);
        if (!isMounted) return;

        if (resolvedUser) {
          const cleanIdentifier = identifier?.replace(/^@+/, '') || '';
          if (resolvedUser.username && cleanIdentifier.toLowerCase() !== resolvedUser.username.toLowerCase()) {
            const isAppRoute = window.location.pathname.startsWith('/app');
            const targetPath = isAppRoute ? `/app/profile/${resolvedUser.username}` : `/profile/${resolvedUser.username}`;
            navigate(targetPath, { replace: true });
            return;
          }

          setUser(resolvedUser);
          setFollowerCount(resolvedUser.stats?.followers || 0);

          // 2. Fetch user reviews directly from Supabase
          const supaReviews = await getUserReviews(resolvedUser.uid);
          if (!isMounted) return;
          setReviews(supaReviews);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        if (isMounted) setLoading(false);
      }
    };

    resolveProfile();

    return () => {
      isMounted = false;
    };
  }, [identifier, navigate]);

  useEffect(() => {
    if (activeTab === "eatlist" && user?.eatlist && user.eatlist.length > 0) {
      setLoadingEatlist(true);
      const fetchEatlist = async () => {
        try {
          const results = await Promise.all(
            user.eatlist!.map(id => getRestaurantById(id))
          );
          const restaurantData = results.filter((r): r is Restaurant => r !== null);
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

    const isOwnProfile = currentUser?.uid === user.uid;
    const isRootProfileTab = location.pathname === "/app/profile" || location.pathname === "/profile";
    const showBackButton = (!isRootProfileTab || !isOwnProfile) && window.history.length > 1;

    return (
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:pt-4 pb-28 elite-motion-safe">
        {/* Instagram Single Profile Top Bar: Back (if deep/other user) + Username + Actions */}
        <div className="flex items-center justify-between py-2 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            {showBackButton && (
              <button
                type="button"
                onClick={() => { triggerHaptic(); navigate(-1); }}
                className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Go back"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
            @{user.username || user.displayName?.toLowerCase().replace(/\s+/g, '_') || "critic"}
          </h2>
          {localStorage.getItem("madeater_account_privacy") === "private" && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/10">
              <Lock size={10} /> Private
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Share Profile button */}
          <button
            onClick={shareProfile}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Share Profile"
          >
            <Share2 size={15} />
          </button>

          {/* 3-Lines Hamburger Bar (Settings and Activity) ONLY on Profile Page for Owner */}
          {currentUser?.uid === user.uid && (
            <button
              onClick={() => {
                triggerHaptic();
                setIsSettingsOpen(true);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer shadow-sm"
              title="Settings and activity"
              aria-label="Settings and activity"
            >
              <Menu size={18} className="stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Instagram Profile Header Row (Avatar + 4 Balanced Stats) */}
      <div className="flex items-center gap-4 sm:gap-6 mb-3">
        {/* Left: Avatar with Instagram gradient ring */}
        <div className="relative shrink-0 select-none">
          <div className="p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full shadow-lg">
            <div className="p-0.5 bg-black rounded-full">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                alt={user.displayName}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
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

        {/* Right: Instagram 4-Column Balanced Stats (Uniform Heights, No Wrapping) */}
        <div className="flex-1 grid grid-cols-4 gap-1 text-center py-1 select-none">
          <div 
            onClick={() => { triggerHaptic(); setActiveTab("profile"); }} 
            className="cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-base sm:text-lg font-black text-white tracking-tight block leading-tight">
              {reviews.length}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-tight block mt-0.5 whitespace-nowrap">
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
            <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-tight block mt-0.5 whitespace-nowrap">
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
            <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-tight block mt-0.5 whitespace-nowrap">
              Following
            </span>
          </div>

          <div className="active:scale-95 transition-transform">
            <span className="text-base sm:text-lg font-black text-orange-400 tracking-tight block leading-tight">
              {reviews.length > 0 
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                : "0.0"}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-tight block mt-0.5 whitespace-nowrap">
              Rating
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

      {/* 3. Instagram Action Buttons Row (Balanced Heights & Consistent Styling) */}
      <div className="flex items-center gap-2 mb-3.5">
        {currentUser?.uid === user.uid ? (
          <>
            <button
              onClick={() => { triggerHaptic(); setIsEditModalOpen(true); }}
              className="flex-1 h-9 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/10 rounded-xl text-xs font-bold text-white text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Edit3 size={13} />
              <span>Edit profile</span>
            </button>

            <button
              onClick={shareProfile}
              className="flex-1 h-9 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/10 rounded-xl text-xs font-bold text-white text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Share2 size={13} />
              <span>Share profile</span>
            </button>

            <Link
              to={getAppUrl('/wrapped')}
              onClick={() => triggerHaptic()}
              className="h-9 px-3.5 bg-gradient-to-r from-orange-500/15 to-amber-500/15 hover:from-orange-500/25 hover:to-amber-500/25 border border-orange-500/30 rounded-xl text-xs font-bold text-orange-400 flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-[0.98] shadow-sm"
            >
              <Sparkles size={13} />
              <span>Wrapped</span>
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={() => { triggerHaptic(); toggleFollow(); }}
              disabled={isUpdatingFollow}
              className={`flex-1 h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-sm ${
                isFollowing
                  ? "bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800"
                  : "bg-gradient-to-r from-orange-500 to-amber-400 hover:brightness-110 text-black font-black shadow-md"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>

            <button
              onClick={shareProfile}
              className="flex-1 h-9 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>
          </>
        )}
      </div>

      {/* Instagram Professional Dashboard Card */}
      {currentUser?.uid === user.uid && (
        <div
          onClick={() => {
            triggerHaptic();
            setIsInsightsOpen(true);
          }}
          className="mb-3.5 p-3 rounded-xl bg-[#18181b] hover:bg-[#202024] border border-white/[0.08] cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between group shadow-sm"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
              <TrendingUp size={13} className="text-orange-400" />
              <span>Professional Dashboard</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              <strong className="text-white">1,482</strong> critic impressions in the last 30 days
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-orange-400 font-semibold">
            <span>Insights</span>
            <ChevronRight size={14} />
          </div>
        </div>
      )}

      {/* 4. Refined Balanced Segmented Tab Navigation (4 Columns, Perfectly Uniform) */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-2xl border-b border-white/[0.08] -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-2 mb-4 select-none">
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 max-w-xl mx-auto p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl shadow-sm">
          {[
            { id: "profile", label: "Logs", icon: Grid },
            { id: "taste", label: "Taste", icon: Sparkles },
            { id: "eatlist", label: "Saved", icon: Heart },
            { id: "lists", label: "Guides", icon: ListOrdered },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { triggerHaptic(); setActiveTab(tab.id as any); }}
                className={`py-2 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1.5 relative transition-all cursor-pointer ${
                  isActive 
                    ? "text-white font-bold" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] font-medium"
                }`}
                title={tab.label}
              >
                <tab.icon size={15} className={isActive ? "text-orange-400 stroke-[2.2]" : "stroke-[1.6]"} />
                <span className="text-xs font-bold tracking-tight whitespace-nowrap">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="profileActiveTabPill"
                    className="absolute inset-0 bg-white/[0.08] border border-white/[0.12] rounded-xl -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
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

        {/* TAB 2: TASTE DNA */}
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
        onSuccess={(updatedUser) => {
          setUser(updatedUser);
        }}
        user={user}
      />

      <DiaryEntryModal 
        isOpen={selectedReview !== null}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
      />

      <SettingsOverlay 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onEditProfile={() => setIsEditModalOpen(true)} 
      />

      <CriticInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        userName={user.displayName || "Critic"}
      />
    </div>
  );
};
