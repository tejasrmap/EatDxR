import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, Settings, Plus, UtensilsCrossed, Film } from "lucide-react";
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
      <nav className="fixed top-0 left-0 right-0 z-[300] bg-black/40 backdrop-blur-3xl border-b border-white/5 h-16 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Logo Cluster */}
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-2 group shrink-0">
            <div className="relative flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg group-hover:-rotate-12 transition-transform duration-300 shadow-lg shadow-rose-500/20">
              <UtensilsCrossed className="text-white w-3 h-3 md:w-4 md:h-4" />
            </div>
            <span className="text-white hidden sm:inline">Eat<span className="text-rose-500">D</span></span>
          </Link>

          {/* Action Row: Unified & Accessible on Mobile */}
          <div className="flex items-center gap-1.5 md:gap-4">
            {/* Direct Creation Hub (Mobile-Ready) */}
              <div className="flex items-center gap-1 md:gap-3">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-white/40 hover:text-white transition-colors" 
                title="Search"
              >
                <Search size={18} />
              </button>

            {user && (
              <div className="hidden md:block relative ml-2">
                <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="p-2 text-[#00e054]/60 hover:text-[#00e054] transition-all active:scale-90 hover:bg-[#00e054]/5 rounded-xl border border-transparent hover:border-[#00e054]/10 group"
                    title="Create"
                  >
                    <Plus size={24} className={showActionMenu ? "rotate-45 transition-transform" : "transition-transform"} />
                  </button>

                  <AnimatePresence>
                    {showActionMenu && (
                      <>
                        {/* Mobile Overlay Backdrop */}
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onClick={() => setShowActionMenu(false)}
                          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[340] md:hidden"
                        />
                        
                        {/* Action Tray */}
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 45 }}
                          className="md:absolute md:top-full md:bottom-auto md:left-auto md:right-0 md:mt-3 md:w-56 bg-[#1a1c1d]/95 backdrop-blur-xl border border-white/10 md:rounded-2xl shadow-2xl py-3 z-[350] overflow-hidden will-change-transform"
                        >
                          <div className="px-5 py-3 border-b border-white/5 mb-2 md:hidden">
                             <span className="text-[10px] uppercase font-black tracking-widest text-white/20 text-center block">Creator Choice</span>
                          </div>
                          
                          <button
                            onClick={() => { setIsReelModalOpen(true); setShowActionMenu(false); }}
                            className="w-full flex items-center gap-4 px-6 py-4 md:py-3 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-white group"
                          >
                            <div className="w-10 h-10 md:w-8 md:h-8 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                              <Film size={18} className="text-orange-500" />
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                               <span>Reel Narrative</span>
                               <span className="text-[8px] text-white/20 md:hidden">Cinematic 70s Clip</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => { setIsLogModalOpen(true); setShowActionMenu(false); }}
                            className="w-full flex items-center gap-4 px-6 py-4 md:py-3 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-white group"
                          >
                            <div className="w-10 h-10 md:w-8 md:h-8 rounded-xl bg-[#00e054]/10 flex items-center justify-center group-hover:bg-[#00e054]/20 transition-colors">
                              <Plus size={20} className="text-[#00e054]" />
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                               <span>Culinary Log</span>
                               <span className="text-[8px] text-white/20 md:hidden">Dish-by-Dish Diary</span>
                            </div>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-1.5 md:gap-3 ml-1 md:ml-0 border-l border-white/5 pl-1 md:pl-4">
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifMenu(!showNotifMenu); setShowUserMenu(false); }}
                    className="p-2 text-white/40 hover:text-white transition-colors relative"
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
                        className="absolute right-[-60px] md:right-0 mt-3 w-[300px] bg-[#1a1c1d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[400] max-h-96 flex flex-col overflow-hidden will-change-transform"
                      >
                        <div className="p-4 border-b border-white/10">
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#00e054]">Activity</span>
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
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-[#00e054] transition-all active:scale-95"
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
                      className="absolute right-0 mt-3 w-52 bg-[#1a1c1d]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[400] will-change-transform"
                    >
                        <Link to={`/profile/${dishdUser?.username || user.uid}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white" onClick={() => setShowUserMenu(false)}>
                          <User size={14} className="text-[#00e054]" /> Profile
                        </Link>
                        <button onClick={() => { setIsSettingsOpen(true); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white">
                          <Settings size={14} className="text-orange-500" /> Settings
                        </button>
                        <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-[10px] font-black uppercase tracking-widest text-rose-500">
                          <LogOut size={14} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-[#00e054] transition-all shadow-xl active:scale-95"
              >
                In
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
