import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Review, Restaurant, User } from "../types";
import { ReviewCard } from "../components/ReviewCard";
import { AppStoriesBar } from "../components/app/AppStoriesBar";
import { LogMealModal } from "../components/LogMealModal";
import { CravingUploadModal } from "../components/CravingUploadModal";
import { CravingMatcherModal } from "../components/CravingMatcherModal";
import { SearchOverlay } from "../components/SearchOverlay";
import { SettingsOverlay } from "../components/SettingsOverlay";
import { triggerHaptic } from "../services/nativeService";
import { getReviews, getRestaurants } from "../services/supabaseService";
import { collection, query, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import {
  Home, Search, Compass, UtensilsCrossed, Clapperboard,
  MapPin, Bookmark, Sparkles, Plus, Settings,
  User as UserIcon, Star
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

const FEED_TABS = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Friends" },
  { id: "trending", label: "Hot" },
  { id: "nearby", label: "Nearby" },
] as const;

function ReviewCardSkeleton() {
  return (
    <div className="p-4 sm:p-5 mb-4 bg-white dark:bg-zinc-950/60 border border-slate-200/80 dark:border-white/10 rounded-3xl space-y-3.5 shadow-sm dark:shadow-none">
      {/* Top author row skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0" />
          <div className="space-y-1.5">
            <div className="w-28 h-3.5 rounded-md skeleton-shimmer" />
            <div className="w-18 h-2.5 rounded-md skeleton-shimmer" />
          </div>
        </div>
        <div className="w-14 h-6 rounded-full skeleton-shimmer" />
      </div>

      {/* Hero image skeleton with exact aspect ratio */}
      <div className="w-full aspect-[16/10] sm:aspect-[16/9] max-h-72 sm:max-h-96 md:max-h-[420px] rounded-2xl skeleton-shimmer" />

      {/* Dish & quote skeleton */}
      <div className="space-y-2 pt-1">
        <div className="w-3/4 h-4 rounded-md skeleton-shimmer" />
        <div className="w-1/2 h-3 rounded-md skeleton-shimmer" />
      </div>

      {/* Action bar skeleton */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-4 rounded-full skeleton-shimmer" />
          <div className="w-12 h-4 rounded-full skeleton-shimmer" />
          <div className="w-6 h-4 rounded-full skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-14 h-6 rounded-full skeleton-shimmer" />
          <div className="w-6 h-6 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function CustomAppHome() {
  const { user, dishdUser, login } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [suggestedCritics, setSuggestedCritics] = useState<User[]>([]);
  const [popularRestaurants, setPopularRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"for-you" | "following" | "trending" | "nearby">("for-you");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [followedCritics, setFollowedCritics] = useState<string[]>(["teja"]);

  useEffect(() => {
    // Clear old mock cache if any
    try {
      localStorage.removeItem("madeater_feed_cache");
    } catch {}

    // 1. Live real-time Firestore reviews listener
    const q = query(
      collection(db, "reviews"),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreReviews = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id,
      })) as Review[];

      // Merge Supabase reviews
      getReviews().then((supaReviews) => {
        const idMap = new Map<string, Review>();
        firestoreReviews.forEach(r => idMap.set(r.id, r));
        (supaReviews || []).forEach(r => {
          if (!idMap.has(r.id)) idMap.set(r.id, r);
        });
        setReviews(Array.from(idMap.values()));
        setLoading(false);
      }).catch(() => {
        setReviews(firestoreReviews);
        setLoading(false);
      });
    }, (err) => {
      console.warn("Firestore reviews listener notice:", err);
      getReviews().then((supaReviews) => {
        setReviews(supaReviews || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    });

    // 2. Fetch real users for Suggested Critics
    getDocs(query(collection(db, "users"), limit(8))).then((snap) => {
      const usersList = snap.docs
        .map(d => d.data() as User)
        .filter(u => u.uid !== user?.uid);
      setSuggestedCritics(usersList);
    }).catch(() => {});

    // 3. Fetch popular restaurants
    getRestaurants().then((rests) => {
      if (rests && rests.length > 0) {
        setPopularRestaurants(rests.slice(0, 4));
      }
    }).catch(() => {});

    return () => unsubscribe();
  }, [user?.uid]);

  const displayedReviews = reviews.filter((r) => {
    if (feedTab === "for-you") return true;
    if (feedTab === "following") {
      const followingList = dishdUser?.stats?.followingList || [];
      return followingList.includes(r.userId);
    }
    if (feedTab === "trending") {
      return (r.likes || 0) > 5 || r.rating >= 9.0;
    }
    if (feedTab === "nearby") {
      return true;
    }
    return true;
  });

  const toggleFollow = (criticId: string) => {
    triggerHaptic();
    setFollowedCritics(prev => {
      if (prev.includes(criticId)) {
        toast.success("Unfollowed critic");
        return prev.filter(id => id !== criticId);
      } else {
        toast.success("Now following critic!");
        return [...prev, criticId];
      }
    });
  };

  const profileLink = user ? `/app/profile/${dishdUser?.username || user.uid}` : "/app";

  return (
    <div className="w-full">
      <div className="flex justify-center xl:justify-between gap-6 xl:gap-8 items-start w-full py-1">
        {/* ========================================================================= */}
        {/* 1. CENTER FEED (Stories, Filter Pills, and Review Cards Stream)           */}
        {/* ========================================================================= */}
        <section className="w-full max-w-[620px] mx-auto min-w-0 space-y-4">

          {/* Stories Tray */}
          <AppStoriesBar onLogClick={() => setIsCravingModalOpen(true)} cravings={reviews} />

          {/* Fluid Spring Feed Tabs */}
          <div className="sticky top-13 sm:top-14 z-30 bg-slate-50/90 dark:bg-black/85 backdrop-blur-xl py-2 px-0.5">
            <div className="flex items-center justify-between gap-1 w-full bg-slate-200/70 dark:bg-white/[0.05] p-1.5 rounded-full border border-slate-300/70 dark:border-white/10 shadow-sm dark:shadow-lg">
              {FEED_TABS.map((tab) => {
                const isActive = feedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { triggerHaptic(); setFeedTab(tab.id); }}
                    className={`relative flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-full text-xs font-bold transition-colors cursor-pointer select-none text-center ${isActive
                        ? "text-slate-950 dark:text-black"
                        : "text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="feedTabPill"
                        className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/90 dark:border-transparent z-0"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 font-black">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Cards Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <ReviewCardSkeleton />
                <ReviewCardSkeleton />
                <ReviewCardSkeleton />
              </div>
            ) : displayedReviews.length === 0 ? (
              <div className="py-16 text-center text-white/50 space-y-4 bg-zinc-950/80 border border-white/10 rounded-3xl p-8 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
                  <Sparkles size={22} />
                </div>
                <p className="text-base font-black text-white">No reviews found in this view.</p>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Be the first food critic to log an experience or switch filter tabs to discover more.
                </p>
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg hover:from-orange-400 hover:to-amber-400 transition-all cursor-pointer active:scale-95"
                >
                  Log A Meal Now
                </button>
              </div>
            ) : (
              displayedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </div>

        </section>

        {/* ========================================================================= */}
        {/* 3. RIGHT SIDEBAR (Instagram Web "Suggested For You" Style)                 */}
        {/* ========================================================================= */}
        <aside className="hidden xl:flex flex-col gap-5 xl:col-span-3 sticky top-18 select-none pl-2">

          {/* 1. Current User Row */}
          <div className="flex items-center justify-between py-1">
            <Link to={profileLink} className="flex items-center gap-3 min-w-0 group">
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-pink-500 shrink-0">
                <img
                  src={user?.photoURL || "https://ui-avatars.com/api/?name=Critic&background=random"}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full object-cover border border-black"
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-white group-hover:text-orange-400 transition-colors block truncate">
                  {dishdUser?.username || (user ? user.displayName?.toLowerCase().replace(/\s+/g, '') : "food_critic")}
                </span>
                <span className="text-xs text-white/50 block truncate">
                  {user?.displayName || "Food Critic"}
                </span>
              </div>
            </Link>
            <Link
              to={profileLink}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Profile
            </Link>
          </div>

          {/* 2. Suggested Critics Header */}
          <div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-white/60">Suggested for you</span>
              <Link to="/app/critics" className="text-[11px] font-bold text-white hover:text-white/80 transition-colors">
                See All
              </Link>
            </div>

            {/* Critics List */}
            <div className="space-y-3 pt-1">
              {suggestedCritics.length > 0 ? (
                suggestedCritics.slice(0, 4).map(critic => {
                  const isFollowing = followedCritics.includes(critic.uid);
                  return (
                    <div key={critic.uid} className="flex items-center justify-between gap-2 p-1.5 rounded-2xl hover:bg-white/[0.03] transition-colors">
                      <Link
                        to={`/app/profile/${critic.username || critic.uid}`}
                        onClick={() => triggerHaptic()}
                        className="flex items-center gap-3 min-w-0 group"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={critic.photoURL || `https://ui-avatars.com/api/?name=${critic.displayName || 'Critic'}`}
                            alt={critic.displayName || "Critic"}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-500 rounded-full flex items-center justify-center border border-black shadow-sm">
                            <Sparkles size={8} className="text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                              {critic.username || critic.displayName?.toLowerCase().replace(/\s+/g, '') || "critic"}
                            </span>
                          </div>
                          <span className="text-[11px] text-white/40 block truncate">
                            {critic.stats?.followers || 0} followers • {critic.favoriteCuisines?.[0] || "Food Critic"}
                          </span>
                        </div>
                      </Link>

                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleFollow(critic.uid)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${isFollowing
                            ? "border-white/15 bg-white/5 text-white/50 hover:border-rose-500/40 hover:text-rose-400"
                            : "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                          }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </motion.button>
                    </div>
                  );
                })
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                  <p className="text-[11px] text-white/40">Connect with fellow critics & foodies</p>
                  <Link to="/app/critics" className="text-xs font-bold text-orange-400 hover:text-orange-300 mt-1 inline-block">
                    Explore Critics →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 3. Popular Spots Header */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-white/60">Popular in Hyderabad</span>
              <Link to="/app/restaurants" className="text-[11px] font-bold text-white hover:text-white/80 transition-colors">
                See All
              </Link>
            </div>

            <div className="space-y-2.5 pt-1">
              {popularRestaurants.length > 0 ? (
                popularRestaurants.map(spot => (
                  <Link
                    key={spot.id}
                    to={`/app/restaurant/${spot.id}`}
                    onClick={() => triggerHaptic()}
                    className="flex items-center gap-3 group"
                  >
                    <img
                      src={spot.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"}
                      alt={spot.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {spot.name}
                        </span>
                        <span className="text-[11px] font-bold text-amber-400 shrink-0 font-mono">
                          ★ {spot.rating}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 truncate">{spot.location}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                  <p className="text-[11px] text-white/40">Discover top dining destinations</p>
                  <Link to="/app/restaurants" className="text-xs font-bold text-orange-400 hover:text-orange-300 mt-1 inline-block">
                    Browse Restaurants →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 4. Instagram Web Minimalist Footer */}
          <div className="pt-4 border-t border-white/5 space-y-2 text-[11px] text-white/30">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <span>•</span>
              <Link to="/delete-account" className="hover:underline">Delete Account</Link>
              <span>•</span>
              <Link to="/app/trails" className="hover:underline">Trails</Link>
              <span>•</span>
              <Link to="/app/map" className="hover:underline">Radar</Link>
              <span>•</span>
              <span>Guidelines</span>
            </div>
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-wider">
              © 2026 MADEATER
            </p>
          </div>

        </aside>

      </div>

      {/* Associated Modals */}
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <CravingUploadModal isOpen={isCravingModalOpen} onClose={() => setIsCravingModalOpen(false)} />
      <CravingMatcherModal isOpen={isMatcherOpen} onClose={() => setIsMatcherOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SettingsOverlay isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onEditProfile={() => navigate(profileLink)} />
    </div>
  );
}
