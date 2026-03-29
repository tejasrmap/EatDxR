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
  const isAdmin = user?.email === 'tejag.vijay@gmail.com';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("OPEN_GLOBAL_SEARCH", handleOpenSearch);
    return () => window.removeEventListener("OPEN_GLOBAL_SEARCH", handleOpenSearch);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as AppNotification[];
      
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

  const isReelsMode = new URLSearchParams(window.location.search).get('mode') === 'reels';

  if (isReelsMode) return null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-3xl border-b border-white/5 h-16 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg group-hover:-rotate-12 transition-transform duration-300 shadow-lg shadow-rose-500/20">
              <UtensilsCrossed className="text-white w-3 h-3 md:w-4 md:h-4" />
            </div>
            <span className="text-white">
              Eat<span className="text-rose-500">D</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/restaurants" className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors">Restaurants</Link>
            <Link to="/critics" className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors">Critics</Link>
            <Link to="/journal" className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors">Journal</Link>
          </div>

          <div className="flex items-center gap-3">
             {/* Desktop Search */}
             <button 
               className="hidden md:flex p-2 text-white/40 hover:text-white transition-colors items-center gap-2 group" 
               onClick={() => setIsSearchOpen(true)}
             >
               <Search size={18} />
             </button>

             {user ? (
               <>
                 <button
                   onClick={() => setIsLogModalOpen(true)}
                   className="hidden md:flex bg-[#00e054] hover:bg-[#00c044] text-black text-[10px] uppercase tracking-widest font-black px-4 py-2 rounded-sm transition-colors items-center gap-2"
                 >
                   <Plus size={14} />
                   <span>Log</span>
                 </button>
                 
                 <div className="relative">
                   <button 
                     onClick={() => {
                       setShowNotifMenu(!showNotifMenu);
                       setShowUserMenu(false);
                     }}
                     className="p-2 text-white/40 hover:text-white transition-colors relative"
                   >
                     <Bell size={18} className={unreadCount > 0 ? "text-white" : ""} />
                     {unreadCount > 0 && (
                       <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-black">
                         {unreadCount > 9 ? '9+' : unreadCount}
                       </span>
                     )}
                   </button>
                   
                   {showNotifMenu && (
                     <div className="absolute right-[-20px] md:right-0 mt-3 w-[280px] sm:w-80 bg-[#1a1c1d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[150] max-h-96 flex flex-col overflow-hidden">
                       <div className="p-4 border-b border-white/10 flex justify-between items-center">
                         <span className="text-[10px] uppercase font-black tracking-widest text-[#00e054]">Activity Feed</span>
                       </div>
                       <div className="overflow-y-auto flex-1 p-2 space-y-1">
                         {notifications.length === 0 ? (
                           <div className="p-8 text-center text-white/20 text-xs italic serif">
                             No updates yet.
                           </div>
                         ) : (
                           notifications.map(notif => (
                             <div 
                               key={notif.id}
                               onClick={() => handleNotificationClick(notif)}
                               className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all ${notif.read ? 'hover:bg-white/5 opacity-60' : 'bg-white/5 hover:bg-white/10'}`}
                             >
                               <img 
                                 src={notif.actorPhoto} 
                                 alt=""
                                 className="w-10 h-10 rounded-full border border-white/10 mt-0.5 object-cover" 
                               />
                               <div className="flex-1 min-w-0">
                                 <p className="text-xs text-white/80 leading-snug">
                                   <span className="font-bold text-white">{notif.actorName}</span> {getNotificationText(notif)}
                                 </p>
                                 <span className="text-[9px] text-orange-500/80 font-black uppercase tracking-tighter mt-1 block">
                                   {notif.createdAt?.toMillis ? formatDistanceToNow(notif.createdAt.toMillis(), { addSuffix: true }) : 'just now'}
                                 </span>
                               </div>
                               {!notif.read && <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 animate-pulse" />}
                             </div>
                           ))
                         )}
                       </div>
                     </div>
                   )}
                 </div>

                 <div className="relative">
                   <button
                     onClick={() => {
                       setShowUserMenu(!showUserMenu);
                       setShowNotifMenu(false);
                     }}
                     className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border border-white/10 hover:border-[#00e054] transition-all"
                   >
                     <img
                       src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`}
                       alt="Profile"
                       className="w-full h-full object-cover"
                       referrerPolicy="no-referrer"
                     />
                   </button>

                   {showUserMenu && (
                     <div className="absolute right-0 mt-3 w-56 bg-[#1a1c1d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[150]">
                       <Link
                         to={`/profile/${dishdUser?.username || user.uid}`}
                         className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
                         onClick={() => setShowUserMenu(false)}
                       >
                         <User size={14} className="text-[#00e054]" />
                         Profile
                       </Link>
                       <button
                         onClick={() => { logout(); setShowUserMenu(false); }}
                         className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest text-rose-500"
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
                 className="bg-white text-black text-[10px] md:text-[11px] uppercase tracking-widest font-black px-4 md:px-5 py-2 md:py-2.5 rounded-xl hover:bg-[#00e054] transition-all shadow-xl active:scale-95"
               >
                 In
               </button>
             )}
          </div>
        </div>
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
