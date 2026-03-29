import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Review } from "../types";
import { Link } from "react-router-dom";
import { Loader2, LayoutGrid, PlayCircle, Info } from "lucide-react";
import { PostCard } from "./PostCard";
import { ReelCard } from "./ReelCard";
import { motion, AnimatePresence } from "motion/react";

type FeedMode = 'posts' | 'reels';

export const Journal: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FeedMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('mode') as FeedMode) || 'posts';
  });

  const updateMode = (newMode: FeedMode) => {
    setMode(newMode);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    window.history.replaceState({}, '', url.toString());
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
      
      {/* Feed Toggle Header - Adjusted for Posts vs Reels */}
      <div className={`flex items-center justify-between transition-all duration-500 z-[110] ${mode === 'reels' ? 'fixed top-6 left-0 right-0 justify-center px-6' : 'relative mb-8'}`}>
        <div className={`flex flex-col transition-all duration-500 ${mode === 'reels' ? 'opacity-0 scale-90 absolute left-6' : 'opacity-100 scale-100'}`}>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">The <span className="text-[#00e054] italic serif lowercase">feed</span></h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/30 truncate max-w-[150px]">Regional Live Diary • {reviews.length} logs</p>
        </div>

        <div className={`flex items-center bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-3xl shadow-2xl transition-all duration-500 ${mode === 'reels' ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}>
            <button 
              onClick={() => updateMode('posts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'posts' ? 'bg-[#00e054] text-black shadow-lg shadow-[#00e054]/20 scale-105' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid size={12} />
              Posts
            </button>
            <button 
              onClick={() => updateMode('reels')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'reels' ? 'bg-[#00e054] text-black shadow-lg shadow-[#00e054]/20 scale-105' : 'text-white/40 hover:text-white'}`}
            >
              <PlayCircle size={12} />
              Reels
            </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {mode === 'posts' ? (
            <motion.div 
              key="posts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
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
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed inset-0 z-50 bg-black pt-0 pb-20"
            >
                 <div className="h-full snap-y-container scrollbar-hide">
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
