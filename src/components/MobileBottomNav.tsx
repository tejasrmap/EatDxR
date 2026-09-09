import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Search, Plus, User, LayoutGrid, Flame, Utensils, ListOrdered } from 'lucide-react';
import { useAuth } from '../App';
import { LogMealModal } from './LogMealModal';
import { CravingUploadModal } from './CravingUploadModal';
import { motion, AnimatePresence } from 'motion/react';

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, dishdUser, login } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
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
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[250] pointer-events-none transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="w-full bg-background/95 backdrop-blur-2xl border-t border-border shadow-2xl pointer-events-auto relative group">
          <div className="flex items-center justify-around h-16 relative z-10 px-2">
            
            {/* 1. Home Feed */}
            <Link 
              to="/" 
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${isActive('/') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={20} className={isActive('/') ? "fill-foreground/20" : ""} />
              <span className="text-[10px] font-bold">Feed</span>
            </Link>

            {/* 2. Discover Dishes & Venues */}
            <Link 
              to="/dishes" 
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${isActive('/dishes') || isActive('/restaurants') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Compass size={20} className={isActive('/dishes') ? "fill-foreground/20" : ""} />
              <span className="text-[10px] font-bold">Discover</span>
            </Link>

            {/* 3. Center Create Trigger */}
            <div className="relative -mt-6">
              <button 
                onClick={() => {
                   if (!user) { login(); return; }
                   setShowActionMenu(!showActionMenu);
                }}
                className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-105 active:scale-95 transition-all group/btn text-black"
                title="Create"
              >
                <Plus size={24} className={`transition-transform duration-300 ${showActionMenu ? 'rotate-45' : ''}`} />
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
                      className="fixed bottom-24 left-4 right-4 bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl py-6 z-[350] overflow-hidden text-white"
                    >
                      <div className="px-8 pb-4 mb-2 flex justify-center">
                        <div className="w-12 h-1 bg-white/20 rounded-full" />
                      </div>
                      
                      <div className="px-4 space-y-2.5">
                        <button
                          onClick={() => { setIsCravingModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-900 border border-white/10 rounded-2xl hover:bg-zinc-800 transition-all text-xs font-bold uppercase tracking-wider text-left text-white"
                        >
                          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                            <Flame size={20} />
                          </div>
                          <div>
                            <span className="block text-sm font-black">Post a Craving</span>
                            <span className="text-[10px] text-white/50 lowercase">share short-form food video</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { setIsLogModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-900 border border-white/10 rounded-2xl hover:bg-zinc-800 transition-all text-xs font-bold uppercase tracking-wider text-left text-white"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Plus size={20} />
                          </div>
                          <div>
                            <span className="block text-sm font-black">Log an Experience</span>
                            <span className="text-[10px] text-white/50 lowercase">rate dishes & dining spots</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { navigate("/lists"); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-900 border border-white/10 rounded-2xl hover:bg-zinc-800 transition-all text-xs font-bold uppercase tracking-wider text-left text-white"
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <ListOrdered size={20} />
                          </div>
                          <div>
                            <span className="block text-sm font-black">Curate a List</span>
                            <span className="text-[10px] text-white/50 lowercase">build ranked food guides</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Cravings */}
            <Link 
              to="/cravings" 
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${isActive('/cravings') ? 'text-orange-400' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Flame size={20} className={isActive('/cravings') ? "fill-orange-400" : ""} />
              <span className="text-[10px] font-bold">Cravings</span>
            </Link>

            {/* 5. Profile */}
            <Link 
              to={user ? `/profile/${dishdUser?.username || user.uid}` : "/"} 
              onClick={() => { if (!user) login(); }}
              className={`flex flex-col items-center gap-1 transition-all active:translate-y-0.5 ${location.pathname.startsWith('/profile') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {user ? (
                 <div className={`w-6 h-6 rounded-full overflow-hidden border ${location.pathname.startsWith('/profile') ? 'border-orange-400' : 'border-border'}`}>
                    <img src={dishdUser?.photoURL || user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                 </div>
              ) : (
                 <User size={20} />
              )}
              <span className="text-[10px] font-bold">Profile</span>
            </Link>
          </div>
        </div>
      </div>

      <LogMealModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
      />

      <CravingUploadModal
        isOpen={isCravingModalOpen}
        onClose={() => setIsCravingModalOpen(false)}
      />
    </>
  );
}
