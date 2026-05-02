import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, Settings, Plus, Film } from "lucide-react";
import { useState, useEffect } from "react";
import { LogMealModal } from "./LogMealModal";
import { ReelUploadModal } from "./ReelUploadModal";
import { SearchOverlay } from "./SearchOverlay";
import { useAuth } from "../App";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AppNotification } from "../types";
import { formatDistanceToNow } from "date-fns";
import { SettingsOverlay } from "./SettingsOverlay";
import { EditProfileModal } from "./EditProfileModal";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const { user, dishdUser, login, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
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

  const getNotificationText = (notif: AppNotification) => {
    switch (notif.type) {
      case "LIKE": return "liked your review.";
      case "COMMENT": return "commented on your review.";
      case "FOLLOW": return "started following you.";
      default: return "interacted with you.";
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[300] bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 h-16 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Logo Cluster */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="logo-text flex items-baseline tracking-tighter">
              <span className="font-bold text-white text-2xl tracking-tight uppercase">MAD</span>
              <span className="font-bold text-white/50 text-2xl tracking-tight uppercase">EATER</span>
            </div>
          </Link>
          
          {/* Desktop Central Navigation */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <Link to="/restaurants" className="font-medium text-white/40 text-sm hover:text-white transition-colors">
              Restaurants
            </Link>
            <Link to="/critics" className="font-medium text-white/40 text-sm hover:text-white transition-colors">
              Critics
            </Link>
            <Link to="/journal" className="font-medium text-white/40 text-sm hover:text-white transition-colors">
              Journal
            </Link>
          </div>

          {/* Action Row: Unified & Accessible on Mobile */}
          <div className="flex items-center gap-1 md:gap-4">
            {/* Direct Creation Hub (Mobile-Ready Search) */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-white/40 hover:text-white transition-colors" 
              title="Search"
            >
              <Search size={18} />
            </button>

            {user ? (
              <div className="flex items-center gap-1 md:gap-3">
                {/* Creator Choice (Laptop Only) */}
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="w-9 h-9 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] group"
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
                        className="absolute top-full right-0 mt-3 w-56 bg-[#0a0a0a] border border-white/10 shadow-2xl py-3 rounded-2xl z-[350] overflow-hidden will-change-transform"
                      >
                        <button
                          onClick={() => { setIsReelModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-white group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <Film size={18} className="text-orange-500" />
                          </div>
                          <span>Reel Narrative</span>
                        </button>
                        
                        <button
                          onClick={() => { setIsLogModalOpen(true); setShowActionMenu(false); }}
                          className="w-full flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-white group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                            <Plus size={20} className="text-green-500" />
                          </div>
                          <span className="font-medium tracking-normal text-sm">Culinary Log</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notifications & User Cluster */}
                <div className="flex items-center gap-1 md:gap-3 border-l border-white/5 pl-2 md:pl-4">
                  <div className="relative">
                    <button
                      onClick={() => { setShowNotifMenu(!showNotifMenu); setShowUserMenu(false); }}
                      className="p-2 text-white/40 hover:text-white transition-transform hover:-translate-y-0.5 relative"
                    >
                      <Bell size={18} className={unreadCount > 0 ? "text-white" : ""} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-black flex items-center justify-center text-[7px] font-black text-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {showNotifMenu && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 45 }}
                          className="absolute right-[-60px] md:right-0 mt-3 w-[300px] bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-2xl z-[400] max-h-96 flex flex-col overflow-hidden will-change-transform"
                        >
                          <div className="p-4 border-b border-white/5">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Activity</span>
                          </div>
                          <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-white/20 text-[10px] uppercase font-black tracking-widest italic">Silent...</div>
                            ) : (
                              notifications.map(notif => (
                                <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all ${notif.read ? 'opacity-40' : 'bg-white/5'}`}>
                                  <img src={notif.actorPhoto} alt="" className="w-9 h-9 rounded-full border border-white/10 object-cover shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-white/80 leading-snug"><span className="font-bold text-white">{notif.actorName}</span> {getNotificationText(notif)}</p>
                                    <span className="text-[9px] text-orange-500/80 font-black uppercase mt-1 block">{notif.createdAt?.toMillis ? formatDistanceToNow(notif.createdAt.toMillis(), { addSuffix: true }) : 'now'}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifMenu(false); }}
                      className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-white transition-all active:scale-95"
                    >
                      <img src={dishdUser?.photoURL || user.photoURL || ""} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 45 }}
                          className="absolute right-0 mt-3 w-52 bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-2xl py-2 z-[400] will-change-transform"
                        >
                          <Link to={`/profile/${dishdUser?.username || user.uid}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-sm font-medium text-white/60 hover:text-white" onClick={() => setShowUserMenu(false)}>
                            <User size={14} className="text-white/60" /> Profile
                          </Link>
                          <button onClick={() => { setIsSettingsOpen(true); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-sm font-medium text-white/60 hover:text-white">
                            <Settings size={14} className="text-white/60" /> Settings
                          </button>
                          <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-sm font-medium text-rose-500">
                            <LogOut size={14} /> Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-white text-black text-xs font-medium px-6 py-2 rounded-full hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <LogMealModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      <ReelUploadModal isOpen={isReelModalOpen} onClose={() => setIsReelModalOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SettingsOverlay isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onEditProfile={() => setIsEditModalOpen(true)} />
      {dishdUser && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={dishdUser} />}
    </>
  );
}
