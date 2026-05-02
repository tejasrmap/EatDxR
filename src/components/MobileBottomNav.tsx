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
        <div className="w-full bg-background/90 backdrop-blur-xl border-t border-border shadow-2xl pointer-events-auto relative group">
          <div className="flex items-center justify-around h-16 relative z-10 px-2">
            <Link 
              to="/restaurants" 
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${isActive('/restaurants') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Compass size={20} className={isActive('/restaurants') ? "fill-foreground/20" : ""} />
              <span className="text-[10px] font-medium">Explore</span>
            </Link>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_GLOBAL_SEARCH'))}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-all active:translate-y-0.5"
            >
              <Search size={20} />
              <span className="text-[10px] font-medium">Search</span>
            </button>

            <div className="relative -mt-6">
              <button 
                onClick={() => {
                   if (!user) { login(); return; }
                   setShowActionMenu(!showActionMenu);
                }}
                className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all group/btn"
              >
                <Plus size={24} className={`text-background transition-transform duration-300 ${showActionMenu ? 'rotate-45' : ''}`} />
              </button>

              <AnimatePresence>
                {showActionMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowActionMenu(false)}
                      className="fixed inset-0 bg-background/80 z-[340]"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 0.8 }}
                      className="fixed bottom-24 left-4 right-4 bg-background/95 backdrop-blur-xl border border-border rounded-3xl shadow-2xl py-6 z-[350] overflow-hidden will-change-transform"
                    >
                      <div className="px-8 pb-4 mb-2 flex justify-center">
                        <div className="w-12 h-1 bg-border rounded-full" />
                      </div>
                      
                      <div className="px-4 space-y-3">
                        <button
                          onClick={() => { setIsReelModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-6 px-6 py-5 bg-muted/50 border border-border rounded-2xl hover:bg-muted transition-all text-sm font-medium text-foreground group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-colors">
                            <Film size={22} className="text-primary" />
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <span className="group-hover:text-foreground transition-colors">Reel Narrative</span>
                            <span className="text-xs text-muted-foreground">Upload media</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { setIsLogModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-6 px-6 py-5 bg-muted/50 border border-border rounded-2xl hover:bg-muted transition-all text-sm font-medium text-foreground group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center transition-colors">
                            <Plus size={24} className="text-accent" />
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <span className="group-hover:text-foreground transition-colors">Culinary Log</span>
                            <span className="text-xs text-muted-foreground">Log an experience</span>
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
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${isActive('/journal') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={20} className={isActive('/journal') ? "fill-foreground/20" : ""} />
              <span className="text-[10px] font-medium">Feed</span>
            </Link>

             <Link 
              to={user ? `/profile/${dishdUser?.username || user.uid}` : "/"} 
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${location.pathname.startsWith('/profile') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {user ? (
                 <div className={`w-6 h-6 rounded-full overflow-hidden border ${location.pathname.startsWith('/profile') ? 'border-foreground' : 'border-border'}`}>
                    <img src={dishdUser?.photoURL || user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                 </div>
              ) : (
                 <User size={20} />
              )}
              <span className="text-[10px] font-medium">Profile</span>
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
