import { Link } from "react-router-dom";
import { Search, Plus, User, LogOut, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { LogMealModal } from "./LogMealModal";
import { useAuth } from "../App";

export function Navbar() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const { user, login, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#14181c] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg group-hover:-rotate-12 transition-transform duration-300 shadow-lg shadow-rose-500/20">
              <UtensilsCrossed className="text-white w-4 h-4" />
            </div>
            <span className="text-white">
              Eat<span className="text-rose-500">D</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/restaurants" className="text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors">Restaurants</Link>
            <Link to="/lists" className="text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors">Lists</Link>
            <Link to="/critics" className="text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors">Critics</Link>
            <Link to="/journal" className="text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors">Journal</Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-white/40 hover:text-white transition-colors">
              <Search size={18} />
            </button>

            {user ? (
              <>
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="bg-[#00e054] hover:bg-[#00c044] text-black text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm transition-colors flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Log</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-white/40 transition-colors"
                  >
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#2c3440] border border-white/10 rounded shadow-2xl py-2 z-[100]">
                      <Link
                        to={`/profile/${user.uid}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#445566] transition-colors text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={14} />
                        Profile
                      </Link>
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#445566] transition-colors text-xs font-bold uppercase tracking-widest text-red-400"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={login}
                className="text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <LogMealModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </>
  );
}


