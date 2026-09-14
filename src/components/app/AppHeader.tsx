import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Sparkles, ArrowLeft, Heart, Send } from "lucide-react";
import { useAuth } from "../../App";
import { useTheme } from "../ThemeProvider";
import { SearchOverlay } from "../SearchOverlay";
import { AIFoodAssistant } from "../AIFoodAssistant";
import { LogMealModal } from "../LogMealModal";
import { ModeSwitcher } from "../ModeSwitcher";
import { NotificationsOverlay } from "../NotificationsOverlay";
import { DirectMessagesOverlay } from "../DirectMessagesOverlay";
import { triggerHaptic } from "../../services/nativeService";
import { toast } from "sonner";

interface AppHeaderProps {
  currentCity?: string;
  onCityChange?: (city: string) => void;
  showBack?: boolean;
  title?: string;
}

export function AppHeader({ currentCity = "Hyderabad", onCityChange, showBack = false, title }: AppHeaderProps) {
  const { user, dishdUser } = useAuth();
  const routerLocation = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const navigate = useNavigate();

  // Load real unread counts on mount
  useEffect(() => {
    if (!user?.uid) return;
    import("../../services/supabaseService").then(({ getNotifications, getDirectMessages }) => {
      getNotifications(user.uid).then((notifs) => {
        const unreadCount = notifs.filter(n => !n.read).length;
        setUnreadNotifs(unreadCount);
      }).catch(() => {});

      getDirectMessages(user.uid).then((msgs) => {
        const unreadCount = msgs.filter(m => m.recipient_id === user.uid && !m.is_read).length;
        setUnreadDMs(unreadCount);
      }).catch(() => {});
    });
  }, [user?.uid]);

  // Listen for global event to open chat overlay (e.g. from Critic Profile or Review)
  useEffect(() => {
    const handleOpenChat = () => {
      setIsDMOpen(true);
    };
    window.addEventListener('madeater_open_chat', handleOpenChat);
    return () => window.removeEventListener('madeater_open_chat', handleOpenChat);
  }, []);

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 bg-zinc-950/95 border-b border-white/10 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-13 sm:h-14 flex items-center justify-between gap-3">
          
          {/* Left: Back button OR App Brand */}
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

            {/* Instagram Heart Activity Bar */}
            <button
              onClick={() => { 
                triggerHaptic(); 
                setIsNotificationsOpen(true);
              }}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0 cursor-pointer shadow-sm group"
              title="Notifications & Activity"
              aria-label="Notifications"
            >
              <Heart size={18} className="stroke-[2.2] group-hover:text-rose-400 group-hover:fill-rose-500/20 transition-colors" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border border-[#09090b] animate-pulse" />
              )}
            </button>

            {/* Instagram Direct Messages (DMs) Bar */}
            <button
              onClick={() => { 
                triggerHaptic(); 
                setIsDMOpen(true);
              }}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0 cursor-pointer shadow-sm group"
              title="Foodie Direct Messages"
              aria-label="Direct Messages"
            >
              <Send size={16} className="stroke-[2.2] group-hover:text-orange-400 -translate-x-0.5 translate-y-0.5 transition-colors" />
              {unreadDMs > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 border border-[#09090b] animate-pulse" />
              )}
            </button>

          </div>

        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AIFoodAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <NotificationsOverlay 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        onCountChange={(cnt) => setUnreadNotifs(cnt)}
      />
      <DirectMessagesOverlay 
        isOpen={isDMOpen} 
        onClose={() => setIsDMOpen(false)} 
        onUnreadChange={(cnt) => setUnreadDMs(cnt)}
      />
    </>
  );
}
