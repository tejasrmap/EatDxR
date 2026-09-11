import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Compass, Plus, ListOrdered, User, Flame, Sparkles, Navigation, Dna, Trophy } from 'lucide-react';
import { useAuth } from '../../App';
import { LogMealModal } from '../LogMealModal';
import { CravingUploadModal } from '../CravingUploadModal';
import { CravingMatcherModal } from '../CravingMatcherModal';
import { TasteQuizModal } from '../TasteQuizModal';
import { CriticQuestsModal } from '../CriticQuestsModal';
import { QuickActionDrawer } from '../QuickActionDrawer';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../../services/nativeService';

export function AppNavigationDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, dishdUser, login } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const isExploreActive = 
    location.pathname.startsWith('/app/dishes') || 
    location.pathname.startsWith('/app/explore') || 
    location.pathname.startsWith('/app/restaurants') || 
    location.pathname.startsWith('/app/restaurant') || 
    location.pathname.startsWith('/app/dish') || 
    location.pathname.startsWith('/app/map') ||
    location.pathname.startsWith('/app/trails') ||
    location.pathname.startsWith('/dishes') ||
    location.pathname.startsWith('/restaurants') ||
    location.pathname.startsWith('/map');

  const isListsActive = 
    location.pathname.startsWith('/app/lists') || 
    location.pathname.startsWith('/app/list') ||
    location.pathname.startsWith('/lists') ||
    location.pathname.startsWith('/list');

  const isFeedActive = 
    location.pathname === '/app' || 
    location.pathname === '/app/' || 
    location.pathname === '/app/cravings';

  const isProfileActive = 
    location.pathname.startsWith('/app/profile') || 
    location.pathname.startsWith('/profile');

  const profilePath = user ? `/app/profile/${dishdUser?.username || user.uid}` : '/app';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom,6px)] lg:hidden">
        <div className="max-w-sm sm:max-w-md mx-auto px-3 sm:px-4 pb-1.5">
          <div className="w-full bg-zinc-950/92 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl pointer-events-auto p-1.5 flex items-center justify-between relative select-none touch-manipulation">
            
            {/* 1. Food Feed / Home */}
            <Link
              to="/app"
              onClick={() => triggerHaptic()}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all active:scale-95 ${
                isFeedActive ? 'text-orange-400' : 'text-white/40 hover:text-white'
              }`}
            >
              <LayoutGrid size={19} className={isFeedActive ? 'fill-orange-400/20 stroke-orange-400' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Food Feed</span>
            </Link>

            {/* 2. Explore / Radar */}
            <Link
              to="/app/dishes"
              onClick={() => triggerHaptic()}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all active:scale-95 ${
                isExploreActive ? 'text-orange-400' : 'text-white/40 hover:text-white'
              }`}
            >
              <Compass size={19} className={isExploreActive ? 'fill-orange-400/20 stroke-orange-400' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Explore</span>
            </Link>

            {/* 3. CENTER CREATE BUTTON (+) */}
            <div className="relative -mt-5 px-1 shrink-0">
              <button
                onClick={() => {
                  triggerHaptic();
                  if (!user) {
                    login();
                    return;
                  }
                  setShowActionMenu(!showActionMenu);
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-90 transition-all hover:scale-105 cursor-pointer"
                title="Log an Eat / Try"
              >
                <Plus size={24} className={`transition-transform duration-300 stroke-[3] ${showActionMenu ? 'rotate-45' : ''}`} />
              </button>
            </div>

            {/* 4. Food Lists */}
            <Link
              to="/app/lists"
              onClick={() => triggerHaptic()}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all active:scale-95 ${
                isListsActive ? 'text-orange-400' : 'text-white/40 hover:text-white'
              }`}
            >
              <ListOrdered size={19} className={isListsActive ? 'fill-orange-400/20 stroke-orange-400' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Food Lists</span>
            </Link>

            {/* 5. Profile */}
            <button
              onClick={() => {
                triggerHaptic();
                if (!user) {
                  login('/app/profile');
                } else {
                  navigate(profilePath);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all active:scale-95 cursor-pointer ${
                isProfileActive ? 'text-orange-400' : 'text-white/40 hover:text-white'
              }`}
            >
              <User size={19} className={isProfileActive ? 'fill-orange-400/20 stroke-orange-400' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Profile</span>
            </button>

          </div>
        </div>
      </nav>

      {/* Floating Action Modal Sheet */}
      <AnimatePresence>
        {showActionMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionMenu(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto bg-zinc-950 border border-white/15 rounded-3xl p-4 shadow-2xl z-[210] text-white"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsLogModalOpen(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Log an Eat / Try</span>
                    <span className="text-[10px] text-white/50">Save to your Food Diary with ratings & reviews</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsMatcherOpen(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Flame size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Group Craving Matcher</span>
                    <span className="text-[10px] text-white/50">Swipe dishes solo or with friends</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    navigate('/app/trails');
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Food Crawls & Trails</span>
                    <span className="text-[10px] text-white/50">Explore multi-stop food itineraries</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsQuizOpen(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Dna size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Taste DNA Quiz</span>
                    <span className="text-[10px] text-white/50">Calculate your flavor fingerprint</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsQuestsOpen(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Critic Quests & Ranks</span>
                    <span className="text-[10px] text-white/50">City Top 10 & prestige badges</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Action Drawer & Floating Shortcuts */}
      <QuickActionDrawer
        onOpenLogMeal={() => setIsLogModalOpen(true)}
        onOpenCravingMatcher={() => setIsMatcherOpen(true)}
        onOpenTrails={() => navigate('/app/trails')}
        onOpenTasteQuiz={() => setIsQuizOpen(true)}
        onOpenQuests={() => setIsQuestsOpen(true)}
      />

      {/* Modals for creating and discovering content */}
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <CravingUploadModal isOpen={isCravingModalOpen} onClose={() => setIsCravingModalOpen(false)} />
      <CravingMatcherModal isOpen={isMatcherOpen} onClose={() => setIsMatcherOpen(false)} />
      <TasteQuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
      <CriticQuestsModal isOpen={isQuestsOpen} onClose={() => setIsQuestsOpen(false)} />
    </>
  );
}

