import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { MOCK_DISHES, MOCK_LISTS, MOCK_CRITICS_DATA, MOCK_CRAVINGS } from "../data/mockData";
import { ReviewCard } from "../components/ReviewCard";
import { LogMealModal } from "../components/LogMealModal";
import { CravingUploadModal } from "../components/CravingUploadModal";
import { AIFoodAssistant } from "../components/AIFoodAssistant";
import { getReviews } from "../services/supabaseService";
import { Review } from "../types";
import { useAuth } from "../App";
import { 
  Star, ArrowRight, Flame, Sparkles, MapPin, 
  ShieldCheck, Play, Plus, Users, Utensils, Award, ListOrdered, 
  Video, Heart
} from "lucide-react";

const CITIES = ["All", "Hyderabad", "Mumbai", "Delhi", "Bangalore", "Goa"];

export function WebsiteHome() {
  const { user, dishdUser, login } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainView, setMainView] = useState<"feed" | "dishes" | "lists" | "critics">("feed");
  const [feedFilter, setFeedFilter] = useState<"trending" | "for-you" | "following" | "nearby">("trending");
  const [selectedCity, setSelectedCity] = useState("All");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  useEffect(() => {
    getReviews(selectedCity === "All" ? undefined : selectedCity).then((data) => {
      setReviews(data);
      setLoading(false);
    });
  }, [selectedCity]);

  const displayedReviews = reviews.filter((r) => {
    if (feedFilter === "for-you") return true;
    if (feedFilter === "following") {
      const followingList = dishdUser?.stats?.followingList || ["teja", "priya"];
      return followingList.includes(r.userId);
    }
    if (feedFilter === "trending") {
      return (r.likes || 0) > 5 || r.rating >= 9.0;
    }
    if (feedFilter === "nearby") {
      return selectedCity === "All" || (r.city && r.city.toLowerCase().includes(selectedCity.toLowerCase()));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white selection:bg-orange-500 selection:text-black">
      
      {/* 1. MINIMAL HERO */}
      <Hero />

      {/* 2. MAIN VIEW SWITCHER (CLEAN, MINIMAL TABS) */}
      <div id="popular-meals" className="max-w-4xl mx-auto px-6 pt-8 pb-4">
        
        {/* Sleek Minimal Nav Bar */}
        <div className="flex items-center justify-center gap-2 pb-6 border-b border-white/10">
          {[
            { id: "feed", label: "Live Feed", icon: <Flame size={13} /> },
            { id: "dishes", label: "Signature Dishes", icon: <Utensils size={13} /> },
            { id: "lists", label: "Curated Guides", icon: <ListOrdered size={13} /> },
            { id: "critics", label: "Top Critics", icon: <Award size={13} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMainView(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mainView === tab.id
                  ? "bg-white text-black shadow-md font-black scale-102"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* 3. TAB CONTENT VIEWS */}
      <div className="max-w-4xl mx-auto px-6 pb-24">

        {/* VIEW A: LIVE FEED (DEFAULT) */}
        {mainView === "feed" && (
          <div className="space-y-8 pt-4">
            
            {/* Quick Action Prompt & Story Reel Strip */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 rounded-2xl bg-zinc-950 border border-white/10">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  Logged a meal recently?
                </p>
                <p className="text-[11px] text-white/40">
                  Add to your culinary journal and build your Taste DNA.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    if (!user) { login(); return; }
                    setIsCravingModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Video size={13} />
                  <span>Story</span>
                </button>
                <button
                  onClick={() => {
                    if (!user) { login(); return; }
                    setIsLogModalOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} className="stroke-[3]" />
                  <span>Log Meal</span>
                </button>
              </div>
            </div>

            {/* Filter Bar: Mode + City */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
              
              {/* Mode Tabs */}
              <div className="flex items-center gap-2 text-xs">
                {[
                  { id: "trending", label: "Trending" },
                  { id: "for-you", label: "For You" },
                  { id: "following", label: "Following" },
                  { id: "nearby", label: "Nearby" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setFeedFilter(mode.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      feedFilter === mode.id
                        ? "text-orange-400 border-b-2 border-orange-500 rounded-b-none"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* City Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedCity === city
                        ? "bg-white/15 text-white"
                        : "text-white/30 hover:text-white"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews Stream (Clean, Centered, No Noisy Sidebar) */}
            <div className="space-y-6">
              {loading ? (
                <div className="py-20 text-center text-white/30 text-xs uppercase tracking-widest animate-pulse">
                  Loading Reviews...
                </div>
              ) : displayedReviews.length === 0 ? (
                <div className="py-16 text-center text-white/40 space-y-3 bg-zinc-950/40 rounded-2xl border border-white/10 p-8">
                  <p className="text-sm font-semibold text-white">No reviews found in this filter.</p>
                  <p className="text-xs text-white/40">Be the first critic to share a verdict!</p>
                  <button
                    onClick={() => setIsLogModalOpen(true)}
                    className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Log A Meal
                  </button>
                </div>
              ) : (
                displayedReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              )}
            </div>

          </div>
        )}

        {/* VIEW B: SIGNATURE DISHES */}
        {mainView === "dishes" && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <p className="text-xs text-white/50 uppercase tracking-wider font-bold">
                The Dish Index • Ranked across Indian culinary capitals
              </p>
              <Link to="/dishes" className="text-xs text-orange-400 font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                <span>View Full Graph</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {MOCK_DISHES.map((dish) => (
                <Link
                  key={dish.id}
                  to={`/dish/${dish.id}`}
                  className="group rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/30 p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/11] rounded-xl overflow-hidden mb-3 border border-white/10 bg-zinc-900">
                      <img 
                        src={dish.image} 
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs font-black text-white flex items-center gap-1">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        <span>{dish.madeaterScore.toFixed(1)}</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-2 mt-1 font-serif italic">
                      {dish.description}
                    </p>
                  </div>
                  <p className="text-[11px] text-white/40 mt-3 pt-3 border-t border-white/10 truncate">
                    at {dish.topRestaurants[0]?.name || "Featured Venue"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* VIEW C: CURATED GUIDES */}
        {mainView === "lists" && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <p className="text-xs text-white/50 uppercase tracking-wider font-bold">
                Food Lists curated by verified community critics
              </p>
              <Link to="/lists" className="text-xs text-orange-400 font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                <span>All Guides</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {MOCK_LISTS.map((list) => (
                <Link 
                  to={`/list/${list.id}`} 
                  key={list.id}
                  className="group p-5 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3.5 border border-white/10 bg-zinc-900">
                      <img 
                        src={list.coverImage} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {list.title}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-2 mt-1 leading-relaxed font-serif italic">
                      {list.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/10 mt-4 flex items-center justify-between text-xs text-white/40">
                    <span>by {list.userName}</span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <Heart size={11} className="fill-rose-400" />
                      {list.likes}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* VIEW D: TOP CRITICS */}
        {mainView === "critics" && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <p className="text-xs text-white/50 uppercase tracking-wider font-bold">
                Leaderboard • Most credible culinary voices
              </p>
              <Link to="/critics" className="text-xs text-orange-400 font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                <span>Critics Directory</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {MOCK_CRITICS_DATA.map((critic, i) => (
                <Link
                  key={critic.uid}
                  to={`/profile/${critic.username || critic.uid}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/30 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-xs font-black text-white/40 w-5">#{i + 1}</span>
                    <img 
                      src={critic.photoURL} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                        {critic.displayName}
                      </p>
                      <p className="text-xs text-white/40">{critic.criticLevel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold">
                    <ShieldCheck size={13} />
                    <span>{critic.credibilityScore} Credibility</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 4. FLOATING MINIMAL CHEF AI BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAIOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-white/20 hover:border-orange-500/50 shadow-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 group"
        >
          <Sparkles size={14} className="text-orange-400 group-hover:rotate-12 transition-transform" />
          <span>Ask Chef AI</span>
        </button>
      </div>

      {/* Global Interactive Modals */}
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <CravingUploadModal isOpen={isCravingModalOpen} onClose={() => setIsCravingModalOpen(false)} />
      <AIFoodAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}
