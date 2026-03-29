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
        // 1. Search Local Firestore first
        const capitalized = q.charAt(0).toUpperCase() + q.slice(1);
        
        const userQuery = query(
          collection(db, "users"),
          where("displayName", ">=", capitalized),
          where("displayName", "<=", capitalized + "\uf8ff"),
          limit(5)
        );
        
        const restQuery = query(
          collection(db, "restaurants"),
          where("name", ">=", capitalized),
          where("name", "<=", capitalized + "\uf8ff"),
          limit(5)
        );

        const [userSnap, restSnap] = await Promise.all([
          getDocs(userQuery),
          getDocs(restQuery)
        ]);

        const localUsers = userSnap.docs.map(d => d.data() as User);
        const localRests = restSnap.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
        
        setUserResults(localUsers);
        setRestaurantResults(localRests);

        // 2. If fewer than 2 local restaurants, trigger AI Backfill
        if (localRests.length < 2) {
          const aiRests = await searchRestaurants(q);
          
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
        <div className="fixed inset-0 z-[400] flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
          >
            {/* Search Input Area */}
            <div className="p-6 border-b border-white/10 relative">
              <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-white/20" size={24} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search database for foodies, cafes, or cuisines..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-14 pr-12 py-4 text-xl font-medium focus:outline-none focus:ring-2 ring-orange-500/50 transition-all text-white placeholder:text-white/20"
              />
              <button 
                onClick={onClose}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results Area */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {!searchQuery && (
                <div className="p-12 text-center">
                  <p className="text-white/20 text-sm uppercase tracking-[0.2em] font-bold">Try searching for "Pizza", "Ramen", or "Teja"</p>
                </div>
              )}

              {isSearching && (
                <div className="p-12 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <Loader2 className="animate-spin text-orange-500" size={32} />
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
                    />
                  </div>
                  <p className="text-white/40 italic flex items-center gap-2">
                    Discovering hidden gems via AI...
                  </p>
                </div>
              )}

              {!isSearching && searchQuery && userResults.length === 0 && restaurantResults.length === 0 && (
                <div className="p-12 text-center text-white/40">
                  <p className="serif italic">No matches found across the platform.</p>
                </div>
              )}

              {(userResults.length > 0 || restaurantResults.length > 0) && (
                <div className="p-4 space-y-8 pb-8">
                  {/* Restaurant Results */}
                  {restaurantResults.length > 0 && (
                    <section>
                      <h3 className="px-4 text-[10px] uppercase tracking-[0.2em] font-black text-white/20 mb-3 ml-1 flex justify-between items-center">
                        Establishments
                        {restaurantResults.some(r => (r as any).isAiGenerated) && (
                          <span className="text-blue-500 flex items-center gap-1 normal-case tracking-normal font-medium">
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
                            className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all group"
                          >
                            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500 shrink-0 relative">
                              <UtensilsCrossed size={18} />
                              {(rest as any).isAiGenerated && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-zinc-900" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-white group-hover:text-orange-500 transition-colors truncate">{rest.name}</h4>
                                {(rest as any).isAiGenerated && (
                                  <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] text-blue-400 font-bold uppercase tracking-wider">AI</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-white/40 text-xs">
                                <span className="uppercase tracking-widest">{rest.cuisine}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <MapPin size={10} />
                                  <span>{rest.location}</span>
                                </div>
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-white/0 group-hover:text-white/40 transition-all -translate-x-4 group-hover:translate-x-0" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* User Results */}
                  {userResults.length > 0 && (
                    <section>
                      <h3 className="px-4 text-[10px] uppercase tracking-[0.2em] font-black text-white/20 mb-3 ml-1">Food Critics</h3>
                      <div className="space-y-1">
                        {userResults.map(user => (
                          <Link 
                            key={user.uid} 
                            to={`/profile/${user.username || user.uid}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all group"
                          >
                            <div className="relative shrink-0">
                              <img 
                                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                                alt={user.displayName}
                                className="w-12 h-12 rounded-full object-cover border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 rounded-full bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg text-white group-hover:text-orange-500 transition-colors truncate">{user.displayName}</h4>
                              <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">
                                @{user.username || 'critic'} • {user.stats?.reviewsWritten || 0} reviews
                              </p>
                            </div>
                            <ArrowRight size={16} className="text-white/0 group-hover:text-white/40 transition-all -translate-x-4 group-hover:translate-x-0" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Hint */}
            <div className="px-6 py-3 border-t border-white/5 bg-black/20 text-[10px] text-white/20 uppercase tracking-widest font-bold flex justify-between">
              <span>Universal Platform Search</span>
              <span className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">ESC</span> to Close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
