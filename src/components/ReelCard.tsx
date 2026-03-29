import React, { useState } from "react";
import { Star, Heart, MessageSquare, MapPin, Compass, Navigation } from "lucide-react";
import { Review } from "../types";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { useAuth } from "../App";
import { motion, AnimatePresence } from "motion/react";

interface ReelCardProps {
  review: Review;
}

export const ReelCard: React.FC<ReelCardProps> = ({ review }) => {
  const { dishdUser: currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  
  const firstImage = review.dishes?.find(d => d.image)?.image;

  return (
    <div className="snap-child relative w-full h-svh md:h-full bg-black overflow-hidden flex flex-col md:flex-row">
      
      {/* Media Section: Hero on Desktop, Full-bleed on Mobile */}
      <div className="relative w-full h-full md:w-[65%] shrink-0 overflow-hidden bg-zinc-900 shadow-2xl">
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={review.restaurantName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full mesh-gradient flex items-center justify-center">
             <div className="text-white/5 font-black text-9xl absolute -rotate-12 select-none">MOMENT</div>
          </div>
        )}
        {/* Mobile-only Gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 md:hidden" />

        {/* Desktop-only Action Overlay (Minimal) */}
        <div className="hidden md:flex absolute bottom-6 left-6 gap-4 z-20">
             <button 
               onClick={() => setIsLiked(!isLiked)}
               className={`w-14 h-14 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${isLiked ? 'text-rose-500' : 'text-white'}`}
             >
               <Heart size={28} className={isLiked ? "fill-rose-500" : ""} />
             </button>
             <Link to={`/restaurant/${review.restaurantId}`} className="w-14 h-14 rounded-full bg-[#00e054] flex items-center justify-center text-black shadow-lg shadow-[#00e054]/20 hover:scale-110 active:scale-90 transition-all">
                <Navigation size={28} />
             </Link>
        </div>
      </div>

      {/* Details Section: Sidebar on Desktop, Floating on Mobile */}
      <div className="absolute bottom-36 left-6 right-20 z-20 md:relative md:inset-0 md:flex-1 md:bg-black md:p-12 md:pb-32 md:flex md:flex-col md:justify-center md:border-l md:border-white/5 overflow-y-auto scrollbar-hide">
        
        {/* User Info - Top Left on Mobile, Header on Desktop Sidebar */}
        <div className="hidden md:flex items-center gap-4 mb-12">
            <Link to={`/profile/${review.userId}`} className="flex items-center gap-4 group">
                <img 
                  src={review.userPhoto} 
                  className="w-12 h-12 rounded-full border-2 border-white/10 group-hover:border-[#00e054] transition-all"
                  alt=""
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-all">Shared By</span>
                  <span className="text-sm font-black uppercase tracking-widest text-[#00e054]">{review.userName}</span>
                </div>
            </Link>
            <div className="ml-auto bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
               <Star size={14} className="fill-yellow-500 text-yellow-500" />
               <span className="text-sm font-black text-white">{review.rating.toFixed(1)}</span>
            </div>
        </div>

        {/* Mobile Header (Floating) */}
        <div className="md:hidden fixed top-28 left-6 right-6 flex items-center justify-between z-30">
            <Link to={`/profile/${review.userId}`} className="flex items-center gap-3 bg-black/60 backdrop-blur-3xl px-3 py-2 rounded-full border border-white/10">
               <img src={review.userPhoto} className="w-8 h-8 rounded-full border border-white/20" alt="" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00e054]">{review.userName}</span>
            </Link>
            <div className="bg-black/60 backdrop-blur-3xl px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1">
               <Star size={10} className="fill-[#00e054] text-[#00e054]" />
               <span className="text-[10px] font-black text-white">{review.rating.toFixed(1)}</span>
            </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#00e054] text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                    <MapPin size={12} />
                    <span>{review.city || "Nearby Spot"}</span>
                </div>
                <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-white">{review.restaurantName}</h2>
            </div>
            
            {review.content && review.content.trim() && (
              <div className="bg-white/5 md:bg-transparent md:border-l-2 md:border-white/10 md:pl-8 p-6 md:p-0 rounded-2xl md:rounded-none relative overflow-hidden group">
                  <p className="text-sm md:text-xl font-serif italic text-white/90 leading-relaxed relative z-10 md:max-w-md">
                    "{review.content}"
                  </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 md:pt-4">
              {review.dishes?.slice(0, 4).map((dish, i) => (
                  <div key={i} className="px-4 py-1.5 bg-white/5 md:bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60">{dish.name}</span>
                  </div>
              ))}
            </div>
        </div>

        {/* Mobile Side Actions */}
        <div className="md:hidden fixed right-4 bottom-40 flex flex-col gap-6 z-30">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`w-12 h-12 rounded-full bg-black/60 backdrop-blur-3xl border border-white/10 flex items-center justify-center ${isLiked ? 'text-rose-500' : 'text-white'}`}
            >
              <Heart size={24} className={isLiked ? "fill-rose-500" : ""} />
            </button>
            <Link to={`/restaurant/${review.restaurantId}`} className="w-12 h-12 rounded-full bg-[#00e054] flex items-center justify-center text-black shadow-lg shadow-[#00e054]/20">
               <Navigation size={22} />
            </Link>
        </div>
      </div>
    </div>
  );
};
