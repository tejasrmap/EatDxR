import React, { useEffect, useState } from "react";
import { getReviews, subscribeToReviews } from "../services/supabaseService";
import { Review } from "../types";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, LayoutGrid, PlayCircle, Info, MapPin, Flame } from "lucide-react";
import { PostCard } from "./PostCard";
import { CravingCard } from "./CravingCard";
import { motion, AnimatePresence } from "motion/react";

type FeedMode = 'posts' | 'cravings';

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
    const sub = subscribeToReviews((fetchedReviews) => {
      if (fetchedReviews && fetchedReviews.length > 0) {
        setReviews(fetchedReviews);
        setLoading(false);
      } else {
        getReviews().then((revs) => {
          setReviews(revs || []);
          setLoading(false);
        }).catch(() => setLoading(false));
      }
    });

    return () => {
      sub?.unsubscribe();
    };
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
    <div className={`min-h-screen bg-black transition-all duration-500 ${mode === 'posts' ? 'pt-12 pb-32 px-4 md:px-6' : 'pt-0 pb-0 overflow-hidden'}`}>
      
      {/* Elegant Integrated Header - Centered Toggle */}
      <div className={`transition-all duration-500 z-[120] ${mode === 'cravings' ? 'fixed top-6 left-1/2 -translate-x-1/2 w-max max-w-[95vw] md:max-w-4xl' : 'relative mb-6'}`}>
        <div className={`flex items-center justify-center bg-black/40 border border-white/10 rounded-full p-1.5 backdrop-blur-3xl shadow-2xl transition-all duration-500 ${mode === 'cravings' ? 'px-1' : 'bg-transparent border-none backdrop-blur-none shadow-none'}`}>
            
            {/* Toggle Group */}
            <div className={`flex items-center bg-white/5 rounded-full p-0.5 border border-white/5 ${mode === 'posts' ? 'ml-0' : ''}`}>
                <button 
                  onClick={() => updateMode('posts')}
                  className={`relative flex items-center justify-center gap-2 px-4 md:px-6 h-8 md:h-9 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all z-10 ${mode === 'posts' ? 'text-black' : 'text-white/40 hover:text-white'}`}
                >
                  {mode === 'posts' && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-orange-500 rounded-full -z-10 shadow-lg shadow-orange-500/20"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <LayoutGrid size={12} className={mode === 'posts' ? 'text-black' : 'text-white/40'} />
                  <span>Posts</span>
                </button>
                <button 
                  onClick={() => updateMode('cravings')}
                  className={`relative flex items-center justify-center gap-2 px-4 md:px-6 h-8 md:h-9 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all z-10 ${mode === 'cravings' ? 'text-black' : 'text-white/40 hover:text-white'}`}
                >
                  {mode === 'cravings' && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-orange-500 rounded-full -z-10 shadow-lg shadow-orange-500/20"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <Flame size={12} className={mode === 'cravings' ? 'text-black fill-black' : 'text-orange-400'} />
                  <span>Cravings</span>
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
              transition={{ type: 'spring', stiffness: 500, damping: 45 }}
              className="space-y-8"
            >
              {/* Dynamic Page Header */}
              <div className="mb-8">
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight">
                  The <span className="text-orange-400 italic serif lowercase">feed</span>
                </h1>
                <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.3em] text-white/20 mt-2 ml-0.5">
                  Regional Live Diary • {reviews.length} logs
                </p>
              </div>

              {reviews.filter(r => !r.videoUrl).length > 0 ? (
                reviews.filter(r => !r.videoUrl).map(review => (
                  <PostCard key={review.id} review={review} />
                ))
              ) : (
                <div className="py-32 text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
                   <Info className="w-12 h-12 text-white/10 mx-auto mb-4" />
                   <p className="text-white/40 italic serif text-lg px-12">No photo logs gathered yet. Be the first to break the stillness.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="cravings"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ type: 'spring', stiffness: 500, damping: 45 }}
              className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
            >
                 <div className="h-svh md:h-[90vh] w-full max-w-6xl relative shadow-2xl snap-y-container scrollbar-hide md:rounded-3xl md:overflow-hidden">
                     {reviews.filter(r => !!r.videoUrl).length > 0 ? (
                        reviews.filter(r => !!r.videoUrl).map(review => (
                            <CravingCard key={review.id} review={review} />
                        ))
                    ) : (
                        <div className="h-full flex items-center justify-center bg-zinc-950">
                            <p className="text-white/20 italic serif text-2xl uppercase tracking-tighter">No Cravings gathered yet.</p>
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
