import { Star, Heart, MessageSquare, MapPin } from "lucide-react";
import { Review } from "../types";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const dishesWithImages = review.dishes?.filter(d => d.image) || [];
  const firstImage = dishesWithImages[0]?.image;

  const handleAction = (action: string) => {
    toast.info(`${action} feature coming soon!`);
  };

  return (
    <div className="group py-6 border-b border-white/5 last:border-0">
      <div className="flex gap-6">
        {/* Poster-style image */}
        <Link 
          to={`/restaurant/${review.restaurantId}`}
          className="w-24 h-36 bg-zinc-800 rounded-sm overflow-hidden flex-shrink-0 border border-white/10 shadow-lg relative"
        >
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={review.dishes?.[0]?.name || "Meal"} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 uppercase tracking-widest text-center px-2">
              No Photo
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                {review.dishes?.map((dish, i) => (
                  <React.Fragment key={i}>
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                      {dish.name}
                    </h3>
                    {i < review.dishes.length - 1 && <span className="text-white/20">&</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/40">at</span>
                <Link 
                  to={`/restaurant/${review.restaurantId}`} 
                  className="text-white/60 hover:text-white transition-colors underline decoration-white/10 underline-offset-4"
                >
                  {review.restaurantName}
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-0.5 text-orange-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    fill={i < review.rating ? "currentColor" : "none"} 
                    className={i < review.rating ? "fill-orange-500" : "text-white/10"}
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Link to={`/profile/${review.userId}`} className="flex items-center gap-1.5 group/user">
              <img 
                src={review.userPhoto} 
                alt={review.userName} 
                className="w-4 h-4 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs text-white/40 group-hover/user:text-white transition-colors">{review.userName}</span>
            </Link>
            {review.restaurantLocation && (
              <>
                <span className="text-white/10 text-[10px]">•</span>
                <div className="flex items-center gap-1 text-white/30 text-[10px] uppercase tracking-tighter">
                  <MapPin size={10} />
                  <span>{review.city || "Nearby"}</span>
                </div>
              </>
            )}
          </div>
          
          <p className="text-white/60 text-sm line-clamp-2 mb-4 leading-relaxed font-serif italic">
            "{review.content}"
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleAction("Like")}
              className="flex items-center gap-1.5 text-white/30 hover:text-orange-500 transition-colors group/btn"
            >
              <Heart size={14} className="group-hover/btn:fill-orange-500" />
              <span className="text-[10px] uppercase tracking-widest font-bold">{review.likes || 0}</span>
            </button>
            <button 
              onClick={() => handleAction("Comment")}
              className="flex items-center gap-1.5 text-white/30 hover:text-white transition-colors"
            >
              <MessageSquare size={14} />
              <span className="text-[10px] uppercase tracking-widest font-bold">Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
