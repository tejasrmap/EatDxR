import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Flame, Navigation, Dna, Trophy, Wifi, WifiOff, 
  Sparkles, RefreshCw, X, ChevronUp, ChevronRight
} from 'lucide-react';
import { offlineSyncService } from '../services/offlineSyncService';
import { triggerHaptic } from '../services/nativeService';
import { toast } from 'sonner';

interface QuickActionDrawerProps {
  onOpenLogMeal: () => void;
  onOpenCravingMatcher: () => void;
  onOpenTrails: () => void;
  onOpenTasteQuiz: () => void;
  onOpenQuests: () => void;
}

export function QuickActionDrawer({
  onOpenLogMeal,
  onOpenCravingMatcher,
  onOpenTrails,
  onOpenTasteQuiz,
  onOpenQuests,
}: QuickActionDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(offlineSyncService.getOnlineStatus());
  const [pendingCount, setPendingCount] = useState(offlineSyncService.getQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = offlineSyncService.subscribe((online) => {
      setIsOnline(online);
      setPendingCount(offlineSyncService.getQueue().length);
    });
    return () => unsub();
  }, []);

  const handleManualSync = async () => {
    triggerHaptic();
    setIsSyncing(true);
    const res = await offlineSyncService.syncPendingLogs();
    setIsSyncing(false);
    setPendingCount(offlineSyncService.getQueue().length);
    if (res.success > 0) {
      toast.success(`Successfully synced ${res.success} pending dining logs!`);
    } else if (res.failed > 0) {
      toast.error(`Sync failed for ${res.failed} items.`);
    } else {
      toast.info('All logs are up to date.');
    }
  };

  return (
    <>
      {/* Offline Status Badge (Visible when offline or items pending) */}
      {(!isOnline || pendingCount > 0) && (
        <div className="fixed top-3 inset-x-4 z-[200] max-w-sm mx-auto">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`p-2.5 rounded-2xl backdrop-blur-xl border flex items-center justify-between text-xs shadow-xl ${
              !isOnline
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-200'
                : 'bg-zinc-900/90 border-white/10 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <WifiOff size={15} className="text-amber-400 shrink-0" />
              ) : (
                <Wifi size={15} className="text-emerald-400 shrink-0" />
              )}
              <span className="font-bold">
                {!isOnline ? 'Offline Dining Mode' : `${pendingCount} offline logs pending`}
              </span>
            </div>

            {isOnline && pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-2.5 py-1 rounded-lg bg-orange-500 text-black font-black text-[10px] uppercase flex items-center gap-1"
              >
                <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                <span>Sync Now</span>
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* Floating Action Button (Top Right / Bottom Dock Access) */}
      <button
        onClick={() => {
          triggerHaptic();
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full bg-zinc-900/90 border border-white/20 text-orange-400 backdrop-blur-xl shadow-xl flex items-center justify-center active:scale-90 hover:scale-105 transition-all cursor-pointer"
        title="Quick Foodie Hub"
      >
        <Sparkles size={18} />
      </button>

      {/* Full Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[260] bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: 250, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 250, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-[270] max-w-md mx-auto bg-zinc-950 border-t border-white/15 rounded-t-[32px] p-5 pb-8 shadow-2xl text-white"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Madeater Shortcuts</span>
                  <h3 className="text-base font-black text-white">Quick Foodie Hub</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid of Marquee Shortcuts */}
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsOpen(false);
                    onOpenLogMeal();
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 flex items-center gap-3 active:scale-98 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-black flex items-center justify-center font-black">
                    <Plus size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                      Quick Log Meal
                    </h4>
                    <p className="text-[10px] text-white/50">Rate dishes with Must-Order tags (works offline)</p>
                  </div>
                  <ChevronRight size={16} className="text-white/30 group-hover:text-white" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsOpen(false);
                    onOpenCravingMatcher();
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 flex items-center gap-3 active:scale-98 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Flame size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">
                      Group Craving Matcher
                    </h4>
                    <p className="text-[10px] text-white/50">Swipe dishes solo or with friends to pick dinner</p>
                  </div>
                  <ChevronRight size={16} className="text-white/30 group-hover:text-white" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsOpen(false);
                    onOpenTrails();
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 flex items-center gap-3 active:scale-98 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Navigation size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                      Food Crawls & Trails
                    </h4>
                    <p className="text-[10px] text-white/50">Curated multi-stop dining routes and stories</p>
                  </div>
                  <ChevronRight size={16} className="text-white/30 group-hover:text-white" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsOpen(false);
                    onOpenTasteQuiz();
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 flex items-center gap-3 active:scale-98 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Dna size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                      Taste DNA Quiz
                    </h4>
                    <p className="text-[10px] text-white/50">Calculate your flavor fingerprint & persona</p>
                  </div>
                  <ChevronRight size={16} className="text-white/30 group-hover:text-white" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsOpen(false);
                    onOpenQuests();
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 flex items-center gap-3 active:scale-98 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Trophy size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      Critic Quests & City Ranks
                    </h4>
                    <p className="text-[10px] text-white/50">Unlock prestige badges and see top critics</p>
                  </div>
                  <ChevronRight size={16} className="text-white/30 group-hover:text-white" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
