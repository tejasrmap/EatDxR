import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Medal, Star, Users, Loader2, Award, TrendingUp } from "lucide-react";

export function Critics() {
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
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col items-center text-center mb-16 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#ff8000]/10 via-transparent to-transparent blur-3xl rounded-full opacity-50 w-3/4 mx-auto h-64" />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
        >
          <TrendingUp size={14} className="text-[#ff8000]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#ff8000]">Live Rankings</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="title-text serif mb-4"
        >
          Top Critics
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 max-w-lg mx-auto text-lg leading-relaxed"
        >
          The most prolific and trusted voices in the culinary community. Ranked by total reviews written.
        </motion.p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00e054]" />
          <p className="text-sm font-bold uppercase tracking-widest text-white/40 animate-pulse">Ranking Foodies...</p>
        </div>
      ) : critics.length > 0 ? (
        <div className="space-y-4 relative">
          <AnimatePresence>
            {critics.map((critic, index) => {
              const isTopThree = index < 3;
              const rankColorClasses = getRankColor(index).split(' ');
              const rankBorderClass = rankColorClasses.find(c => c.startsWith('border-')) || 'border-white/5';
              const rankTextClass = rankColorClasses.find(c => c.startsWith('text-')) || 'text-white/40';
              const rankGradientFromNode = rankColorClasses.find(c => c.startsWith('from-')) || 'from-white/10';
              const rankGradientToNode = rankColorClasses.find(c => c.startsWith('to-')) || 'to-white/5';
              
              return (
                <motion.div
                  key={critic.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <Link
                    to={`/profile/${critic.uid}`}
                    className={`block relative overflow-hidden rounded-2xl border ${rankBorderClass} bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:bg-white/5 group`}
                  >
                    {isTopThree && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${rankGradientFromNode} ${rankGradientToNode} opacity-5 group-hover:opacity-10 transition-opacity`} />
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 relative z-10 w-full">
                      <div className="flex items-center justify-center w-12 shrink-0">
                        {getRankMedal(index)}
                      </div>

                      <div className="relative shrink-0">
                        <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${rankGradientFromNode} ${rankGradientToNode} opacity-20 blur-sm group-hover:opacity-40 transition-opacity`} />
                        <img
                          src={critic.photoURL || `https://ui-avatars.com/api/?name=${critic.displayName || 'User'}&background=random`}
                          alt={critic.displayName}
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 ${isTopThree ? rankBorderClass : 'border-white/10'} shadow-xl`}
                          referrerPolicy="no-referrer"
                        />
                        {isTopThree && (
                          <div className="absolute -bottom-2 -right-2 bg-black rounded-full p-1 border border-white/10">
                            <Award size={16} className={rankTextClass} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold truncate group-hover:text-white transition-colors mb-1">
                          {critic.displayName}
                        </h2>
                        {critic.bio && (
                          <p className="text-sm text-white/50 truncate mb-3 italic serif">
                            "{critic.bio}"
                          </p>
                        )}
                        {critic.favoriteCuisines && critic.favoriteCuisines.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            {critic.favoriteCuisines.slice(0, 3).map((cuisine, i) => (
                              <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-white/5 text-white/60 border border-white/5">
                                {cuisine}
                              </span>
                            ))}
                            {critic.favoriteCuisines.length > 3 && (
                              <span className="text-[10px] font-bold text-white/40">+{critic.favoriteCuisines.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-8 bg-black/40 px-6 py-4 rounded-xl border border-white/5 shrink-0 mt-4 sm:mt-0">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1 text-white/40">
                            <Star size={14} className={isTopThree ? rankTextClass : ""} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Reviews</span>
                          </div>
                          <span className={`text-2xl font-black ${isTopThree ? rankTextClass : 'text-white'}`}>
                            {critic.stats?.reviewsWritten || 0}
                          </span>
                        </div>
                        
                        <div className="w-px h-8 bg-white/10" />
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1 text-white/40">
                            <Users size={14} className={index === 0 ? "text-blue-400" : ""} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Followers</span>
                          </div>
                          <span className="text-xl font-bold text-white/80">
                            {critic.stats?.followers || 0}
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
        <div className="py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
          <Award className="w-16 h-16 mx-auto text-white/10 mb-6" />
          <h3 className="text-xl font-bold mb-2">No critics found yet</h3>
          <p className="text-white/40 italic serif max-w-sm mx-auto">
            The leaderboard is empty. Be the first to log a meal and claim the top spot!
          </p>
        </div>
      )}
    </div>
  );
}
