import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Review } from "../types";
import { MOCK_CRAVINGS, MOCK_CRITICS_DATA } from "../data/mockData";
import { ReviewCard } from "../components/ReviewCard";
import { AppStoriesBar } from "../components/app/AppStoriesBar";
import { LogMealModal } from "../components/LogMealModal";
import { CravingUploadModal } from "../components/CravingUploadModal";
import { CravingMatcherModal } from "../components/CravingMatcherModal";
import { SearchOverlay } from "../components/SearchOverlay";
import { SettingsOverlay } from "../components/SettingsOverlay";
import { triggerHaptic } from "../services/nativeService";
import { getReviews } from "../services/supabaseService";
import { 
  Home, Search, Compass, UtensilsCrossed, Clapperboard, 
  MapPin, Bookmark, Sparkles, Plus, Settings, 
  User as UserIcon, Loader2, Star
} from "lucide-react";
import { toast } from "sonner";

export function CustomAppHome() {
  const { user, dishdUser, login } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const cached = localStorage.getItem("madeater_feed_cache");
      return cached ? JSON.parse(cached) : MOCK_CRAVINGS;
    } catch {
      return MOCK_CRAVINGS;
    }
  });
  const [loading, setLoading] = useState(false);
  const [feedTab, setFeedTab] = useState<"for-you" | "following" | "trending" | "nearby">("for-you");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [followedCritics, setFollowedCritics] = useState<string[]>(["teja"]);

  useEffect(() => {
    getReviews().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setReviews(fetched);
        try {
          localStorage.setItem("madeater_feed_cache", JSON.stringify(fetched));
        } catch {
          // ignore quota error
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const displayedReviews = reviews.filter((r) => {
    if (feedTab === "for-you") return true;
    if (feedTab === "following") {
      const followingList = dishdUser?.stats?.followingList || ["teja", "priya"];
      return followingList.includes(r.userId);
    }
    if (feedTab === "trending") {
      return (r.likes || 0) > 10 || r.rating >= 9.0;
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

  const trendingSpots = [
    {
      id: "bawarchi-rtc",
      name: "Bawarchi",
      score: 9.6,
      cuisine: "Hyderabadi Biryani",
      location: "RTC X Roads",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "shadab-oldcity",
      name: "Hotel Shadab",
      score: 9.4,
      cuisine: "Mutton Biryani & Haleem",
      location: "Ghansi Bazaar",
      image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "ulavacharu",
      name: "Ulavacharu",
      score: 9.7,
      cuisine: "Andhra Specialities",
      location: "Jubilee Hills",
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=400&q=80"
    }
  ];

  const profileLink = user ? `/app/profile/${dishdUser?.username || user.uid}` : "/app";

  return (
    <div className="w-full min-h-screen">
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">

          {/* ========================================================================= */}
          {/* 1. LEFT SIDEBAR (Instagram Web Style Minimalist Navigation)               */}
          {/* ========================================================================= */}
          <aside className="hidden lg:flex flex-col justify-between lg:col-span-3 xl:col-span-3 sticky top-18 select-none min-h-[calc(100vh-100px)] pb-6 pr-2">
            
            <div className="space-y-1">
              {/* Home */}
              <Link
                to="/app"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-4 px-3.5 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm transition-all"
              >
                <Home size={22} className="text-orange-400" />
                <span>Home</span>
              </Link>

              {/* Search */}
              <button
                onClick={() => { triggerHaptic(); setIsSearchOpen(true); }}
                className="w-full flex items-center gap-4 px-3.5 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all cursor-pointer text-left"
              >
                <Search size={22} />
                <span>Search</span>
              </button>

              {/* Explore Dishes */}
              <Link
                to="/app/dishes"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-4 px-3.5 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <Compass size={22} />
                <span>Explore Dishes</span>
              </Link>

              {/* Restaurants */}
              <Link
                to="/app/restaurants"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-4 px-3.5 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <UtensilsCrossed size={22} />
                <span>Restaurants</span>
              </Link>

              {/* Cravings (Reels) */}
              <Link
                to="/app/cravings"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-4 px-3.5 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <Clapperboard size={22} />
                <span>Cravings</span>
              </Link>

              {/* Food Radar */}
              <Link
                to="/app/map"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-4 px-3.5 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <MapPin size={22} />
                <span>Food Radar</span>
              </Link>

              {/* Saved Lists */}
              <Link
                to="/app/lists"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-4 px-3.5 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <Bookmark size={22} />
                <span>Saved Lists</span>
              </Link>

              {/* Craving Matcher */}
              <button
                onClick={() => { triggerHaptic(); setIsMatcherOpen(true); }}
                className="w-full flex items-center gap-4 px-3.5 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all cursor-pointer text-left"
              >
                <Sparkles size={22} className="text-amber-400" />
                <span>Craving Matcher</span>
              </button>

              {/* Profile */}
              <Link
                to={profileLink}
                onClick={() => triggerHaptic()}
                className="flex items-center gap-4 px-3.5 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Profile"}
                    className="w-5.5 h-5.5 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <UserIcon size={22} />
                )}
                <span>Profile</span>
              </Link>

              {/* Sleek Instagram-style Create / Log Meal button */}
              <div className="pt-3">
                <button
                  onClick={() => {
                    triggerHaptic();
                    if (!user) {
                      login();
                    } else {
                      setIsLogModalOpen(true);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Log A Meal</span>
                </button>
              </div>
            </div>

            {/* Bottom: Settings */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => { triggerHaptic(); setIsSettingsOpen(true); }}
                className="w-full flex items-center gap-4 px-3.5 py-2.5 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 font-medium text-sm transition-all cursor-pointer text-left"
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </div>

          </aside>

          {/* ========================================================================= */}
          {/* 2. CENTER FEED (Stories, Filter Pills, and Review Cards Stream)           */}
          {/* ========================================================================= */}
          <section className="col-span-1 lg:col-span-9 xl:col-span-6 w-full max-w-[620px] mx-auto min-w-0 space-y-4">
            
            {/* Stories Tray */}
            <AppStoriesBar onLogClick={() => setIsCravingModalOpen(true)} />

            {/* Minimalist Feed Tabs */}
            <div className="sticky top-13 sm:top-14 z-30 bg-black/85 backdrop-blur-xl py-1.5 px-0.5">
              <div className="flex items-center justify-between gap-1 w-full bg-white/[0.04] p-1 rounded-2xl border border-white/10">
                
                <button
                  onClick={() => { triggerHaptic(); setFeedTab("for-you"); }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    feedTab === "for-you"
                      ? "bg-white text-black font-black shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  For You
                </button>

                <button
                  onClick={() => { triggerHaptic(); setFeedTab("following"); }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    feedTab === "following"
                      ? "bg-white text-black font-black shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Friends
                </button>

                <button
                  onClick={() => { triggerHaptic(); setFeedTab("trending"); }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    feedTab === "trending"
                      ? "bg-white text-black font-black shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Hot
                </button>

                <button
                  onClick={() => { triggerHaptic(); setFeedTab("nearby"); }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    feedTab === "nearby"
                      ? "bg-white text-black font-black shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Nearby
                </button>

              </div>
            </div>

            {/* Review Cards Feed */}
            <div className="space-y-4">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40 gap-3 bg-zinc-950/60 border border-white/10 rounded-3xl">
                  <Loader2 className="w-9 h-9 animate-spin text-orange-500" />
                  <span className="text-xs uppercase font-mono tracking-widest">Loading Madeater Feed...</span>
                </div>
              ) : displayedReviews.length === 0 ? (
                <div className="py-16 text-center text-white/50 space-y-4 bg-zinc-950/80 border border-white/10 rounded-3xl p-8">
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
                {MOCK_CRITICS_DATA.slice(1, 4).map(critic => {
                  const isFollowing = followedCritics.includes(critic.uid);
                  return (
                    <div key={critic.uid} className="flex items-center justify-between gap-2">
                      <Link
                        to={`/app/profile/${critic.username || critic.uid}`}
                        onClick={() => triggerHaptic()}
                        className="flex items-center gap-3 min-w-0 group"
                      >
                        <img
                          src={critic.photoURL || `https://ui-avatars.com/api/?name=${critic.displayName}`}
                          alt={critic.displayName}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white group-hover:underline block truncate">
                            {critic.username || critic.displayName.toLowerCase().replace(/\s+/g, '')}
                          </span>
                          <span className="text-[11px] text-white/40 block truncate">
                            {critic.stats.followers} followers • {critic.favoriteCuisines?.[0] || "Foodie"}
                          </span>
                        </div>
                      </Link>

                      <button
                        onClick={() => toggleFollow(critic.uid)}
                        className={`text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                          isFollowing
                            ? "text-white/40 hover:text-rose-400"
                            : "text-orange-400 hover:text-orange-300"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                })}
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
                {trendingSpots.map(spot => (
                  <Link
                    key={spot.id}
                    to={`/app/restaurant/${spot.id}`}
                    onClick={() => triggerHaptic()}
                    className="flex items-center gap-3 group"
                  >
                    <img
                      src={spot.image}
                      alt={spot.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {spot.name}
                        </span>
                        <span className="text-[11px] font-bold text-amber-400 shrink-0 font-mono">
                          ★ {spot.score}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 truncate">{spot.location}</p>
                    </div>
                  </Link>
                ))}
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
                © 2026 MADEATER FROM DISHD
              </p>
            </div>

          </aside>

        </div>
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
