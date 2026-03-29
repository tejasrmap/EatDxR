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
    <div className="snap-child relative w-full h-[calc(100vh-80px)] bg-zinc-950 overflow-hidden border-b border-white/5 flex items-center justify-center">
      {/* Blurred Backdrop for Desktop */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <img 
          src={firstImage || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80`} 
          alt="" 
          className="w-full h-full object-cover blur-[100px] opacity-30 scale-125"
        />
      </div>

      {/* Immersive Background Media */}
      <div className="relative w-full h-full md:aspect-[9/16] md:h-full md:max-w-[450px] overflow-hidden z-10 shadow-2xl">
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={review.restaurantName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full mesh-gradient">
             <div className="text-white/5 font-black text-9xl absolute -rotate-12 select-none">MOMENT</div>
          </div>
        )}
        {/* Gradients to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/60" />
      </div>

      {/* Top Header - User Info */}
      <div className="absolute top-28 md:top-24 left-6 right-6 md:left-auto md:right-auto md:w-full md:max-w-[400px] flex items-center justify-between z-30">
        <Link to={`/profile/${review.userId}`} className="flex items-center gap-3 bg-black/40 backdrop-blur-3xl px-3 py-2 rounded-full border border-white/10 group">
           <img 
             src={review.userPhoto} 
             className="w-8 h-8 rounded-full border border-white/20"
             alt=""
           />
           <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00e054] group-hover:text-white transition-all">{review.userName}</span>
             <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{formatDistanceToNow(parseFirebaseDate(review.createdAt), { addSuffix: true })}</span>
           </div>
        </Link>
        <div className="bg-black/60 backdrop-blur-3xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-1 shadow-2xl">
           <Star size={10} className="fill-[#00e054] text-[#00e054]" />
           <span className="text-[10px] font-black text-white">{review.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Right Side - Quick Actions */}
      <div className="absolute right-4 bottom-40 flex flex-col gap-6 z-30 md:right-1/2 md:translate-x-[210px]">
          <div className="flex flex-col items-center gap-1 group">
             <button 
               onClick={() => setIsLiked(!isLiked)}
               className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center transition-all active:scale-75 ${isLiked ? 'text-rose-500' : 'text-white/60 hover:text-white'}`}
             >
               <Heart size={20} className={isLiked ? "fill-rose-500" : ""} />
             </button>
             <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{review.likes || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1 group">
             <button className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-75">
               <MessageSquare size={20} />
             </button>
             <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Say</span>
          </div>

          <Link to={`/restaurant/${review.restaurantId}`} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#00e054] flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,224,84,0.4)] transition-all active:scale-75">
             <Navigation size={18} />
          </Link>
      </div>

      {/* Bottom Overlay - Content & Restaurant */}
      <div className="absolute bottom-36 left-6 right-20 z-20 space-y-3 md:left-1/2 md:-translate-x-[200px] md:max-w-[340px]">
          <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight text-white drop-shadow-2xl">{review.restaurantName}</h2>
              <div className="flex items-center gap-2 text-[#00e054] text-[9px] font-black uppercase tracking-widest">
                  <MapPin size={10} />
                  <span>{review.city || "Nearby Spot"} • {review.restaurantName || "Eats"}</span>
              </div>
          </div>
          
          {review.content && review.content.trim() && (
            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-3 rounded-xl relative overflow-hidden group shadow-2xl">
                <p className="text-xs font-serif italic text-white leading-relaxed relative z-10">
                  "{review.content}"
                </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {review.dishes?.slice(0, 2).map((dish, i) => (
                <div key={i} className="px-2 py-0.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{dish.name}</span>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};
