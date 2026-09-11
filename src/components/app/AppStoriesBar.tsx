import { useState } from "react";
import { Plus, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { triggerHaptic } from "../../services/nativeService";
import { MOCK_CRAVINGS, MOCK_CRITICS_DATA } from "../../data/mockData";
import { motion } from "motion/react";

interface AppStoriesBarProps {
  onLogClick?: () => void;
}

export function AppStoriesBar({ onLogClick }: AppStoriesBarProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-3 px-3 sm:px-4 rounded-2xl sm:rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-md shadow-xl mb-3 sm:mb-4 snap-x snap-mandatory">
      <div className="flex items-center gap-3.5 sm:gap-4 w-max">
        
        {/* Your Story / Log Action */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { triggerHaptic(); onLogClick?.(); }}
          className="flex flex-col items-center gap-1.5 shrink-0 group text-center cursor-pointer snap-start"
        >
          <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full p-0.5 border-2 border-dashed border-orange-500/70 flex items-center justify-center bg-zinc-900 group-hover:border-orange-400 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">
            <div className="w-full h-full rounded-full bg-zinc-850 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
              <Plus size={22} className="text-orange-400" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black flex items-center justify-center font-black text-[11px] shadow-lg border-2 border-black">
              +
            </div>
          </div>
          <span className="text-[10px] font-semibold text-white/80 max-w-[60px] sm:max-w-[66px] truncate group-hover:text-orange-400 transition-colors">
            Post Craving
          </span>
        </motion.button>

        {/* Live Stories from Cravings */}
        {MOCK_CRAVINGS.slice(0, 8).map((craving) => {
          const isLoaded = !!loadedImages[craving.id];
          return (
            <motion.div
              key={craving.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 snap-start"
            >
              <Link
                to="/app/cravings"
                onClick={() => triggerHaptic()}
                className="flex flex-col items-center gap-1.5 group text-center cursor-pointer block"
              >
                <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-orange-500 via-amber-400 to-rose-500 shadow-md group-hover:shadow-[0_0_16px_rgba(249,115,22,0.45)] transition-all">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-zinc-950 bg-zinc-900 relative">
                    {!isLoaded && (
                      <div className="absolute inset-0 skeleton-shimmer" />
                    )}
                    <img
                      src={craving.dishes?.[0]?.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"}
                      alt={craving.restaurantName}
                      onLoad={() => handleImageLoad(craving.id)}
                      className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                        isLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-black/90 border border-white/20 flex items-center justify-center text-orange-400 shadow-md">
                    <Play size={8} className="fill-orange-400 ml-0.5" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-white/80 max-w-[60px] sm:max-w-[66px] truncate group-hover:text-orange-400 transition-colors">
                  {craving.dishes?.[0]?.name || craving.attachedDish || craving.restaurantName}
                </span>
              </Link>
            </motion.div>
          );
        })}

        {/* Critics Stories */}
        {MOCK_CRITICS_DATA.slice(0, 4).map((critic) => {
          const isLoaded = !!loadedImages[critic.uid];
          return (
            <motion.div
              key={critic.uid}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 snap-start"
            >
              <Link
                to={`/app/profile/${critic.username || critic.uid}`}
                onClick={() => triggerHaptic()}
                className="flex flex-col items-center gap-1.5 group text-center cursor-pointer block"
              >
                <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 shadow-md group-hover:shadow-[0_0_16px_rgba(168,85,247,0.4)] transition-all">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-zinc-950 bg-zinc-900 relative">
                    {!isLoaded && (
                      <div className="absolute inset-0 skeleton-shimmer" />
                    )}
                    <img
                      src={critic.photoURL}
                      alt={critic.displayName}
                      onLoad={() => handleImageLoad(critic.uid)}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      loading="lazy"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-white/80 max-w-[60px] sm:max-w-[66px] truncate group-hover:text-purple-300 transition-colors">
                  {critic.displayName.split(" ")[0]}
                </span>
              </Link>
            </motion.div>
          );
        })}

      </div>
    </div>
  );
}
