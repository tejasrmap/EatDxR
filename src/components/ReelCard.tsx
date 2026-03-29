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
    <div className="snap-child relative w-full h-[calc(100vh-80px)] bg-black overflow-hidden border-b border-white/5">
      {/* Immersive Background Media */}
      <div className="absolute inset-0">
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={review.restaurantName}
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-zinc-900 to-rose-950">
             <div className="text-white/5 font-black text-9xl absolute -rotate-12 select-none">MOMENT</div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,224,84,0.1),transparent_70%)] animate-pulse" />
             <p className="relative z-10 text-[10px] uppercase tracking-[0.4em] text-white/20 font-black">Visual missing, flavor remains.</p>
          </div>
        )}
        {/* Gradients to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Top Header - User Info */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link to={`/profile/${review.userId}`} className="flex items-center gap-3 bg-black/20 backdrop-blur-3xl px-3 py-2 rounded-full border border-white/10 group">
           <img 
             src={review.userPhoto} 
             className="w-8 h-8 rounded-full border border-white/20"
             alt=""
           />
           <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-widest text-[#00e054] group-hover:text-white transition-colors">{review.userName}</span>
             <span className="text-[8px] text-white/40 font-bold uppercase">{formatDistanceToNow(parseFirebaseDate(review.createdAt), { addSuffix: true })}</span>
           </div>
        </Link>
        <div className="bg-black/40 backdrop-blur-3xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-1 shadow-xl">
           <Star size={10} className="fill-[#00e054] text-[#00e054]" />
           <span className="text-[10px] font-black text-white">{review.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Right Side - Quick Actions */}
      <div className="absolute right-6 bottom-32 flex flex-col gap-8 z-30">
          <div className="flex flex-col items-center gap-1 group">
             <button 
               onClick={() => setIsLiked(!isLiked)}
               className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center transition-all active:scale-75 ${isLiked ? 'text-rose-500' : 'text-white/60 hover:text-white'}`}
             >
               <Heart size={24} className={isLiked ? "fill-rose-500" : ""} />
             </button>
             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{review.likes || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1 group">
             <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-75">
               <MessageSquare size={24} />
             </button>
             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Say</span>
          </div>

          <Link to={`/restaurant/${review.restaurantId}`} className="w-12 h-12 rounded-full bg-[#00e054] flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,224,84,0.4)] transition-all active:scale-75">
             <Navigation size={22} />
          </Link>
      </div>

      {/* Bottom Overlay - Content & Restaurant */}
      <div className="absolute bottom-6 left-6 right-20 z-20 space-y-4">
          <div className="space-y-1">
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-2xl">{review.restaurantName}</h2>
              <div className="flex items-center gap-2 text-[#00e054] text-[10px] font-black uppercase tracking-widest">
                  <MapPin size={10} />
                  <span>{review.city || "Nearby Spot"} • {review.restaurantName || "Eats"}</span>
              </div>
          </div>
          
          {review.content && review.content.trim() && (
            <div className="bg-black/20 backdrop-blur-3xl border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00e054]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-sm font-serif italic text-white/90 leading-relaxed relative z-10">
                  "{review.content}"
                </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {review.dishes?.map((dish, i) => (
                <div key={i} className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{dish.name}</span>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};
