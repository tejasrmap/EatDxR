import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Review } from "../types";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, LayoutGrid, PlayCircle, Info, MapPin } from "lucide-react";
import { PostCard } from "./PostCard";
import { ReelCard } from "./ReelCard";
import { motion, AnimatePresence } from "motion/react";

type FeedMode = 'posts' | 'reels';

export const Journal: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const mode = (new URLSearchParams(location.search).get('mode') as FeedMode) || 'posts';

  const updateMode = (newMode: FeedMode) => {
    navigate({
      pathname: location.pathname,
      search: `?mode=${newMode}`
    }, { replace: true });
  };

  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Review[];
      setReviews(fetchedReviews);
      setLoading(false);
    }, (error) => {
      console.error("Feed subscription error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="space-y-4 text-center">
           <Loader2 className="w-12 h-12 animate-spin text-[#00e054] mx-auto" />
           <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-black italic">Streaming Regional Moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black ${mode === 'posts' ? 'pt-24 pb-32 px-4 md:px-6' : 'pt-0 pb-0 overflow-hidden'}`}>
      
      {/* Elegant Integrated Header - Responsive */}
      <div className={`transition-all duration-500 z-[120] ${mode === 'reels' ? 'fixed top-6 left-1/2 -translate-x-1/2 w-max max-w-[95vw]' : 'relative mb-12'}`}>
        <div className={`flex items-center gap-6 md:gap-12 bg-black/40 border border-white/10 rounded-full p-1.5 backdrop-blur-3xl shadow-2xl transition-all duration-500 ${mode === 'reels' ? 'px-6' : 'bg-transparent border-none backdrop-blur-none shadow-none'}`}>
            
            {/* Minimal Logo - Only in Reels Mode or always for Journal Header */}
            <Link to="/" className={`flex items-center gap-2 transition-all duration-700 ${mode === 'reels' ? 'opacity-100' : 'opacity-100'}`}>
                <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg shadow-lg shadow-rose-500/20">
                    <LayoutGrid className="text-white w-3.5 h-3.5" />
                </div>
                {mode === 'reels' && (
                  <span className="hidden md:block text-sm font-black tracking-tighter text-white">
                    Eat<span className="text-rose-500">D</span>
                  </span>
                )}
                {mode === 'posts' && (
                  <div className="flex flex-col ml-2">
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white leading-none">The <span className="text-[#00e054] italic serif lowercase">feed</span></h1>
                    <p className="text-[8px] md:text-[9px] uppercase font-black tracking-[0.2em] text-white/30 truncate mt-0.5">Regional Live Diary • {reviews.length} logs</p>
                  </div>
                )}
            </Link>

            {/* Toggle Group */}
            <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/5">
                <button 
                  onClick={() => updateMode('posts')}
                  className={`relative flex items-center justify-center gap-2 px-4 md:px-6 h-8 md:h-9 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all z-10 ${mode === 'posts' ? 'text-black' : 'text-white/40 hover:text-white'}`}
                >
                  {mode === 'posts' && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-[#00e054] rounded-full -z-10 shadow-lg shadow-[#00e054]/20"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <LayoutGrid size={12} className={mode === 'posts' ? 'text-black' : 'text-white/40'} />
                  <span>Posts</span>
                </button>
                <button 
                  onClick={() => updateMode('reels')}
                  className={`relative flex items-center justify-center gap-2 px-4 md:px-6 h-8 md:h-9 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all z-10 ${mode === 'reels' ? 'text-black' : 'text-white/40 hover:text-white'}`}
                >
                  {mode === 'reels' && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-[#00e054] rounded-full -z-10 shadow-lg shadow-[#00e054]/20"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <PlayCircle size={12} className={mode === 'reels' ? 'text-black' : 'text-white/40'} />
                  <span>Reels</span>
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {mode === 'posts' ? (
            <motion.div 
              key="posts"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <PostCard key={review.id} review={review} />
                ))
              ) : (
                <div className="py-32 text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
                   <Info className="w-12 h-12 text-white/10 mx-auto mb-4" />
                   <p className="text-white/40 italic serif text-lg px-12">The feed is silent. Be the first to break the stillness.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="reels"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center"
            >
                 <div className="h-full w-full max-w-[450px] relative shadow-[0_0_100px_rgba(0,0,0,0.8)] snap-y-container scrollbar-hide">
                    {reviews.length > 0 ? (
                        reviews.map(review => (
                            <ReelCard key={review.id} review={review} />
                        ))
                    ) : (
                        <div className="h-full flex items-center justify-center bg-zinc-950">
                            <p className="text-white/20 italic serif text-2xl uppercase tracking-tighter">No Reels gathered yet.</p>
                        </div>
                    )}
                 </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
