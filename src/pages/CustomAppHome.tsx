import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Review } from "../types";
import { MOCK_CRAVINGS } from "../data/mockData";
import { ReviewCard } from "../components/ReviewCard";
import { AppStoriesBar } from "../components/app/AppStoriesBar";
import { LogMealModal } from "../components/LogMealModal";
import { CravingUploadModal } from "../components/CravingUploadModal";
import { triggerHaptic } from "../services/nativeService";
import { getReviews } from "../services/supabaseService";
import { Sparkles, Flame, Users, MapPin, Loader2, Plus } from "lucide-react";

export function CustomAppHome() {
  const { dishdUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"for-you" | "following" | "trending" | "nearby">("for-you");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);

  useEffect(() => {
    getReviews().then((fetched) => {
      setReviews(fetched);
      setLoading(false);
    });
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

  return (
    <div className="w-full min-h-screen">
      
      {/* 1. APP STORIES BAR */}
      <AppStoriesBar onLogClick={() => setIsCravingModalOpen(true)} />

      {/* 2. STICKY FEED SEGMENTED PILLS */}
      <div className="sticky top-14 z-30 bg-black/90 backdrop-blur-xl border-b border-white/10 px-3 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-1 max-w-md mx-auto bg-zinc-900/90 p-1 rounded-full border border-white/10">
          
          <button
            onClick={() => { triggerHaptic(); setFeedTab("for-you"); }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 sm:px-3 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 ${
              feedTab === "for-you"
                ? "bg-white text-black shadow-sm font-black"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Sparkles size={11} className="shrink-0" />
            <span className="truncate">For You</span>
          </button>

          <button
            onClick={() => { triggerHaptic(); setFeedTab("following"); }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 sm:px-3 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 ${
              feedTab === "following"
                ? "bg-white text-black shadow-sm font-black"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Users size={11} className="shrink-0" />
            <span className="truncate">Friends</span>
          </button>

          <button
            onClick={() => { triggerHaptic(); setFeedTab("trending"); }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 sm:px-3 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 ${
              feedTab === "trending"
                ? "bg-white text-black shadow-sm font-black"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Flame size={11} className="shrink-0 text-orange-400" />
            <span className="truncate">Hot</span>
          </button>

          <button
            onClick={() => { triggerHaptic(); setFeedTab("nearby"); }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 sm:px-3 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 ${
              feedTab === "nearby"
                ? "bg-white text-black shadow-sm font-black"
                : "text-white/50 hover:text-white"
            }`}
          >
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">Nearby</span>
          </button>

        </div>
      </div>

      {/* 3. FEED REVIEW CARDS */}
      <div className="px-3 sm:px-4 py-4 space-y-4 max-w-xl mx-auto">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-white/40 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="text-xs uppercase font-bold tracking-widest">Loading Madeater Feed...</span>
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="py-16 text-center text-white/50 space-y-3 bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <p className="text-sm font-bold text-white">No reviews found in this tab.</p>
            <p className="text-xs text-white/40">Be the first to log a meal or switch tabs!</p>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-5 py-2 rounded-full bg-orange-500 text-black font-black text-xs uppercase tracking-wider shadow-lg"
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

      {/* Modals */}
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <CravingUploadModal isOpen={isCravingModalOpen} onClose={() => setIsCravingModalOpen(false)} />
    </div>
  );
}
