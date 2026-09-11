import { Link } from "react-router-dom";
import { Search, Sparkles, Smartphone, Compass, Utensils, Map, ListOrdered, Award, User, LogOut, Plus, BookOpen, Clock, Settings, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { SearchOverlay } from "../SearchOverlay";
import { AIFoodAssistant } from "../AIFoodAssistant";
import { LogMealModal } from "../LogMealModal";
import { CravingUploadModal } from "../CravingUploadModal";
import { SettingsOverlay } from "../SettingsOverlay";
import { EditProfileModal } from "../EditProfileModal";
import { useAuth } from "../../App";

export function WebNavbar() {
  const { user, dishdUser, login, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Primary Navigation */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link to="/" className="flex items-center gap-1.5 group shrink-0">
              <div className="logo-text flex items-baseline tracking-tighter">
                <span className="font-black text-white text-2xl uppercase tracking-tight">MAD</span>
                <span className="font-black text-orange-500 text-2xl uppercase tracking-tight">EATER</span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-1 group-hover:scale-150 transition-transform" />
              </div>
            </Link>

            {/* Desktop Navigation Links (Clean, Minimalist, No icon noise) */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-white/60">
              <Link to="/dishes" className="hover:text-white transition-colors">
                Dishes
              </Link>
              <Link to="/restaurants" className="hover:text-white transition-colors">
                Spots
              </Link>
              <Link to="/map" className="hover:text-white transition-colors">
                Radar
              </Link>
              <Link to="/critics" className="hover:text-white transition-colors">
                Critics
              </Link>
              <Link to="/lists" className="hover:text-white transition-colors">
                Lists
              </Link>
            </nav>
          </div>

          {/* Right Action Stack (Minimal, neat, uncrowded) */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/60 hover:text-white transition-all cursor-pointer"
              title="Search dishes & restaurants (Ctrl+K)"
            >
              <Search size={13} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-mono">⌘K</kbd>
            </button>

            {/* AI Assistant Pill */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 text-white/80 hover:text-orange-400 text-xs font-semibold transition-all cursor-pointer"
              title="Ask Chef AI"
            >
              <Sparkles size={13} className="text-orange-400" />
              <span className="hidden sm:inline">Ask Chef AI</span>
            </button>

            {/* + Log Meal Button */}
            <button
              onClick={() => {
                if (!user) { login(); return; }
                setIsLogModalOpen(true);
              }}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white hover:bg-orange-500 text-black hover:text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus size={13} className="stroke-[3]" />
              <span>Log</span>
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full border border-white/20 overflow-hidden hover:border-white transition-colors cursor-pointer"
                >
                  <img
                    src={dishdUser?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs font-bold text-white truncate">{dishdUser?.displayName || "Foodie"}</p>
                      <p className="text-[10px] text-white/40 truncate">@{dishdUser?.username || "critic"}</p>
                    </div>
                    <Link
                      to={`/profile/${dishdUser?.username || user.uid}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User size={14} />
                      <span>My Profile & Taste DNA</span>
                    </Link>
                    <Link
                      to="/journal"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <BookOpen size={14} />
                      <span>Food Journal</span>
                    </Link>
                    <Link
                      to="/wrapped"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Clock size={14} />
                      <span>Year In Food Wrapped</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-white/80 hover:bg-white/5 transition-colors text-left"
                    >
                      <Settings size={14} />
                      <span>Account Settings</span>
                    </button>
                    <div className="border-t border-white/10 mt-1 pt-1">
                      <button
                        onClick={() => { setShowUserMenu(false); logout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => login()}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="xl:hidden bg-zinc-950/95 border-b border-white/10 px-6 py-4 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-3 text-sm font-bold uppercase tracking-wider text-white/80">
              <Link 
                to="/dishes" 
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 hover:text-orange-400 transition-colors"
              >
                <Utensils size={16} />
                <span>Signature Dishes</span>
              </Link>
              <Link 
                to="/restaurants" 
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 hover:text-orange-400 transition-colors"
              >
                <Compass size={16} />
                <span>Culinary Spots</span>
              </Link>
              <Link 
                to="/map" 
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 hover:text-orange-400 transition-colors"
              >
                <Map size={16} />
                <span>Food Radar</span>
              </Link>
              <Link 
                to="/critics" 
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 hover:text-orange-400 transition-colors"
              >
                <Award size={16} />
                <span>Top Critics</span>
              </Link>
              <Link 
                to="/lists" 
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 hover:text-orange-400 transition-colors"
              >
                <ListOrdered size={16} />
                <span>Curated Lists</span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Global Interactive Modals on the Website */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AIFoodAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <CravingUploadModal isOpen={isCravingModalOpen} onClose={() => setIsCravingModalOpen(false)} />
      <SettingsOverlay 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onEditProfile={() => {
          setIsSettingsOpen(false);
          setIsEditProfileOpen(true);
        }}
      />
      {dishdUser && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          user={dishdUser}
        />
      )}
    </>
  );
}
