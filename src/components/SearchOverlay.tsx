import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, User as UserIcon, UtensilsCrossed, MapPin, Loader2, ArrowRight } from "lucide-react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { User, Restaurant } from "../types";
import { Link, useNavigate } from "react-router-dom";
import { searchRestaurants } from "../services/mapsService";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [restaurantResults, setRestaurantResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Handle keyboard shortcuts (CMD/CTRL + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose(); 
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setSearchQuery("");
      setUserResults([]);
      setRestaurantResults([]);
    }
  }, [isOpen]);

  // Debounced Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const q = searchQuery.trim();
      if (q.length < 2) {
        setUserResults([]);
        setRestaurantResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // 1. Process variants for multi-field case-insensitive search
        const rawQ = searchQuery.trim().replace(/^@/, ''); // Strip leading @
        const capitalized = rawQ.charAt(0).toUpperCase() + rawQ.slice(1);
        const lowercase = rawQ.toLowerCase();
        
        // --- 1. SEARCH USERS (Multi-field & Case Strategy) ---
        const userDisplayNameQuery = query(
          collection(db, "users"),
          where("displayName", ">=", capitalized),
          where("displayName", "<=", capitalized + "\uf8ff"),
          limit(5)
        );

        const userUsernameQuery = query(
          collection(db, "users"),
          where("username", ">=", lowercase),
          where("username", "<=", lowercase + "\uf8ff"),
          limit(5)
        );
        
        // --- 2. SEARCH RESTAURANTS ---
        const restQuery = query(
          collection(db, "restaurants"),
          where("name", ">=", capitalized),
          where("name", "<=", capitalized + "\uf8ff"),
          limit(5)
        );

        const [userDNSnap, userUNSnap, restSnap] = await Promise.all([
          getDocs(userDisplayNameQuery),
          getDocs(userUsernameQuery),
          getDocs(restQuery)
        ]);

        // Merge and Deduplicate Users by uid
        const userMap = new Map<string, User>();
        [...userDNSnap.docs, ...userUNSnap.docs].forEach(doc => {
          const u = doc.data() as User;
          userMap.set(u.uid, u);
        });
        const localUsers = Array.from(userMap.values());

        const localRests = restSnap.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
        
        setUserResults(localUsers);
        setRestaurantResults(localRests);

        // 2. If fewer than 2 local restaurants, trigger AI Backfill
        if (localRests.length < 2) {
          const aiRests = await searchRestaurants(rawQ);
          
          // Merge AI results with local ones, ensuring no duplicates by name
          setRestaurantResults(prev => {
            const existingNames = new Set(prev.map(r => r.name.toLowerCase()));
            const uniqueAiRests = aiRests
              .filter(r => !existingNames.has(r.name.toLowerCase()))
              .map(r => ({ 
                ...r, 
                id: r.id || `ai_${Math.random()}`,
                name: r.name,
                cuisine: r.cuisine,
                location: r.location,
                rating: r.rating || 4.5,
                reviewCount: r.reviewCount || 10,
                isAiGenerated: true 
              } as Restaurant & { isAiGenerated?: boolean })); 
            
            return [...prev, ...uniqueAiRests];
          });
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce to avoid overwhelming OpenRouter

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-start justify-center pt-[calc(env(safe-area-inset-top,0px)+12px)] sm:pt-20 px-2.5 sm:px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            className="relative w-full max-w-lg bg-background border border-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[72vh]"
          >
            {/* Search Input Area */}
            <div className="p-2.5 sm:p-3.5 border-b border-border relative flex items-center">
              <Search className="absolute left-5 sm:left-6 text-muted-foreground" size={15} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search foodies, cafes, dishes, or cuisines..."
                className="w-full bg-muted/80 border border-border/80 rounded-xl pl-8 sm:pl-9 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1.5 focus:ring-orange-500/50 transition-all text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-10 sm:right-11 p-1 hover:bg-muted rounded-full text-muted-foreground"
                >
                  <X size={13} />
                </button>
              )}
              <button 
                onClick={onClose}
                className="ml-2 p-1.5 hover:bg-muted/80 rounded-full transition-colors text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Results Area */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {!searchQuery && (
                <div className="py-8 px-4 text-center">
                  <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-[0.15em] font-bold">
                    Try searching for "Biryani", "Ramen", or "Pizza"
                  </p>
                </div>
              )}

              {isSearching && (
                <div className="py-8 px-4 flex flex-col items-center justify-center gap-2.5">
                  <div className="relative">
                    <Loader2 className="animate-spin text-orange-500" size={24} />
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs italic flex items-center gap-1.5">
                    Discovering culinary destinations...
                  </p>
                </div>
              )}

              {!isSearching && searchQuery && userResults.length === 0 && restaurantResults.length === 0 && (
                <div className="py-8 px-4 text-center text-muted-foreground">
                  <p className="text-xs italic">No matches found across the platform.</p>
                </div>
              )}

              {(userResults.length > 0 || restaurantResults.length > 0) && (
                <div className="p-2 sm:p-3 space-y-4 pb-4">
                  {/* Restaurant Results */}
                  {restaurantResults.length > 0 && (
                    <section>
                      <h3 className="px-2.5 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground mb-1.5 flex justify-between items-center">
                        Establishments
                        {restaurantResults.some(r => (r as any).isAiGenerated) && (
                          <span className="text-blue-500 flex items-center gap-1 normal-case tracking-normal font-medium text-[9px]">
                            AI Backfilled
                          </span>
                        )}
                      </h3>
                      <div className="space-y-1">
                        {restaurantResults.map(rest => (
                          <Link 
                            key={rest.id} 
                            to={`/restaurant/${rest.id}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-2.5 p-2 sm:p-2.5 hover:bg-muted/80 rounded-xl transition-all group"
                          >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500 shrink-0 relative">
                              <UtensilsCrossed size={15} />
                              {(rest as any).isAiGenerated && (
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-background" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-orange-500 transition-colors truncate">{rest.name}</h4>
                                {(rest as any).isAiGenerated && (
                                  <span className="px-1 py-0.2 bg-blue-500/10 border border-blue-500/20 rounded text-[7px] text-blue-400 font-bold uppercase tracking-wider">AI</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] sm:text-[11px] mt-0.5">
                                <span className="uppercase tracking-wider font-semibold text-orange-400/90">{rest.cuisine}</span>
                                <span>•</span>
                                <div className="flex items-center gap-0.5 truncate">
                                  <MapPin size={9} className="shrink-0" />
                                  <span className="truncate">{rest.location}</span>
                                </div>
                              </div>
                            </div>
                            <ArrowRight size={13} className="text-foreground/0 group-hover:text-muted-foreground transition-all -translate-x-2 group-hover:translate-x-0 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* User Results */}
                  {userResults.length > 0 && (
                    <section>
                      <h3 className="px-2.5 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground mb-1.5">Food Critics</h3>
                      <div className="space-y-1">
                        {userResults.map(user => (
                          <Link 
                            key={user.uid} 
                            to={`/profile/${user.username || user.uid}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-2.5 p-2 sm:p-2.5 hover:bg-muted/80 rounded-xl transition-all group"
                          >
                            <div className="relative shrink-0">
                              <img 
                                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                                alt={user.displayName}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-border"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-orange-500 transition-colors truncate">{user.displayName}</h4>
                              <p className="text-muted-foreground text-[10px] sm:text-[11px] uppercase tracking-wider mt-0.5">
                                @{user.username || 'critic'} • {user.stats?.reviewsWritten || 0} reviews
                              </p>
                            </div>
                            <ArrowRight size={13} className="text-foreground/0 group-hover:text-muted-foreground transition-all -translate-x-2 group-hover:translate-x-0 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Hint */}
            <div className="px-3.5 py-2 border-t border-border bg-muted/20 text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-bold flex justify-between items-center">
              <span>Universal Food Search</span>
              <button onClick={onClose} className="text-orange-400 hover:underline">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
