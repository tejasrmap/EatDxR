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
    <div className="snap-child relative w-full h-svh md:h-screen bg-black overflow-hidden flex items-center justify-center">
      
      {/* 1. Centered Media Container (Aspect-Ratio controlled on Desktop, Card-centric on Mobile) */}
      <div className="relative w-[92%] h-[78vh] md:w-full md:h-[88vh] md:aspect-[9/16] md:max-w-md bg-zinc-900 rounded-3xl md:rounded-3xl shadow-2xl md:overflow-visible overflow-hidden group mb-12 md:mb-0">
        
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


        {/* 3. Bottom-Left Content Overlay (Refined Mobile View - 'Before the Bar') */}
        <div className="absolute bottom-6 left-5 right-20 z-20 space-y-4 md:hidden">
             <div className="space-y-3">
                {/* Author + Follow Row */}
                <div className="flex items-center gap-2">
                    <Link to={`/profile/${review.userId}`} className="flex items-center gap-2 group">
                        <img src={review.userPhoto} className="w-8 h-8 rounded-full border border-white/20" alt="" />
                        <span className="text-[11px] font-black text-white/80 tracking-tight">{review.userName}</span>
                    </Link>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-[10px] font-black uppercase text-[#00e054] tracking-widest">Follow</span>
                </div>

                <div className="space-y-1">
                   <div className="flex items-center gap-2 text-[#00e054] text-[9px] font-bold uppercase tracking-widest opacity-70">
                       <MapPin size={9} />
                       <span>{review.city || "Nearby Spot"}</span>
                       <div className="flex items-center gap-0.5 ml-1">
                          <Star size={9} className="fill-[#00e054] text-[#00e054]" />
                          <span className="text-white">{review.rating.toFixed(1)}</span>
                       </div>
                   </div>
                   <h2 className="text-lg font-black uppercase tracking-tighter leading-[1.1] text-white">{review.restaurantName}</h2>
                   
                   {review.content && review.content.trim() && (
                     <p className="text-[13px] font-medium text-white/80 leading-relaxed max-w-[240px] line-clamp-2 italic serif">
                       "{review.content}"
                     </p>
                   )}
                </div>
             </div>

             <div className="flex flex-wrap gap-1.5 pt-1">
                {review.dishes?.slice(0, 2).map((dish, i) => (
                    <div key={i} className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md border border-white/5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-white/50">{dish.name}</span>
                    </div>
                ))}
             </div>
        </div>

        {/* 4. Side Interaction Column (Floating - Desktop Right, Mobile Right) */}
        <div className="absolute right-4 bottom-24 md:bottom-10 md:right-auto md:left-[calc(100%+1.5rem)] flex flex-col items-center gap-6 md:gap-8 z-30 pointer-events-auto">
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

        {/* 5. Desktop-Only Data Column (Floating Left Side) */}
        <div className="hidden md:flex absolute right-[calc(100%+1.5rem)] md:left-auto md:bottom-10 flex-col items-end text-right gap-6 w-96 z-30 pointer-events-none">
             {/* Desktop Author Info Addition */}
             <div className="flex items-center gap-3 mb-2 pointer-events-auto">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00e054]">{review.userName}</span>
                  <div className="flex items-center gap-1 opacity-40">
                     <Star size={8} className="fill-white text-white" />
                     <span className="text-[9px] font-black text-white">{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                <img src={review.userPhoto} className="w-8 h-8 rounded-full border border-white/10" alt="" />
             </div>

             <div className="space-y-1.5 pointer-events-auto">
                <div className="flex items-center justify-end gap-2 text-[#00e054] text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
                    <span>{review.city || "Nearby Spot"}</span>
                    <MapPin size={10} />
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight text-white mb-1">{review.restaurantName}</h2>
                
                {review.content && review.content.trim() && (
                  <p className="text-sm font-medium text-white/50 italic serif leading-relaxed max-w-[280px]">
                    "{review.content}"
                  </p>
                )}
             </div>

             <div className="flex flex-wrap justify-end gap-2 pt-2 pointer-events-auto">
                {review.dishes?.slice(0, 4).map((dish, i) => (
                    <div key={i} className="px-3 py-1 bg-white/5 hover:bg-white/10 transition-colors rounded-full border border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{dish.name}</span>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};
