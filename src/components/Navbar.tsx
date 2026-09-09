import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, Settings, Plus, Flame, Sparkles, Map, ListOrdered, Utensils } from "lucide-react";
import { useState, useEffect } from "react";
import { LogMealModal } from "./LogMealModal";
import { CravingUploadModal } from "./CravingUploadModal";
import { SearchOverlay } from "./SearchOverlay";
import { AIFoodAssistant } from "./AIFoodAssistant";
import { useAuth } from "../App";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AppNotification } from "../types";
import { formatDistanceToNow } from "date-fns";
import { SettingsOverlay } from "./SettingsOverlay";
import { EditProfileModal } from "./EditProfileModal";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./ThemeProvider";

export function Navbar() {
  const { user, dishdUser, login, logout } = useAuth();
  const { theme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("OPEN_GLOBAL_SEARCH", handleOpenSearch);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("OPEN_GLOBAL_SEARCH", handleOpenSearch);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const q = query(collection(db, "notifications"), where("recipientId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AppNotification[];
      notifsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setNotifications(notifsData);
    }, (error) => {
      console.warn("Notifications subscription error:", error.message);
    });
    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    setShowNotifMenu(false);
    if (!notif.read) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      } catch (error) {
        console.error("Failed to mark notification read", error);
      }
    }
    navigate(`/profile/${notif.actorId}`);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[300] bg-background/80 backdrop-blur-xl border-b border-border h-16 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Logo Cluster */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="logo-text flex items-baseline tracking-tighter">
              <span className="font-bold text-foreground text-2xl tracking-tight uppercase">MAD</span>
              <span className="font-bold text-orange-500 text-2xl tracking-tight uppercase">EATER</span>
            </div>
          </Link>
          
          {/* Desktop Central Navigation */}
          <div className="hidden lg:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            <Link to="/cravings" className="font-medium text-muted-foreground text-sm hover:text-orange-400 transition-colors flex items-center gap-1.5">
              <Flame size={14} className="text-orange-500" />
              <span>Cravings</span>
            </Link>
            <Link to="/dishes" className="font-medium text-muted-foreground text-sm hover:text-foreground transition-colors">
              Dishes
            </Link>
            <Link to="/restaurants" className="font-medium text-muted-foreground text-sm hover:text-foreground transition-colors">
              Restaurants
            </Link>
            <Link to="/lists" className="font-medium text-muted-foreground text-sm hover:text-foreground transition-colors">
              Lists
            </Link>
            <Link to="/map" className="font-medium text-muted-foreground text-sm hover:text-foreground transition-colors">
              Map
            </Link>
            <Link to="/critics" className="font-medium text-muted-foreground text-sm hover:text-foreground transition-colors">
              Critics
            </Link>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* AI Concierge Trigger */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-black transition-all text-xs font-black uppercase tracking-wider group"
              title="Madeater AI Food Concierge"
            >
              <Sparkles size={13} className="text-orange-400 group-hover:text-black transition-colors" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Global Search */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted" 
              title="Search (⌘K)"
            >
              <Search size={18} />
            </button>

            {user ? (
              <div className="flex items-center gap-2 md:gap-3">
                {/* Create Menu (Desktop) */}
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="w-9 h-9 flex items-center justify-center bg-foreground text-background rounded-full hover:scale-105 transition-all shadow-lg group"
                    title="Create"
                  >
                    <Plus size={20} className={`transition-transform ${showActionMenu ? "rotate-45" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showActionMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 45 }}
                        className="absolute top-full right-0 mt-3 w-60 bg-background border border-border shadow-2xl py-3 rounded-2xl z-[350] overflow-hidden will-change-transform"
                      >
                        <button
                          onClick={() => { setIsCravingModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-all text-xs font-bold uppercase tracking-widest text-foreground group text-left"
                        >
                          <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                            <Flame size={17} />
                          </div>
                          <div>
                            <span className="block">Post a Craving</span>
                            <span className="text-[9px] text-muted-foreground lowercase">short-form food video</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { setIsLogModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-all text-xs font-bold uppercase tracking-widest text-foreground group text-left"
                        >
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Plus size={17} />
                          </div>
                          <div>
                            <span className="block">Log an Experience</span>
                            <span className="text-[9px] text-muted-foreground lowercase">review dishes & venues</span>
                          </div>
                        </button>

                        <Link
                          to="/lists"
                          onClick={() => setShowActionMenu(false)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-all text-xs font-bold uppercase tracking-widest text-foreground group text-left"
                        >
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                            <ListOrdered size={17} />
                          </div>
                          <div>
                            <span className="block">Curate a List</span>
                            <span className="text-[9px] text-muted-foreground lowercase">ranked food guides</span>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors relative rounded-full hover:bg-muted"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500" />
                    )}
                  </button>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-border hover:border-foreground transition-colors"
                  >
                    <img 
                      src={dishdUser?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-3 w-56 bg-background border border-border shadow-2xl py-2 rounded-2xl z-[350] overflow-hidden"
                      >
                        <Link 
                          to={`/profile/${dishdUser?.username || user.uid}`}
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-colors text-sm font-medium text-foreground"
                        >
                          <User size={15} /> Your Profile
                        </Link>
                        <Link 
                          to="/wrapped"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-colors text-sm font-medium text-orange-400"
                        >
                          <Sparkles size={15} /> Year in Food
                        </Link>
                        <button 
                          onClick={() => { setIsSettingsOpen(true); setShowUserMenu(false); }} 
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                          <Settings size={15} /> Settings
                        </button>
                        <button 
                          onClick={() => { logout(); setShowUserMenu(false); }} 
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-colors text-sm font-medium text-rose-500"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-foreground text-background text-xs font-black uppercase tracking-wider px-5 py-2 rounded-full hover:scale-105 shadow-lg transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <CravingUploadModal isOpen={isCravingModalOpen} onClose={() => setIsCravingModalOpen(false)} />
      <AIFoodAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SettingsOverlay isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onEditProfile={() => setIsEditModalOpen(true)} />
      {dishdUser && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={dishdUser} />}
    </>
  );
}
