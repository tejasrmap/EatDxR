import { Plus, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { triggerHaptic } from "../../services/nativeService";
import { MOCK_CRAVINGS, MOCK_CRITICS_DATA } from "../../data/mockData";

interface AppStoriesBarProps {
  onLogClick?: () => void;
}

export function AppStoriesBar({ onLogClick }: AppStoriesBarProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-3 px-4 border-b border-white/10 bg-black/40">
      <div className="flex items-center gap-3 w-max">
        
        {/* Your Story / Log Action */}
        <button
          onClick={() => { triggerHaptic(); onLogClick?.(); }}
          className="flex flex-col items-center gap-1 shrink-0 group text-center cursor-pointer"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 border border-dashed border-orange-500/60 flex items-center justify-center bg-zinc-900 group-hover:border-orange-500 transition-all">
            <div className="w-full h-full rounded-full bg-zinc-800/80 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
              <Plus size={20} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-black flex items-center justify-center font-bold text-[10px] shadow-md">
              +
            </div>
          </div>
          <span className="text-[10px] font-medium text-white/70 max-w-[56px] sm:max-w-[64px] truncate">
            Post
          </span>
        </button>

        {/* Live Stories from Cravings */}
        {MOCK_CRAVINGS.slice(0, 8).map((craving) => (
          <Link
            key={craving.id}
            to="/app/cravings"
            onClick={() => triggerHaptic()}
            className="flex flex-col items-center gap-1 shrink-0 group text-center cursor-pointer"
          >
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-orange-500 via-amber-400 to-pink-500 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-zinc-900">
                <img
                  src={craving.dishes?.[0]?.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"}
                  alt={craving.restaurantName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-black/80 flex items-center justify-center text-orange-400">
                <Play size={7} className="fill-orange-400" />
              </div>
            </div>
            <span className="text-[10px] font-medium text-white/70 max-w-[56px] sm:max-w-[64px] truncate">
              {craving.dishes?.[0]?.name || craving.attachedDish || craving.restaurantName}
            </span>
          </Link>
        ))}

        {/* Critics Stories */}
        {MOCK_CRITICS_DATA.slice(0, 4).map((critic) => (
          <Link
            key={critic.uid}
            to={`/app/profile/${critic.username || critic.uid}`}
            onClick={() => triggerHaptic()}
            className="flex flex-col items-center gap-1 shrink-0 group text-center cursor-pointer"
          >
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-orange-500 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-zinc-900">
                <img
                  src={critic.photoURL}
                  alt={critic.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] font-medium text-white/70 max-w-[56px] sm:max-w-[64px] truncate">
              {critic.displayName.split(" ")[0]}
            </span>
          </Link>
        ))}

      </div>
    </div>
  );
}
