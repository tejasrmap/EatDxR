import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, User, LogOut, UtensilsCrossed, Bell, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { LogMealModal } from "./LogMealModal";
import { SearchOverlay } from "./SearchOverlay";
import { useAuth } from "../App";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { AppNotification } from "../types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function Navbar() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const { user, dishdUser, login, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut listener for Global Search (CMD+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    // Support for components to trigger search via custom event
    const handleOpenSearch = () => setIsSearchOpen(true);
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

    // Since we don't assume composite indexes are built by the user, we query by recipientId and sort locally
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as AppNotification[];
      
      // Sort newest first
      notifsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setNotifications(notifsData);
    }, (error) => {
      // Swallow missing permission errors from unauthorized localhost bounds safely
      console.warn("Notifications subscription error:", error.message);
    });

    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    setShowNotifMenu(false);
    
    // Mark as read if not already
    if (!notif.read) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), {
          read: true
        });
      } catch (error) {
        console.error("Failed to mark notification read", error);
      }
    }

    // Route to the actor's profile 
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
            <button 
              className="p-2 text-white/40 hover:text-white transition-colors flex items-center gap-2 group" 
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={18} />
              <span className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] font-bold text-white/30 group-hover:text-white/60 transition-colors">
                <span className="scale-110">⌘</span>K
              </span>
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
                
                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowNotifMenu(!showNotifMenu);
                      setShowUserMenu(false);
                    }}
                    className="p-2 text-white/40 hover:text-white transition-colors relative group"
                  >
                    <Bell size={18} className={unreadCount > 0 ? "text-white" : ""} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-[#14181c]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifMenu && (
                    <div className="absolute right-[-40px] sm:right-0 md:right-0 mt-2 w-[300px] sm:w-80 bg-[#2c3440] border border-white/10 rounded shadow-2xl z-[100] max-h-96 flex flex-col overflow-hidden">
                      <div className="p-3 border-b border-white/10 bg-black/20 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/80">Activity</span>
                      </div>
                      <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-white/30 text-xs italic serif">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div 
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${notif.read ? 'hover:bg-white/5 opacity-60' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                              <img 
                                src={notif.actorPhoto} 
                                alt={notif.actorName} 
                                className="w-8 h-8 rounded-full border border-white/10 mt-1" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 leading-tight">
                                  <span className="font-bold text-white">{notif.actorName}</span> {getNotificationText(notif)}
                                </p>
                                <span className="text-[10px] text-orange-500/80 font-bold uppercase tracking-tighter mt-1 block">
                                  {notif.createdAt?.toMillis ? formatDistanceToNow(notif.createdAt.toMillis(), { addSuffix: true }) : 'just now'}
                                </span>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar */}
                <div className="relative ml-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifMenu(false);
                    }}
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
                        to={`/profile/${dishdUser?.username || user.uid}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#445566] transition-colors text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={14} />
                        Profile
                      </Link>
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#445566] disabled:opacity-50 transition-colors text-xs font-bold uppercase tracking-widest text-red-400"
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
                className="bg-white text-black text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-sm hover:bg-zinc-200 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button 
              className="md:hidden p-2 text-white hover:text-orange-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Tray */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-[#14181c] border-b border-white/10 z-[90] p-4 flex flex-col gap-4 shadow-2xl">
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/restaurants" className="text-sm uppercase tracking-widest font-bold text-white/80 hover:text-white transition-colors p-2 bg-white/5 rounded">Restaurants</Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/lists" className="text-sm uppercase tracking-widest font-bold text-white/80 hover:text-white transition-colors p-2 bg-white/5 rounded">Lists</Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/critics" className="text-sm uppercase tracking-widest font-bold text-white/80 hover:text-white transition-colors p-2 bg-white/5 rounded">Critics</Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/journal" className="text-sm uppercase tracking-widest font-bold text-white/80 hover:text-white transition-colors p-2 bg-white/5 rounded">Journal</Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin/seed" className="text-sm uppercase tracking-widest font-bold text-[#00e054] hover:text-[#00c044] transition-colors p-2 bg-[#00e054]/10 border border-[#00e054]/20 rounded mt-2">Seed Database</Link>
          </div>
        )}
      </nav>

      <LogMealModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />

      <SearchOverlay 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
