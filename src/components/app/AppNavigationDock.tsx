import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  MapPin, 
  Plus, 
  Clapperboard, 
  User, 
  Flame, 
  Sparkles, 
  Navigation, 
  Dna, 
  Trophy,
  Bookmark,
  Video
} from 'lucide-react';
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

  const isFeedActive = 
    location.pathname === '/app' || 
    location.pathname === '/app/';

  const isRadarActive = 
    location.pathname.startsWith('/app/map') ||
    location.pathname.startsWith('/map');

  const isCravingsActive = 
    location.pathname.startsWith('/app/cravings') ||
    location.pathname.startsWith('/cravings');

  const isProfileActive = 
    location.pathname.startsWith('/app/profile') || 
    location.pathname.startsWith('/profile');

  const profilePath = user ? `/app/profile/${dishdUser?.username || user.uid}` : '/app';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] lg:hidden">
        <div className="max-w-sm sm:max-w-md mx-auto px-3 sm:px-4">
          <div className="w-full bg-zinc-950/90 backdrop-blur-2xl border border-white/12 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.85)] pointer-events-auto px-1.5 py-1.5 flex items-center justify-between relative select-none touch-manipulation">
            
            {/* 1. Home Feed */}
            <Link
              to="/app"
              onClick={() => triggerHaptic()}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all active:scale-90 relative ${
                isFeedActive ? 'text-orange-400' : 'text-white/45 hover:text-white'
              }`}
            >
              <Home size={20} className={isFeedActive ? 'fill-orange-400/20 stroke-[2.5]' : 'stroke-[1.75]'} />
              <span className="text-[9px] font-bold tracking-tight mt-0.5">Feed</span>
              {isFeedActive && (
                <motion.div 
                  layoutId="dockActiveDot"
                  className="w-1 h-1 rounded-full bg-orange-500 absolute -bottom-0.5 shadow-[0_0_6px_rgba(249,115,22,1)]"
                />
              )}
            </Link>

            {/* 2. Food Radar (Live Map) */}
            <Link
              to="/app/map"
              onClick={() => triggerHaptic()}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all active:scale-90 relative ${
                isRadarActive ? 'text-orange-400' : 'text-white/45 hover:text-white'
              }`}
            >
              <div className="relative">
                <MapPin size={20} className={isRadarActive ? 'fill-orange-400/20 stroke-[2.5]' : 'stroke-[1.75]'} />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              </div>
              <span className="text-[9px] font-bold tracking-tight mt-0.5">Radar</span>
              {isRadarActive && (
                <motion.div 
                  layoutId="dockActiveDot"
                  className="w-1 h-1 rounded-full bg-orange-500 absolute -bottom-0.5 shadow-[0_0_6px_rgba(249,115,22,1)]"
                />
              )}
            </Link>

            {/* 3. CENTER CREATE BUTTON (+) */}
            <div className="relative -mt-6 px-1 shrink-0">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => {
                  triggerHaptic();
                  if (!user) {
                    login();
                    return;
                  }
                  setShowActionMenu(!showActionMenu);
                }}
                className="w-13 h-13 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-pink-500 text-black flex items-center justify-center shadow-[0_0_24px_rgba(249,115,22,0.45)] border-2 border-black active:shadow-none transition-all cursor-pointer"
                title="Create or Log"
              >
                <Plus size={26} className={`transition-transform duration-300 stroke-[3] ${showActionMenu ? 'rotate-45' : ''}`} />
              </motion.button>
            </div>

            {/* 4. Cravings (Video Reels) */}
            <Link
              to="/app/cravings"
              onClick={() => triggerHaptic()}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all active:scale-90 relative ${
                isCravingsActive ? 'text-orange-400' : 'text-white/45 hover:text-white'
              }`}
            >
              <Clapperboard size={20} className={isCravingsActive ? 'fill-orange-400/20 stroke-[2.5]' : 'stroke-[1.75]'} />
              <span className="text-[9px] font-bold tracking-tight mt-0.5">Cravings</span>
              {isCravingsActive && (
                <motion.div 
                  layoutId="dockActiveDot"
                  className="w-1 h-1 rounded-full bg-orange-500 absolute -bottom-0.5 shadow-[0_0_6px_rgba(249,115,22,1)]"
                />
              )}
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
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all active:scale-90 cursor-pointer relative ${
                isProfileActive ? 'text-orange-400' : 'text-white/45 hover:text-white'
              }`}
            >
              {user?.photoURL ? (
                <div className={`w-5.5 h-5.5 rounded-full p-0.5 border transition-all ${
                  isProfileActive ? 'border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'border-white/30'
                }`}>
                  <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </div>
              ) : (
                <User size={20} className={isProfileActive ? 'fill-orange-400/20 stroke-[2.5]' : 'stroke-[1.75]'} />
              )}
              <span className="text-[9px] font-bold tracking-tight mt-0.5">Profile</span>
              {isProfileActive && (
                <motion.div 
                  layoutId="dockActiveDot"
                  className="w-1 h-1 rounded-full bg-orange-500 absolute -bottom-0.5 shadow-[0_0_6px_rgba(249,115,22,1)]"
                />
              )}
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
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, y: 120, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 120, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto bg-zinc-950 border border-white/15 rounded-3xl p-4 shadow-2xl z-[210] text-white"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              
              <div className="space-y-2">
                {/* 1. Log an Eat */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsLogModalOpen(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Plus size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Log an Eat / Try</span>
                    <span className="text-[10px] text-white/50">Save dish review with ratings, notes & photo</span>
                  </div>
                </button>

                {/* 2. Post a Video Craving Reel */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsCravingModalOpen(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <Video size={20} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Post Craving Reel</span>
                    <span className="text-[10px] text-white/50">Share short vertical food video or bite reaction</span>
                  </div>
                </button>

                {/* 3. Craving Matcher */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsMatcherOpen(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                    <Flame size={20} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Craving Matcher</span>
                    <span className="text-[10px] text-white/50">Swipe dishes solo or live with friends</span>
                  </div>
                </button>

                {/* 4. Food Crawls & Trails */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    navigate('/app/trails');
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Navigation size={20} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Food Crawls & Trails</span>
                    <span className="text-[10px] text-white/50">Explore curated multi-stop food itineraries</span>
                  </div>
                </button>

                {/* 5. Food Lists */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    navigate('/app/lists');
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Bookmark size={20} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Food Lists & Guides</span>
                    <span className="text-[10px] text-white/50">Curated bucket lists and saved culinary spots</span>
                  </div>
                </button>

                {/* 6. Taste DNA Quiz */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsQuizOpen(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 active:scale-98 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Dna size={20} />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">Taste DNA Quiz</span>
                    <span className="text-[10px] text-white/50">Discover your unique flavor fingerprint</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Associated Modals */}
      <LogMealModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
      />

      <CravingUploadModal
        isOpen={isCravingModalOpen}
        onClose={() => setIsCravingModalOpen(false)}
      />

      <CravingMatcherModal 
        isOpen={isMatcherOpen} 
        onClose={() => setIsMatcherOpen(false)} 
      />

      <TasteQuizModal 
        isOpen={isQuizOpen} 
        onClose={() => setIsQuizOpen(false)} 
      />

      <CriticQuestsModal
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
      />

      {/* Quick Action Drawer */}
      <QuickActionDrawer
        onOpenLogMeal={() => setIsLogModalOpen(true)}
        onOpenCravingMatcher={() => setIsMatcherOpen(true)}
        onOpenTrails={() => navigate('/app/trails')}
        onOpenTasteQuiz={() => setIsQuizOpen(true)}
        onOpenQuests={() => setIsQuestsOpen(true)}
      />
    </>
  );
}

