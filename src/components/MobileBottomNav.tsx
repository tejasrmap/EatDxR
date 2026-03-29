import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Search, Plus, Bell, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../App';
import { LogMealModal } from './LogMealModal';

export function MobileBottomNav() {
  const location = useLocation();
  const { user, dishdUser, login } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pt-2 pointer-events-none">
        <div className="max-w-md mx-auto bg-[#1a1c1d]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl pointer-events-auto overflow-hidden relative group">
          <div className="flex items-center justify-around h-16 relative z-10">
            <Link 
              to="/restaurants" 
              className={`flex flex-col items-center gap-1 transition-all ${isActive('/restaurants') ? 'text-[#00e054]' : 'text-white/40 hover:text-white'}`}
            >
              <Compass size={20} className={isActive('/restaurants') ? "fill-[#00e054]/20" : ""} />
              <span className="text-[9px] font-black uppercase tracking-widest">Explore</span>
            </Link>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_GLOBAL_SEARCH'))}
              className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-all"
            >
              <Search size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">Search</span>
            </button>

            <div className="relative -top-4">
              <button 
                onClick={() => user ? setIsLogModalOpen(true) : login()}
                className="w-14 h-14 bg-gradient-to-br from-[#00e054] to-cyan-400 rounded-full flex items-center justify-center shadow-xl shadow-[#00e054]/20 active:scale-90 transition-transform border-4 border-[#1a1c1d]"
              >
                <Plus size={24} className="text-black" />
              </button>
            </div>

            <Link 
              to="/journal" 
              className={`flex flex-col items-center gap-1 transition-all ${isActive('/journal') ? 'text-[#00e054]' : 'text-white/40 hover:text-white'}`}
            >
              <Bell size={20} className={isActive('/journal') ? "fill-[#00e054]/20" : ""} />
              <span className="text-[9px] font-black uppercase tracking-widest">Activity</span>
            </Link>

            <Link 
              to={user ? `/profile/${dishdUser?.username || user.uid}` : "/"} 
              className={`flex flex-col items-center gap-1 transition-all ${location.pathname.startsWith('/profile') ? 'text-[#00e054]' : 'text-white/40 hover:text-white'}`}
            >
              {user ? (
                 <div className={`w-5 h-5 rounded-full overflow-hidden border ${location.pathname.startsWith('/profile') ? 'border-[#00e054]' : 'border-white/20'}`}>
                    <img src={user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                 </div>
              ) : (
                 <User size={20} />
              )}
              <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
            </Link>
          </div>
          
          {/* Subtle Indicator bar for iPhone style */}
          <div className="h-1 w-12 bg-white/5 mx-auto rounded-full mb-1 opacity-50" />
        </div>
      </div>

      <LogMealModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
      />
    </>
  );
}
