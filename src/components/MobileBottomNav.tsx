import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Search, Plus, User, LayoutGrid } from 'lucide-react';
import { useAuth } from '../App';
import { LogMealModal } from './LogMealModal';

export function MobileBottomNav() {
  const location = useLocation();
  const { user, dishdUser, login } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
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
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[50] px-6 pb-8 pt-2 pointer-events-none transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="max-w-md mx-auto bg-[#1a1c1d]/75 backdrop-blur-[50px] border border-white/10 rounded-[2.5rem] shadow-2xl pointer-events-auto relative group">
          {/* Central Glow Effect for the + button */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#00e054]/20 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-around h-16 relative z-10">
            <Link 
              to="/restaurants" 
              className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${isActive('/restaurants') ? 'text-[#00e054]' : 'text-white/40 hover:text-white'}`}
            >
              <Compass size={18} className={isActive('/restaurants') ? "fill-[#00e054]/20" : ""} />
              <span className="text-[8px] font-black uppercase tracking-widest">Explore</span>
            </Link>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_GLOBAL_SEARCH'))}
              className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-all active:scale-95"
            >
              <Search size={18} />
              <span className="text-[8px] font-black uppercase tracking-widest">Search</span>
            </button>

            <div className="relative -mt-10">
              <button 
                onClick={() => user ? setIsLogModalOpen(true) : login()}
                className="w-14 h-14 bg-gradient-to-br from-[#00e054] to-[#00c044] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,224,84,0.3)] active:scale-90 transition-all border-4 border-[#1a1c1d] group/btn"
              >
                <Plus size={24} className="text-black group-hover/btn:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <Link 
              to="/journal" 
              className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${isActive('/journal') ? 'text-[#00e054]' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid size={18} className={isActive('/journal') ? "fill-[#00e054]/20" : ""} />
              <span className="text-[8px] font-black uppercase tracking-widest">Feed</span>
            </Link>

             <Link 
              to={user ? `/profile/${dishdUser?.username || user.uid}` : "/"} 
              className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${location.pathname.startsWith('/profile') ? 'text-[#00e054]' : 'text-white/40 hover:text-white'}`}
            >
              {user ? (
                 <div className={`w-5 h-5 rounded-full overflow-hidden border ${location.pathname.startsWith('/profile') ? 'border-[#00e054]' : 'border-white/20'}`}>
                    <img src={dishdUser?.photoURL || user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                 </div>
              ) : (
                 <User size={18} />
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
    </>
  );
}
