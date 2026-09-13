import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Sparkles, MapPin, ChevronDown, ArrowLeft, Navigation, Menu } from "lucide-react";
import { useAuth } from "../../App";
import { useTheme } from "../ThemeProvider";
import { SearchOverlay } from "../SearchOverlay";
import { AIFoodAssistant } from "../AIFoodAssistant";
import { LogMealModal } from "../LogMealModal";
import { ModeSwitcher } from "../ModeSwitcher";
import { SettingsOverlay } from "../SettingsOverlay";
import { triggerHaptic } from "../../services/nativeService";
import { toast } from "sonner";

interface AppHeaderProps {
  currentCity?: string;
  onCityChange?: (city: string) => void;
  showBack?: boolean;
  title?: string;
}

import { GLOBAL_CITIES } from "../../data/globalRestaurants";
import { getCurrentCity } from "../../services/mapsService";
import { Geolocation } from "@capacitor/geolocation";

export function AppHeader({ currentCity = "Hyderabad", onCityChange, showBack = false, title }: AppHeaderProps) {
  const { user, dishdUser } = useAuth();
  const routerLocation = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  const detectLocation = async () => {
    triggerHaptic();
    setIsLocating(true);
    try {
      let lat: number, lng: number;
      try {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 6000 });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        const webPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 6000 });
        });
        lat = webPos.coords.latitude;
        lng = webPos.coords.longitude;
      }

      const detected = await getCurrentCity(lat, lng);
      if (detected) {
        onCityChange?.(detected);
        toast.success(`📍 Location set to ${detected}`);
      } else {
        onCityChange?.("Nearby");
        toast.success("📍 Nearest restaurants activated");
      }
      setShowCityMenu(false);
    } catch (e) {
      console.warn("Location detection failed", e);
      toast.error("Could not fetch GPS. Please select a city manually.");
    } finally {
      setIsLocating(false);
    }
  };

  const filteredGlobalCities = GLOBAL_CITIES.filter(c => 
    c.name.toLowerCase().includes(cityFilter.toLowerCase()) || 
    c.country.toLowerCase().includes(cityFilter.toLowerCase())
  );

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 bg-zinc-950/95 border-b border-white/10 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-13 sm:h-14 flex items-center justify-between gap-3">
          
          {/* Left: Back button OR App Brand + City selector */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {showBack ? (
              <button
                onClick={() => { 
                  triggerHaptic(); 
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/app');
                  }
                }}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer shrink-0"
                title="Go Back"
              >
                <ArrowLeft size={16} />
              </button>
            ) : null}

            {title ? (
              <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-white truncate max-w-[180px] sm:max-w-[280px]">{title}</h1>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Link 
                  to="/app" 
                  onClick={() => triggerHaptic()} 
                  className="flex items-baseline tracking-tighter shrink-0"
                >
                  <span className="font-black text-white text-base sm:text-lg tracking-tight uppercase">MAD</span>
                  <span className="font-black text-orange-500 text-base sm:text-lg tracking-tight uppercase">EATER</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-0.5" />
                </Link>

                {/* Clean City Selector */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => { triggerHaptic(); setShowCityMenu(!showCityMenu); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 hover:text-white transition-all active:scale-95"
                  >
                    <MapPin size={10} className="text-orange-500 shrink-0" />
                    <span className="truncate max-w-[70px] sm:max-w-[110px]">{currentCity}</span>
                    <ChevronDown size={9} className="text-white/40 shrink-0" />
                  </button>

                  {showCityMenu && (
                    <div className="absolute left-0 mt-2 w-52 max-h-80 overflow-y-auto rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                      
                      {/* GPS Auto-Detect Button */}
                      <div className="p-1.5 border-b border-white/10">
                        <button
                          onClick={detectLocation}
                          disabled={isLocating}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold transition-all cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Navigation size={12} className={isLocating ? "animate-spin" : "animate-pulse"} />
                            {isLocating ? "Locating..." : "Use Current GPS"}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">Live</span>
                        </button>
                      </div>

                      {/* City Search Bar */}
                      <div className="p-1.5 border-b border-white/10">
                        <input
                          type="text"
                          value={cityFilter}
                          onChange={e => setCityFilter(e.target.value)}
                          placeholder="Search city or country..."
                          className="w-full px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white placeholder:text-white/40 focus:outline-none"
                        />
                      </div>

                      <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/40">
                        Global Food Capitals
                      </div>

                      {filteredGlobalCities.map((city) => (
                        <button
                          key={city.name}
                          onClick={() => {
                            triggerHaptic();
                            onCityChange?.(city.name);
                            setShowCityMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-bold transition-colors flex items-center justify-between ${
                            currentCity === city.name ? "text-orange-400 bg-orange-500/10" : "text-white/80 hover:bg-white/5"
                          }`}
                        >
                          <span>{city.name}</span>
                          <span className="text-[10px] text-white/30 font-medium">{city.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons (Clean Search + Profile Dropdown) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mode Switcher Slider for Laptop (Web / App Mode) */}
            <div className="hidden sm:block">
              <ModeSwitcher />
            </div>
            
            {/* Desktop Search Bar Trigger */}
            <button
              onClick={() => { triggerHaptic(); setIsSearchOpen(true); }}
              className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs transition-all w-52 xl:w-64 cursor-pointer"
            >
              <Search size={14} className="text-orange-400 shrink-0" />
              <span className="truncate">Search dishes, spots...</span>
              <span className="ml-auto text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/40">⌘K</span>
            </button>

            {/* AI Food Assistant Button (Shown on tablets and desktop; mobile accesses via Search / Profile) */}
            <button
              onClick={() => { triggerHaptic(); setIsAIOpen(true); }}
              className="hidden sm:flex w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500/15 via-amber-400/15 to-rose-500/15 hover:from-orange-500/25 hover:to-amber-400/25 border border-orange-500/35 items-center justify-center text-orange-400 active:scale-90 transition-all shrink-0 cursor-pointer shadow-sm"
              title="AI Food Assistant"
            >
              <Sparkles size={14} className="text-orange-400" />
            </button>

            {/* Mobile Search Icon */}
            <button
              onClick={() => { triggerHaptic(); setIsSearchOpen(true); }}
              className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Search"
            >
              <Search size={15} />
            </button>

            {/* Instagram 3-line bar (Settings and activity) */}
            <button
              onClick={() => { 
                triggerHaptic(); 
                setIsSettingsOpen(true);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0 cursor-pointer shadow-sm"
              title="Settings and activity"
              aria-label="Settings and activity"
            >
              <Menu size={19} className="stroke-[2.2]" />
            </button>

          </div>

        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AIFoodAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <SettingsOverlay 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onEditProfile={() => navigate(user ? `/app/profile/${dishdUser?.username || user.uid}` : '/app')} 
      />
    </>
  );
}
