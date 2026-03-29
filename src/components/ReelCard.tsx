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
    <div className="snap-child relative w-full h-svh md:h-screen bg-black overflow-hidden md:flex md:items-center md:justify-center">
      
      {/* 1. Centered Media Container (Aspect-Ratio controlled on Desktop) */}
      <div className="relative w-full h-full md:h-[85vh] md:aspect-[9/16] md:max-w-md bg-zinc-900 md:rounded-3xl shadow-2xl md:overflow-visible overflow-hidden group">
        
        {/* Background Image */}
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={review.restaurantName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full mesh-gradient opacity-10" />
        )}

        {/* Unified Bottom Gradient for Text Legibility */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10" />

        {/* 2. Top-Periphery Header (Author Info) */}
        <div className="absolute top-20 md:top-6 left-6 right-6 flex items-center justify-between z-30 pointer-events-none">
            <Link to={`/profile/${review.userId}`} className="flex items-center gap-2 bg-black/40 backdrop-blur-3xl px-2 py-1.5 rounded-full border border-white/5 pointer-events-auto">
               <img src={review.userPhoto} className="w-6 h-6 rounded-full border border-white/10" alt="" />
               <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/80">{review.userName}</span>
            </Link>
            <div className="bg-black/40 backdrop-blur-3xl px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-1">
               <Star size={10} className="fill-[#00e054] text-[#00e054]" />
               <span className="text-[10px] md:text-xs font-black text-white">{review.rating.toFixed(1)}</span>
            </div>
        </div>

        {/* 3. Bottom-Left Content Overlay */}
        <div className="absolute bottom-6 md:bottom-8 left-6 right-6 z-20 space-y-4">
             <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#00e054] text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-80">
                    <MapPin size={10} />
                    <span>{review.city || "Nearby Spot"}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight text-white">{review.restaurantName}</h2>
                
                {review.content && review.content.trim() && (
                  <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed max-w-[280px] line-clamp-3">
                    "{review.content}"
                  </p>
                )}
             </div>

             <div className="flex flex-wrap gap-2">
                {review.dishes?.slice(0, 3).map((dish, i) => (
                    <div key={i} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/5">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/60">{dish.name}</span>
                    </div>
                ))}
             </div>
        </div>

        {/* 4. Side Interaction Column (Right) */}
        {/* On Mobile: Absolute right; On Desktop: Pushed outside the container */}
        <div className="absolute right-4 bottom-24 md:bottom-0 md:-right-24 flex flex-col items-center gap-6 md:gap-8 z-30 pointer-events-auto">
            <div className="flex flex-col items-center gap-1.5 group/btn">
                <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 md:bg-white/5 backdrop-blur-3xl border border-white/5 flex items-center justify-center transition-all active:scale-95 ${isLiked ? 'text-rose-500 shadow-lg shadow-rose-500/20' : 'text-white/40 hover:text-white group-hover/btn:bg-white/10'}`}
                >
                  <Heart size={isLiked ? 24 : 22} className={isLiked ? "fill-rose-500" : ""} />
                </button>
                <span className="text-[9px] md:text-[11px] font-black uppercase text-white/40 tracking-widest">Like</span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 group/btn">
                <Link to={`/restaurant/${review.id}`} className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 backdrop-blur-3xl border border-white/5 flex items-center justify-center text-white/40 hover:text-[#00e054] group-hover/btn:bg-white/10 transition-all active:scale-95">
                   <MessageSquare size={22} />
                </Link>
                <span className="text-[9px] md:text-[11px] font-black uppercase text-white/40 tracking-widest">Chat</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 group/btn">
                <Link to={`/restaurant/${review.restaurantId}`} className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#00e054]/20 md:bg-[#00e054]/5 backdrop-blur-3xl border border-white/5 flex items-center justify-center text-[#00e054] shadow-lg shadow-[#00e054]/5 active:scale-95 transition-all group-hover/btn:bg-[#00e054]/10">
                   <Navigation size={22} />
                </Link>
                <span className="text-[9px] md:text-[11px] font-black uppercase text-white/40 tracking-widest">Go</span>
            </div>
        </div>
      </div>
    </div>
  );
};
