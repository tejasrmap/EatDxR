import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Search, Plus, User, LayoutGrid } from 'lucide-react';
import { useAuth } from '../App';
import { LogMealModal } from './LogMealModal';
import { ReelUploadModal } from './ReelUploadModal';
import { motion, AnimatePresence } from 'motion/react';
import { Film } from 'lucide-react';

export function MobileBottomNav() {
  const location = useLocation();
  const { user, dishdUser, login } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  React.useEffect(() => {
    const handleStateChange = (e: any) => {
      const { isOpen } = e.detail;
      setIsHidden(isOpen);
    };

    window.addEventListener('MODAL_OPEN_STATE_CHANGE', handleStateChange);
    return () => window.removeEventListener('MODAL_OPEN_STATE_CHANGE', handleStateChange);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[50] pointer-events-none transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="w-full bg-[#111111] border-t-4 border-[#333333] shadow-[0px_-4px_0px_#ccff00] pointer-events-auto relative group">
          <div className="flex items-center justify-around h-16 relative z-10">
            <Link 
              to="/restaurants" 
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${isActive('/restaurants') ? 'text-[#ccff00]' : 'text-white/40 hover:text-white'}`}
            >
              <Compass size={20} className={isActive('/restaurants') ? "fill-[#ccff00]/20" : ""} />
              <span className="text-[8px] font-black uppercase tracking-widest">Explore</span>
            </Link>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_GLOBAL_SEARCH'))}
              className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-all active:translate-y-0.5"
            >
              <Search size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest">Search</span>
            </button>

            <div className="relative -mt-10">
              <button 
                onClick={() => {
                   if (!user) { login(); return; }
                   setShowActionMenu(!showActionMenu);
                }}
                className="w-14 h-14 bg-[#ccff00] rounded-none flex items-center justify-center shadow-[4px_4px_0px_#ff00ff] border-4 border-[#333333] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all group/btn"
              >
                <Plus size={24} className={`text-black transition-transform duration-300 ${showActionMenu ? 'rotate-45' : 'group-hover/btn:rotate-90'}`} />
              </button>

              <AnimatePresence>
                {showActionMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowActionMenu(false)}
                      className="fixed inset-0 bg-black/80 z-[340]"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 0.8 }}
                      className="fixed bottom-24 left-4 right-4 bg-[#111111] border-4 border-[#333333] rounded-none shadow-[8px_8px_0px_#00ffff] py-4 z-[350] overflow-hidden will-change-transform"
                    >
                      <div className="px-8 py-3 border-b border-white/5 mb-2">
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30 text-center block">Integrate Narrative</span>
                      </div>
                      
                      <div className="px-4 space-y-3">
                        <button
                          onClick={() => { setIsReelModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-6 px-6 py-5 bg-[#000000] border-2 border-[#333333] shadow-[2px_2px_0px_#ff00ff] hover:translate-y-0.5 hover:shadow-none transition-all text-sm font-black uppercase tracking-widest text-white group rounded-none"
                        >
                          <div className="w-12 h-12 rounded-none bg-black border-2 border-[#ff00ff] flex items-center justify-center transition-colors shadow-[2px_2px_0px_#ff00ff]">
                            <Film size={22} className="text-[#ff00ff]" />
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <span className="group-hover:text-[#ff00ff] transition-colors">Reel Narrative</span>
                            <span className="text-[8px] text-white/40">Upload media</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { setIsLogModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-6 px-6 py-5 bg-[#000000] border-2 border-[#333333] shadow-[2px_2px_0px_#ccff00] hover:translate-y-0.5 hover:shadow-none transition-all text-sm font-black uppercase tracking-widest text-white group rounded-none"
                        >
                          <div className="w-12 h-12 rounded-none bg-black border-2 border-[#ccff00] flex items-center justify-center transition-colors shadow-[2px_2px_0px_#ccff00]">
                            <Plus size={24} className="text-[#ccff00]" />
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <span className="group-hover:text-[#ccff00] transition-colors">Culinary Log</span>
                            <span className="text-[8px] text-white/40">Log an experience</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <Link 
              to="/journal" 
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${isActive('/journal') ? 'text-[#ccff00]' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid size={20} className={isActive('/journal') ? "fill-[#ccff00]/20" : ""} />
              <span className="text-[8px] font-black uppercase tracking-widest">Feed</span>
            </Link>

             <Link 
              to={user ? `/profile/${dishdUser?.username || user.uid}` : "/"} 
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${location.pathname.startsWith('/profile') ? 'text-[#ccff00]' : 'text-white/40 hover:text-white'}`}
            >
              {user ? (
                 <div className={`w-6 h-6 rounded-none overflow-hidden border-2 ${location.pathname.startsWith('/profile') ? 'border-[#ccff00]' : 'border-white/20'}`}>
                    <img src={dishdUser?.photoURL || user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                 </div>
              ) : (
                 <User size={20} />
              )}
              <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
            </Link>
          </div>
        </div>
      </div>

      <LogMealModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
      />

      <ReelUploadModal
        isOpen={isReelModalOpen}
        onClose={() => setIsReelModalOpen(false)}
      />
    </>
  );
}
