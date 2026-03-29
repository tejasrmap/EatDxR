import React, { useState } from "react";
import { Star, Heart, MessageSquare, MapPin, MoreVertical } from "lucide-react";
import { Review } from "../types";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { useAuth } from "../App";
import { motion } from "motion/react";

interface PostCardProps {
  review: Review;
}

export const PostCard: React.FC<PostCardProps> = ({ review }) => {
  const { dishdUser: currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false); // Local state for immediate feedback
  
  const firstImage = review.dishes?.find(d => d.image)?.image;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#14181c] border border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-12 group"
    >
      {/* User Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${review.userId}`} className="flex items-center gap-3">
          <img 
            src={review.userPhoto} 
            alt="" 
            className="w-8 h-8 rounded-full border border-white/10"
          />
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-white/90">{review.userName}</span>
            <span className="text-[10px] md:text-xs text-white/40 font-bold uppercase tracking-widest">
                {formatDistanceToNow(parseFirebaseDate(review.createdAt), { addSuffix: true })}
            </span>
          </div>
        </Link>
        <button className="text-white/20 hover:text-white transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Primary Media */}
      <div className="relative aspect-square md:aspect-video bg-zinc-900 overflow-hidden">
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={review.restaurantName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 italic serif">
             <span className="text-6xl opacity-5">NO PHOTO</span>
             <p className="text-xs uppercase tracking-[0.3em]">Moment Witnessed</p>
          </div>
        )}
        
        {/* Restaurant Badge Layer */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Link to={`/restaurant/${review.restaurantId}`} className="bg-black/60 backdrop-blur-3xl border border-white/10 px-4 py-2 rounded-full inline-flex items-center gap-2 group/rest transform group-hover:translate-x-1 transition-transform">
                <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[#00e054] group-hover/rest:text-white transition-colors">{review.restaurantName}</span>
            </Link>
        </div>

        {/* Rating Overlay */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-3xl border border-white/10 p-2 rounded-full">
            <div className="flex items-center gap-0.5 text-[#00e054]">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={10} 
                        fill={i < review.rating ? "currentColor" : "none"}
                        className={i < review.rating ? "" : "text-white/20"}
                    />
                ))}
            </div>
        </div>
      </div>

      {/* Content Layer */}
      <div className="p-6">
        <div className="flex items-center gap-6 mb-4">
           <button 
             onClick={() => setIsLiked(!isLiked)}
             className={`flex items-center gap-2 transition-all ${isLiked ? 'text-rose-500' : 'text-white/40 hover:text-white'}`}
           >
             <Heart size={22} className={isLiked ? "fill-rose-500" : ""} />
             <span className="text-xs font-black">{review.likes || 0}</span>
           </button>
           <button className="flex items-center gap-2 text-white/40 hover:text-white transition-all">
             <MessageSquare size={22} />
             <span className="text-xs font-black">Discuss</span>
           </button>
        </div>

        <div className="space-y-2">
            <div className="flex items-baseline gap-2">
                <span className="text-xs md:text-sm font-black uppercase tracking-wider text-white">{review.userName}</span>
                <p className="text-base md:text-xl font-serif italic text-white/80 leading-relaxed md:leading-[1.6]">
                   "{review.content}"
                </p>
            </div>
            
            {review.dishes && review.dishes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {review.dishes.map((dish, i) => (
                        <span key={i} className="text-[10px] md:text-xs uppercase font-black tracking-widest text-[#00e054]/60 bg-[#00e054]/5 px-3 py-1 rounded-full border border-[#00e054]/10">
                            {dish.name}
                        </span>
                    ))}
                </div>
            )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-white/20">
            <MapPin size={12} />
            <span className="text-[9px] uppercase font-bold tracking-widest">{review.city || "Nearby Spot"}</span>
        </div>
      </div>
    </motion.div>
  );
};
