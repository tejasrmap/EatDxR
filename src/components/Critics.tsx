import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Medal, Star, Users, Loader2, Award, TrendingUp, Search } from "lucide-react";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";

export function Critics() {
  const { getAppUrl } = useAppUrl();
  const [critics, setCritics] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("stats.reviewsWritten", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((doc) => doc.data() as User);
        setCritics(fetchedUsers);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "users");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "from-yellow-400 to-amber-600 shadow-yellow-500/20 border-yellow-500/50 text-yellow-400"; // Gold
      case 1:
        return "from-slate-300 to-slate-500 shadow-slate-400/20 border-slate-400/50 text-slate-300"; // Silver
      case 2:
        return "from-amber-700 to-orange-900 shadow-orange-900/20 border-orange-800/50 text-amber-600"; // Bronze
      default:
        return "from-white/10 to-white/5 border-white/5 text-white/40"; // Default
    }
  };

  const getRankMedal = (index: number) => {
    switch (index) {
      case 0:
        return <Medal size={28} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] flex-shrink-0" />;
      case 1:
        return <Medal size={24} className="text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.5)] flex-shrink-0" />;
      case 2:
        return <Medal size={20} className="text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)] flex-shrink-0" />;
      default:
        return <span className="font-bold text-lg text-white/20 w-8 text-center flex-shrink-0">{index + 1}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 elite-motion-safe">
      <div className="flex flex-col items-center text-center mb-24 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent blur-3xl rounded-full opacity-30 w-3/4 mx-auto h-96" />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-white/10 mb-8"
        >
          <TrendingUp size={14} className="text-orange-500" />
          <span className="small-caps text-orange-500">Global Leaderboard</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 1, ease: [0.19, 1, 0.22, 1] }}
          className="title-text mb-8"
        >
          Top Critics
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="text-white/40 max-w-xl mx-auto text-lg leading-relaxed mb-12 font-serif italic"
        >
          The most prolific and trusted voices in the culinary community. Ranked by their total gastronomic contributions.
        </motion.p>

        {/* Search Trigger */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="w-full max-w-lg mx-auto relative group flex items-center gap-4 px-6 py-4 bg-white/[0.03] border border-white/10 rounded-full cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all backdrop-blur-xl"
        >
          <Search size={18} className="text-white/20 group-hover:text-white/40 transition-colors" />
          <span className="text-sm text-white/20 group-hover:text-white/40 transition-colors font-medium">Find a critic by name or expertise...</span>
          <div className="ml-auto flex items-center gap-2 px-2.5 py-1 rounded bg-white/5 border border-white/10 small-caps text-[9px] text-white/20 tracking-normal">
            <span className="scale-110">⌘</span>K
          </div>
          <button 
            type="button"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            onClick={() => {
              window.dispatchEvent(new Event('OPEN_GLOBAL_SEARCH'));
            }} 
          />
        </motion.div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
          <Loader2 className="w-12 h-12 animate-spin text-white/10" />
          <p className="small-caps text-white/20 animate-pulse">Ranking Foodies...</p>
        </div>
      ) : critics.length > 0 ? (
        <div className="space-y-6 relative">
          <AnimatePresence>
            {critics.map((critic, index) => {
              const isTopThree = index < 3;
              const rankColorClasses = getRankColor(index).split(' ');
              const rankBorderClass = rankColorClasses.find(c => c.startsWith('border-')) || 'border-white/5';
              const rankTextClass = rankColorClasses.find(c => c.startsWith('text-')) || 'text-white/20';
              const rankGradientFromNode = rankColorClasses.find(c => c.startsWith('from-')) || 'from-white/10';
              const rankGradientToNode = rankColorClasses.find(c => c.startsWith('to-')) || 'to-white/5';
              
              return (
                <motion.div
                  key={critic.uid}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.05, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                >
                  <Link
                    to={getAppUrl(`/profile/${critic.uid}`)}
                    onClick={() => triggerHaptic()}
                    className={`block relative overflow-hidden rounded-3xl border ${isTopThree ? rankBorderClass : 'border-white/5'} bg-zinc-950/40 backdrop-blur-3xl transition-all duration-500 hover:bg-white/[0.03] group hover:-translate-y-1 shadow-2xl active:scale-[0.99] touch-manipulation`}
                  >
                    {isTopThree && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${rankGradientFromNode} ${rankGradientToNode} opacity-5 group-hover:opacity-10 transition-opacity`} />
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-8 p-8 sm:p-10 relative z-10 w-full text-center sm:text-left">
                      <div className="flex items-center justify-center w-14 shrink-0">
                        {getRankMedal(index)}
                      </div>

                      <div className="relative shrink-0">
                        <div className={`absolute -inset-2 rounded-full bg-gradient-to-br ${rankGradientFromNode} ${rankGradientToNode} opacity-10 blur-md group-hover:opacity-30 transition-opacity`} />
                        <img
                          src={critic.photoURL || `https://ui-avatars.com/api/?name=${critic.displayName || 'User'}&background=random`}
                          alt={critic.displayName}
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 shadow-2xl transition-all duration-700 ${isTopThree ? rankBorderClass : 'border-white/10'}`}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        {isTopThree && (
                          <div className="absolute -bottom-2 -right-2 bg-zinc-950 rounded-full p-1.5 border border-white/10 shadow-xl">
                            <Award size={18} className={rankTextClass} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-2xl md:text-4xl font-extrabold text-white group-hover:text-accent transition-colors mb-2 tracking-tight">
                          {critic.displayName}
                        </h2>
                        {critic.bio && (
                          <p className="text-[15px] text-white/40 line-clamp-1 mb-4 italic font-serif leading-relaxed">
                            "{critic.bio}"
                          </p>
                        )}
                        {critic.favoriteCuisines && critic.favoriteCuisines.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                            {critic.favoriteCuisines.slice(0, 3).map((cuisine, i) => (
                              <span key={i} className="small-caps text-[9px] text-white/30 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]">
                                {cuisine}
                              </span>
                            ))}
                            {critic.favoriteCuisines.length > 3 && (
                              <span className="small-caps text-[9px] text-white/10">+{critic.favoriteCuisines.length - 3} More</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-10 bg-white/[0.02] px-8 py-5 rounded-2xl border border-white/5 shrink-0 mt-6 sm:mt-0">
                        <div className="text-center">
                          <p className="small-caps text-[9px] text-white/20 mb-2">Entries</p>
                          <span className={`text-3xl md:text-4xl font-extrabold tracking-tighter ${isTopThree ? rankTextClass : 'text-white'}`}>
                            {critic.stats?.reviewsWritten || 0}
                          </span>
                        </div>
                        
                        <div className="w-px h-10 bg-white/5" />
                        
                        <div className="text-center">
                          <p className="small-caps text-[9px] text-white/20 mb-2">Follows</p>
                          <span className="text-2xl font-bold text-white/60">
                            {critic.stats?.followers ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-40 text-center glass-panel border-dashed border-white/10 max-w-2xl mx-auto p-12">
          <Award className="w-16 h-16 mx-auto text-white/5 mb-8" />
          <h3 className="text-2xl font-bold mb-4">No critics found yet</h3>
          <p className="text-white/30 italic font-serif text-lg leading-relaxed">
            The leaderboard is empty. Be the first to claim your status and log a meal today!
          </p>
        </div>
      )}
    </div>
  );
}
