import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, Search, Compass, UtensilsCrossed, Clapperboard, 
  MapPin, Bookmark, Sparkles, Plus, Settings, 
  User as UserIcon 
} from "lucide-react";
import { useAuth } from "../../App";
import { triggerHaptic } from "../../services/nativeService";
import { SearchOverlay } from "../SearchOverlay";
import { CravingMatcherModal } from "../CravingMatcherModal";
import { LogMealModal } from "../LogMealModal";
import { SettingsOverlay } from "../SettingsOverlay";

export function AppSidebar() {
  const { user, dishdUser, login } = useAuth();
  const routerLocation = useLocation();
  const pathname = routerLocation.pathname;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const profileLink = user ? `/app/profile/${dishdUser?.username || user.uid}` : "/app";

  const isHome = pathname === "/app" || pathname === "/app/";
  const isDishes = pathname.startsWith("/app/dishes") || pathname.startsWith("/app/explore") || pathname.startsWith("/app/dish");
  const isRestaurants = pathname.startsWith("/app/restaurants") || pathname.startsWith("/app/restaurant");
  const isCravings = pathname.startsWith("/app/cravings");
  const isRadar = pathname.startsWith("/app/map");
  const isLists = pathname.startsWith("/app/lists") || pathname.startsWith("/app/list");
  const isProfile = pathname.startsWith("/app/profile");

  return (
    <>
      <aside className="hidden lg:flex flex-col justify-between w-56 xl:w-64 shrink-0 sticky top-16 select-none h-[calc(100vh-4.5rem)] pb-6 pr-2">
        <div className="space-y-1.5 pt-2">
          {/* 1. Home */}
          <Link
            to="/app"
            onClick={() => triggerHaptic()}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm transition-all ${
              isHome 
                ? "bg-slate-200/80 dark:bg-white/10 text-slate-950 dark:text-white font-bold shadow-sm border border-slate-300/70 dark:border-transparent" 
                : "text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium"
            }`}
          >
            <Home size={20} className={isHome ? "text-orange-500 dark:text-orange-400" : ""} />
            <span>Home</span>
          </Link>

          {/* 2. Search */}
          <button
            onClick={() => { triggerHaptic(); setIsSearchOpen(true); }}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium text-sm transition-all cursor-pointer text-left"
          >
            <Search size={20} />
            <span>Search</span>
          </button>

          {/* 3. Explore Dishes */}
          <Link
            to="/app/dishes"
            onClick={() => triggerHaptic()}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm transition-all ${
              isDishes 
                ? "bg-slate-200/80 dark:bg-white/10 text-slate-950 dark:text-white font-bold shadow-sm border border-slate-300/70 dark:border-transparent" 
                : "text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium"
            }`}
          >
            <Compass size={20} className={isDishes ? "text-orange-500 dark:text-orange-400" : ""} />
            <span>Explore Dishes</span>
          </Link>

          {/* 4. Restaurants */}
          <Link
            to="/app/restaurants"
            onClick={() => triggerHaptic()}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm transition-all ${
              isRestaurants 
                ? "bg-slate-200/80 dark:bg-white/10 text-slate-950 dark:text-white font-bold shadow-sm border border-slate-300/70 dark:border-transparent" 
                : "text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium"
            }`}
          >
            <UtensilsCrossed size={20} className={isRestaurants ? "text-orange-500 dark:text-orange-400" : ""} />
            <span>Restaurants</span>
          </Link>

          {/* 5. Cravings (Reels) */}
          <Link
            to="/app/cravings"
            onClick={() => triggerHaptic()}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm transition-all ${
              isCravings 
                ? "bg-slate-200/80 dark:bg-white/10 text-slate-950 dark:text-white font-bold shadow-sm border border-slate-300/70 dark:border-transparent" 
                : "text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium"
            }`}
          >
            <Clapperboard size={20} className={isCravings ? "text-orange-500 dark:text-orange-400" : ""} />
            <span>Cravings</span>
          </Link>

          {/* 6. Food Radar */}
          <Link
            to="/app/map"
            onClick={() => triggerHaptic()}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm transition-all ${
              isRadar 
                ? "bg-slate-200/80 dark:bg-white/10 text-slate-950 dark:text-white font-bold shadow-sm border border-slate-300/70 dark:border-transparent" 
                : "text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium"
            }`}
          >
            <MapPin size={20} className={isRadar ? "text-orange-500 dark:text-orange-400" : ""} />
            <span>Food Radar</span>
          </Link>

          {/* 7. Saved Lists */}
          <Link
            to="/app/lists"
            onClick={() => triggerHaptic()}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm transition-all ${
              isLists 
                ? "bg-slate-200/80 dark:bg-white/10 text-slate-950 dark:text-white font-bold shadow-sm border border-slate-300/70 dark:border-transparent" 
                : "text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium"
            }`}
          >
            <Bookmark size={20} className={isLists ? "text-orange-500 dark:text-orange-400" : ""} />
            <span>Saved Lists</span>
          </Link>

          {/* 8. Craving Matcher */}
          <button
            onClick={() => { triggerHaptic(); setIsMatcherOpen(true); }}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium text-sm transition-all cursor-pointer text-left"
          >
            <Sparkles size={20} className="text-amber-500 dark:text-amber-400" />
            <span>Craving Matcher</span>
          </button>

          {/* 9. Profile */}
          <Link
            to={profileLink}
            onClick={() => triggerHaptic()}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm transition-all ${
              isProfile 
                ? "bg-slate-200/80 dark:bg-white/10 text-slate-950 dark:text-white font-bold shadow-sm border border-slate-300/70 dark:border-transparent" 
                : "text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium"
            }`}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Profile"}
                className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-white/20"
              />
            ) : (
              <UserIcon size={20} className={isProfile ? "text-orange-500 dark:text-orange-400" : ""} />
            )}
            <span>Profile</span>
          </Link>

          {/* Log A Meal Button */}
          <div className="pt-3">
            <button
              onClick={() => {
                triggerHaptic();
                if (!user) {
                  login();
                } else {
                  setIsLogModalOpen(true);
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white dark:text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Log A Meal</span>
            </button>
          </div>
        </div>

        {/* Bottom: Settings */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-white/10">
          <button
            onClick={() => { triggerHaptic(); setIsSettingsOpen(true); }}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-600 dark:text-white/60 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium text-sm transition-all cursor-pointer text-left"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Global Modals opened from persistent sidebar */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CravingMatcherModal isOpen={isMatcherOpen} onClose={() => setIsMatcherOpen(false)} />
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <SettingsOverlay isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
