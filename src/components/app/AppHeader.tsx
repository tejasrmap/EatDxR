import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sparkles, MapPin, Bell, Globe, ChevronDown, User, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "../../App";
import { SearchOverlay } from "../SearchOverlay";
import { AIFoodAssistant } from "../AIFoodAssistant";
import { triggerHaptic } from "../../services/nativeService";

interface AppHeaderProps {
  currentCity?: string;
  onCityChange?: (city: string) => void;
  showBack?: boolean;
  title?: string;
}

const CITIES = ["Hyderabad", "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Goa", "Pune"];

export function AppHeader({ currentCity = "Hyderabad", onCityChange, showBack = false, title }: AppHeaderProps) {
  const { user, dishdUser, login, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-2xl border-b border-white/10 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          
          {/* Left: Back button OR App Brand + City selector */}
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                onClick={() => { triggerHaptic(); navigate(-1); }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}

            {title ? (
              <h1 className="text-base font-black uppercase tracking-tight text-white truncate max-w-[200px]">{title}</h1>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <Link 
                  to="/app" 
                  onClick={() => triggerHaptic()} 
                  className="flex items-baseline tracking-tighter shrink-0"
                >
                  <span className="font-black text-white text-base sm:text-lg tracking-tight uppercase">MAD</span>
                  <span className="font-black text-orange-500 text-base sm:text-lg tracking-tight uppercase">EATER</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-0.5" />
                </Link>

                {/* Compact City Selector */}
                <div className="relative">
                  <button
                    onClick={() => { triggerHaptic(); setShowCityMenu(!showCityMenu); }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-white/10 text-[10px] sm:text-[11px] font-semibold text-white/80 hover:text-white transition-all active:scale-95"
                  >
                    <MapPin size={10} className="text-orange-500 shrink-0" />
                    <span className="truncate max-w-[65px] sm:max-w-[90px]">{currentCity}</span>
                    <ChevronDown size={10} className="text-white/40 shrink-0" />
                  </button>

                  {showCityMenu && (
                    <div className="absolute left-0 mt-2 w-36 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/40 border-b border-white/10">
                        Select City
                      </div>
                      {CITIES.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            triggerHaptic();
                            onCityChange?.(city);
                            setShowCityMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                            currentCity === city ? "text-orange-400 bg-orange-500/10" : "text-white/80 hover:bg-white/5"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons (Compact & Clean) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Search */}
            <button
              onClick={() => { triggerHaptic(); setIsSearchOpen(true)} }
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
              title="Search"
            >
              <Search size={14} />
            </button>

            {/* Chef AI */}
            <button
              onClick={() => { triggerHaptic(); setIsAIOpen(true); }}
              className="h-8 px-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 flex items-center gap-1 text-white/80 hover:text-orange-400 active:scale-95 transition-all text-xs font-semibold"
              title="Ask Chef AI"
            >
              <Sparkles size={13} className="text-orange-400" />
              <span className="hidden xs:inline text-[11px]">AI</span>
            </button>

            {/* User Profile Avatar / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { triggerHaptic(); setShowUserMenu(!showUserMenu); }}
                  className="w-8 h-8 rounded-full border border-white/20 overflow-hidden hover:border-white active:scale-95 transition-all"
                >
                  <img
                    src={dishdUser?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2 border-b border-white/10">
                      <p className="text-xs font-bold text-white truncate">{dishdUser?.displayName || "Foodie"}</p>
                      <p className="text-[10px] text-white/40 truncate">@{dishdUser?.username || "critic"}</p>
                    </div>
                    <Link
                      to={`/app/profile/${dishdUser?.username || user.uid}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs text-white/80 hover:bg-white/5 transition-colors"
                    >
                      <User size={14} />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs text-white/60 hover:bg-white/5 transition-colors"
                    >
                      <Globe size={14} />
                      <span>Back to Website</span>
                    </Link>
                    <button
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { triggerHaptic(); login(); }}
                className="px-3 py-1.5 rounded-full bg-orange-500 text-black font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Log In
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Global Search Dialog */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* AI Assistant Modal */}
      <AIFoodAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </>
  );
}
