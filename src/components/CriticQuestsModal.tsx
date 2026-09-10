import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trophy, Flame, Award, ShieldCheck, Star, 
  Sparkles, ChevronRight, UserCheck, UserPlus, Zap
} from 'lucide-react';
import { CriticQuestBadge, CriticLeaderboardRank } from '../types';
import { triggerHaptic } from '../services/nativeService';
import { toast } from 'sonner';

export const INITIAL_QUEST_BADGES: CriticQuestBadge[] = [
  {
    id: 'badge_spice',
    title: 'Spice Samurai',
    icon: '🌶️',
    description: 'Review 3+ high-heat dishes with detailed spice breakdown.',
    category: 'taste',
    progressCurrent: 3,
    progressTarget: 3,
    isUnlocked: true,
    rarity: 'Epic',
    unlockedAt: 'Sep 2026',
  },
  {
    id: 'badge_midnight',
    title: 'Midnight Wanderer',
    icon: '🌙',
    description: 'Log 3 dining experiences past 11:00 PM.',
    category: 'explorer',
    progressCurrent: 2,
    progressTarget: 3,
    isUnlocked: false,
    rarity: 'Rare',
  },
  {
    id: 'badge_mustorder',
    title: 'Must-Order Legend',
    icon: '👑',
    description: 'Discover and tag 5 official Must-Order dishes.',
    category: 'expert',
    progressCurrent: 5,
    progressTarget: 5,
    isUnlocked: true,
    rarity: 'Legendary',
    unlockedAt: 'Aug 2026',
  },
  {
    id: 'badge_coffee',
    title: 'Cafe Aficionado',
    icon: '☕',
    description: 'Review 4 specialty roasters and artisan bakeries.',
    category: 'taste',
    progressCurrent: 2,
    progressTarget: 4,
    isUnlocked: false,
    rarity: 'Rare',
  },
  {
    id: 'badge_trail',
    title: 'Food Trailblazer',
    icon: '🗺️',
    description: 'Complete all stops in a curated Food Crawl.',
    category: 'explorer',
    progressCurrent: 1,
    progressTarget: 1,
    isUnlocked: true,
    rarity: 'Epic',
    unlockedAt: 'Sep 2026',
  },
  {
    id: 'badge_photo',
    title: 'Food Paparazzi',
    icon: '📸',
    description: 'Upload 10 high-resolution food logs.',
    category: 'social',
    progressCurrent: 8,
    progressTarget: 10,
    isUnlocked: false,
    rarity: 'Common',
  },
];

export const CITY_TOP_CRITICS: CriticLeaderboardRank[] = [
  {
    rank: 1,
    userId: 'critic_1',
    displayName: 'Chef Rahul',
    username: 'chef_rahul',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    criticLevel: 'Madeater Top Critic',
    credibilityScore: 98,
    reviewsCount: 142,
    mustOrdersDiscovered: 38,
    badgesCount: 12,
    city: 'Bangalore',
    topCuisine: 'Modern Coastal',
  },
  {
    rank: 2,
    userId: 'critic_2',
    displayName: 'Ananya Sharma',
    username: 'ananyaeats',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    criticLevel: 'Verified Critic',
    credibilityScore: 95,
    reviewsCount: 98,
    mustOrdersDiscovered: 24,
    badgesCount: 9,
    city: 'Bangalore',
    topCuisine: 'Heritage Mughlai',
  },
  {
    rank: 3,
    userId: 'critic_3',
    displayName: 'Vikram Mehta',
    username: 'vikram_brew',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    criticLevel: 'Food Critic',
    credibilityScore: 92,
    reviewsCount: 64,
    mustOrdersDiscovered: 16,
    badgesCount: 7,
    city: 'Bangalore',
    topCuisine: 'Specialty Coffee',
  },
  {
    rank: 4,
    userId: 'critic_4',
    displayName: 'Priya Rao',
    username: 'priyaspice',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    criticLevel: 'Food Critic',
    credibilityScore: 89,
    reviewsCount: 47,
    mustOrdersDiscovered: 11,
    badgesCount: 6,
    city: 'Bangalore',
    topCuisine: 'South Indian Tiffin',
  },
];

interface CriticQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: (userId: string) => void;
}

export function CriticQuestsModal({ isOpen, onClose, onOpenProfile }: CriticQuestsModalProps) {
  const [activeTab, setActiveTab] = useState<'quests' | 'leaderboard'>('quests');
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleFollow = (userId: string) => {
    triggerHaptic();
    setFollowingState((prev) => {
      const next = !prev[userId];
      toast.success(next ? 'Critic followed!' : 'Unfollowed');
      return { ...prev, [userId]: next };
    });
  };

  const unlockedCount = INITIAL_QUEST_BADGES.filter((b) => b.isUnlocked).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-y-auto"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Trophy size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Critic Prestige</h3>
                <p className="text-[10px] text-white/50">Quests, Badges & City Ranks</p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic();
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 my-3 p-1 rounded-2xl bg-zinc-900 border border-white/10">
            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab('quests');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'quests'
                  ? 'bg-orange-500 text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Quests & Badges ({unlockedCount}/{INITIAL_QUEST_BADGES.length})
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab('leaderboard');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-orange-500 text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              City Top 10
            </button>
          </div>

          {/* TAB 1: QUESTS & BADGES */}
          {activeTab === 'quests' && (
            <div className="space-y-4">
              {/* Level Progress Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/60 to-zinc-900 border border-orange-500/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
                    <Award size={12} /> Critic Level 3
                  </span>
                  <span className="text-[10px] text-white/60 font-mono">18 / 25 Reviews</span>
                </div>
                <h4 className="text-sm font-black text-white">Verified Food Critic</h4>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full w-[72%]" />
                </div>
                <p className="text-[10px] text-white/50 mt-1.5">
                  7 more verified reviews to unlock <span className="text-amber-400 font-bold">Madeater Top Critic</span>.
                </p>
              </div>

              {/* Badges Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-white/60">
                  Unlockable Quests
                </h4>

                {INITIAL_QUEST_BADGES.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      badge.isUnlocked
                        ? 'bg-zinc-900/80 border-orange-500/30'
                        : 'bg-zinc-950 border-white/10 opacity-70'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-inner">
                      {badge.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                          {badge.title}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                              badge.rarity === 'Legendary'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : badge.rarity === 'Epic'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-white/10 text-white/70'
                            }`}
                          >
                            {badge.rarity}
                          </span>
                        </h5>
                        {badge.isUnlocked ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-white/50">
                            {badge.progressCurrent}/{badge.progressTarget}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-white/60 mt-0.5 line-clamp-1">{badge.description}</p>

                      {!badge.isUnlocked && (
                        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden mt-2">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{
                              width: `${(badge.progressCurrent / badge.progressTarget) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CITY LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-orange-400">Monthly Ranks</span>
                  <h4 className="text-xs font-bold text-white">Bangalore Top 10 Critics</h4>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-mono font-bold">
                  Sep 2026
                </span>
              </div>

              <div className="space-y-2">
                {CITY_TOP_CRITICS.map((critic) => {
                  const isFollowing = followingState[critic.userId];
                  return (
                    <div
                      key={critic.userId}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center gap-3"
                    >
                      {/* Rank Number */}
                      <div
                        className={`w-6 h-6 rounded-full text-black font-black text-xs flex items-center justify-center shrink-0 ${
                          critic.rank === 1
                            ? 'bg-amber-400'
                            : critic.rank === 2
                            ? 'bg-slate-300'
                            : critic.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-zinc-800 text-white/60'
                        }`}
                      >
                        {critic.rank}
                      </div>

                      {/* Avatar */}
                      <img
                        src={critic.photoURL}
                        alt={critic.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h5 className="text-xs font-bold text-white truncate">{critic.displayName}</h5>
                          <ShieldCheck size={12} className="text-amber-400 shrink-0" />
                        </div>
                        <p className="text-[10px] text-white/50">{critic.topCuisine}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-white/70 font-mono">
                          <span>{critic.reviewsCount} logs</span>
                          <span>•</span>
                          <span className="text-orange-400 font-bold">{critic.credibilityScore} Cred</span>
                        </div>
                      </div>

                      {/* Follow Button */}
                      <button
                        onClick={() => toggleFollow(critic.userId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isFollowing
                            ? 'bg-white/10 text-white/70'
                            : 'bg-orange-500 text-black font-black shadow-md'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
