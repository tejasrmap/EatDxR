import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Review, User } from "../types";
import { MOCK_CRAVINGS, MOCK_CRITICS_DATA, MOCK_DISHES } from "../data/mockData";
import { ReviewCard } from "../components/ReviewCard";
import { AppStoriesBar } from "../components/app/AppStoriesBar";
import { LogMealModal } from "../components/LogMealModal";
import { CravingUploadModal } from "../components/CravingUploadModal";
import { CravingMatcherModal } from "../components/CravingMatcherModal";
import { triggerHaptic } from "../services/nativeService";
import { getReviews } from "../services/supabaseService";
import { 
  Sparkles, Flame, Users, MapPin, Loader2, Plus, 
  Compass, Star, Trophy, BookMarked, Utensils, 
  ChevronRight, ArrowRight, ShieldCheck, Heart, 
  ExternalLink, Check, Play, User as UserIcon, LayoutGrid
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

  // Curated spots for the right discovery sidebar
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

  return (
    <div className="w-full min-h-screen">
      
      {/* Multi-Column Desktop Dashboard Container */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">

          {/* ========================================================================= */}
          {/* 1. LEFT RAIL (Desktop Navigation, Action, Profile & Craving Matcher)      */}
          {/* ========================================================================= */}
          <aside className="hidden lg:flex flex-col gap-4 lg:col-span-4 xl:col-span-3 sticky top-18 select-none">
            
            {/* Primary Log Meal Action Button */}
            <button
              onClick={() => {
                triggerHaptic();
                if (!user) {
                  login();
                } else {
                  setIsLogModalOpen(true);
                }
              }}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 hover:from-orange-400 hover:to-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer border border-orange-400/40 group"
            >
              <Plus size={17} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Log A Meal</span>
            </button>

            {/* Desktop Navigation Panel */}
            <div className="p-3 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl space-y-1">
              <div className="px-3 pt-2 pb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Navigation</span>
                <span className="text-[9px] font-mono text-orange-400 font-bold">Madeater 2.0</span>
              </div>

              <Link
                to="/app"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/10 text-white font-black text-xs transition-all border border-white/10 shadow-sm"
              >
                <div className="w-7 h-7 rounded-xl bg-orange-500 text-black flex items-center justify-center">
                  <LayoutGrid size={14} strokeWidth={2.5} />
                </div>
                <span>Food Feed</span>
              </Link>

              <Link
                to="/app/dishes"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-bold text-xs transition-all"
              >
                <div className="w-7 h-7 rounded-xl bg-white/5 text-orange-400 flex items-center justify-center">
                  <Utensils size={14} />
                </div>
                <span>Signature Dishes</span>
              </Link>

              <Link
                to="/app/restaurants"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-bold text-xs transition-all"
              >
                <div className="w-7 h-7 rounded-xl bg-white/5 text-amber-400 flex items-center justify-center">
                  <Compass size={14} />
                </div>
                <span>Top Restaurants</span>
              </Link>

              <Link
                to="/app/map"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-bold text-xs transition-all"
              >
                <div className="w-7 h-7 rounded-xl bg-white/5 text-emerald-400 flex items-center justify-center">
                  <MapPin size={14} />
                </div>
                <span>Food Radar Map</span>
              </Link>

              <Link
                to="/app/lists"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-bold text-xs transition-all"
              >
                <div className="w-7 h-7 rounded-xl bg-white/5 text-sky-400 flex items-center justify-center">
                  <BookMarked size={14} />
                </div>
                <span>Curated Lists</span>
              </Link>

              <Link
                to="/trails"
                onClick={() => triggerHaptic()}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-bold text-xs transition-all"
              >
                <div className="w-7 h-7 rounded-xl bg-white/5 text-purple-400 flex items-center justify-center">
                  <Trophy size={14} />
                </div>
                <span>Critic Quests & Trails</span>
              </Link>
            </div>

            {/* Craving Matcher Shortcut Widget */}
            <div className="p-4 bg-gradient-to-br from-zinc-950 to-zinc-900 border border-orange-500/20 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-orange-500/10 blur-xl group-hover:bg-orange-500/20 transition-all pointer-events-none" />
              
              <div className="flex items-center gap-2 text-orange-400 font-black text-[10px] uppercase tracking-wider mb-1.5">
                <Sparkles size={12} />
                <span>Indecisive Eater?</span>
              </div>
              <h4 className="text-sm font-black text-white mb-1">Craving Matcher</h4>
              <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                Swipe dishes Tinder-style with friends or solo to instantly settle what to eat.
              </p>
              
              <button
                onClick={() => { triggerHaptic(); setIsMatcherOpen(true); }}
                className="w-full py-2 px-3.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 hover:text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-between cursor-pointer active:scale-95"
              >
                <span>Launch Matcher</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* User Profile Card / Sign In Snapshot */}
            {user ? (
              <Link
                to={`/app/profile/${dishdUser?.username || user.uid}`}
                onClick={() => triggerHaptic()}
                className="p-3.5 bg-zinc-950/80 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl shadow-xl flex items-center gap-3 transition-all group"
              >
                <div className="relative shrink-0">
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-pink-500">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                      alt={user.displayName || "User"}
                      className="w-10 h-10 rounded-full object-cover border border-black"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 border border-black flex items-center justify-center">
                    <Check size={8} className="text-black stroke-[3]" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-black text-white group-hover:text-orange-400 transition-colors block truncate">
                    {user.displayName || "Verified Critic"}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono block truncate">
                    @{dishdUser?.username || user.uid.substring(0, 8)} • Critic
                  </span>
                </div>
                <ChevronRight size={15} className="text-white/30 group-hover:text-white transition-colors" />
              </Link>
            ) : (
              <div className="p-4 bg-zinc-950/80 border border-white/10 rounded-3xl text-center space-y-2">
                <span className="text-xs font-black text-white block">Join Madeater</span>
                <p className="text-[10px] text-white/50">Log culinary visits and earn verified critic status.</p>
                <button
                  onClick={() => { triggerHaptic(); login(); }}
                  className="w-full py-2 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
                >
                  Sign In / Register
                </button>
              </div>
            )}

          </aside>

          {/* ========================================================================= */}
          {/* 2. CENTER FEED (Stories, Filter Tabs, and Review Stream)                  */}
          {/* ========================================================================= */}
          <section className="col-span-1 lg:col-span-8 xl:col-span-6 w-full min-w-0 space-y-4">
            
            {/* 1. APP STORIES BAR */}
            <AppStoriesBar onLogClick={() => setIsCravingModalOpen(true)} />

            {/* 2. STICKY FEED SEGMENTED PILLS */}
            <div className="sticky top-13 sm:top-14 z-30 bg-zinc-950/95 backdrop-blur-xl border border-white/10 p-1 rounded-2xl sm:rounded-full shadow-xl">
              <div className="flex items-center justify-between gap-1 w-full bg-white/5 p-1 rounded-xl sm:rounded-full">
                
                <button
                  onClick={() => { triggerHaptic(); setFeedTab("for-you"); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg sm:rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    feedTab === "for-you"
                      ? "bg-white text-black font-black shadow-md"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <Sparkles size={12} className="shrink-0" />
                  <span className="truncate">For You</span>
                </button>

                <button
                  onClick={() => { triggerHaptic(); setFeedTab("following"); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg sm:rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    feedTab === "following"
                      ? "bg-white text-black font-black shadow-md"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <Users size={12} className="shrink-0" />
                  <span className="truncate">Friends</span>
                </button>

                <button
                  onClick={() => { triggerHaptic(); setFeedTab("trending"); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg sm:rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    feedTab === "trending"
                      ? "bg-white text-black font-black shadow-md"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <Flame size={12} className="shrink-0 text-orange-400" />
                  <span className="truncate">Hot</span>
                </button>

                <button
                  onClick={() => { triggerHaptic(); setFeedTab("nearby"); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg sm:rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    feedTab === "nearby"
                      ? "bg-white text-black font-black shadow-md"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">Nearby</span>
                </button>

              </div>
            </div>

            {/* 3. FEED REVIEW CARDS */}
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
          {/* 3. RIGHT DISCOVERY SIDEBAR (Trending Spots, Top Critics, Radar & Legal)    */}
          {/* ========================================================================= */}
          <aside className="hidden xl:flex flex-col gap-4 xl:col-span-3 sticky top-18 select-none">
            
            {/* Iconic Dining Spots */}
            <div className="p-4 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Curated Gems</span>
                  <h3 className="text-sm font-black text-white">Iconic Spots</h3>
                </div>
                <Link
                  to="/app/restaurants"
                  className="text-[10px] font-bold text-white/50 hover:text-white transition-colors"
                >
                  View all →
                </Link>
              </div>

              <div className="space-y-2.5">
                {trendingSpots.map(spot => (
                  <Link
                    key={spot.id}
                    to={`/app/restaurant/${spot.id}`}
                    onClick={() => triggerHaptic()}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/10"
                  >
                    <img
                      src={spot.image}
                      alt={spot.name}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {spot.name}
                        </h4>
                        <span className="text-[10px] font-black text-amber-400 shrink-0 font-mono">
                          ★ {spot.score}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate">{spot.cuisine}</p>
                      <p className="text-[9px] text-white/30 truncate flex items-center gap-0.5 mt-0.5">
                        <MapPin size={8} className="text-orange-500 shrink-0" />
                        {spot.location}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Critics to Follow */}
            <div className="p-4 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Critic Network</span>
                  <h3 className="text-sm font-black text-white">Top Foodies</h3>
                </div>
                <Link
                  to="/app/critics"
                  className="text-[10px] font-bold text-white/50 hover:text-white transition-colors"
                >
                  All →
                </Link>
              </div>

              <div className="space-y-2.5">
                {MOCK_CRITICS_DATA.slice(1, 4).map(critic => {
                  const isFollowing = followedCritics.includes(critic.uid);
                  return (
                    <div key={critic.uid} className="flex items-center justify-between gap-2 p-1.5 rounded-2xl hover:bg-white/5 transition-all">
                      <Link
                        to={`/app/profile/${critic.username || critic.uid}`}
                        onClick={() => triggerHaptic()}
                        className="flex items-center gap-2.5 min-w-0 group"
                      >
                        <img
                          src={critic.photoURL || `https://ui-avatars.com/api/?name=${critic.displayName}`}
                          alt={critic.displayName}
                          className="w-9 h-9 rounded-full object-cover border border-white/15 group-hover:border-orange-500 transition-colors shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors block truncate">
                            {critic.displayName}
                          </span>
                          <span className="text-[9px] text-white/40 font-mono block truncate">
                            {critic.stats.reviewsWritten} reviews • {critic.stats.followers} followers
                          </span>
                        </div>
                      </Link>

                      <button
                        onClick={() => toggleFollow(critic.uid)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0 ${
                          isFollowing
                            ? "bg-white/10 text-white/70 hover:bg-rose-500/20 hover:text-rose-300"
                            : "bg-orange-500 text-black hover:bg-orange-400"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spatial Food Radar Banner */}
            <Link
              to="/app/map"
              onClick={() => triggerHaptic()}
              className="p-4 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 border border-emerald-500/20 hover:border-emerald-500/40 rounded-3xl shadow-xl flex items-center justify-between gap-3 group transition-all"
            >
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <Compass size={10} className="animate-spin" />
                  Live Radar
                </span>
                <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors mt-0.5">
                  Explore Food Radar
                </h4>
                <p className="text-[10px] text-white/50">Browse dishes by spatial map distance</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                <ArrowRight size={14} />
              </div>
            </Link>

            {/* Platform Compliance & Footer Links */}
            <div className="px-4 py-2 text-[10px] text-white/40 space-y-1.5">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <span>•</span>
                <Link to="/delete-account" className="hover:text-white transition-colors">Delete Account</Link>
                <span>•</span>
                <Link to="/app/cravings" className="hover:text-white transition-colors">Cravings Feed</Link>
              </div>
              <p className="text-[9px] text-white/30 font-mono">
                © 2026 Madeater. Dish-First Discovery.
              </p>
            </div>

          </aside>

        </div>
      </div>

      {/* Associated Modals */}
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <CravingUploadModal isOpen={isCravingModalOpen} onClose={() => setIsCravingModalOpen(false)} />
      <CravingMatcherModal isOpen={isMatcherOpen} onClose={() => setIsMatcherOpen(false)} />
    </div>
  );
}
