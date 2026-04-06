import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
  activeColor?: string;
  inactiveColor?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  size = 18, 
  className = "flex items-center gap-1",
  activeColor = "text-orange-500",
  inactiveColor = "text-white/20"
}) => {
  return (
    <div className={className}>
      {[...Array(5)].map((_, i) => {
        const diff = rating - i;
        
        // Full star
        if (diff >= 1) {
          return (
            <Star 
              key={i} 
              size={size} 
              fill="currentColor" 
              className={`${activeColor} fill-current`} 
            />
          );
        } 
        // Half star. We wrap it in a relative container to overlay on the empty outline
        else if (diff >= 0.5) {
          return (
            <div key={i} className="relative inline-flex" style={{ width: size, height: size }}>
              <Star size={size} className={inactiveColor} />
              <div className={`absolute inset-0 overflow-hidden ${activeColor} fill-current`} style={{ width: '50%' }}>
                  <Star size={size} fill="currentColor" />
              </div>
            </div>
          );
        } 
        // Empty star
        else {
          return (
            <Star 
              key={i} 
              size={size} 
              className={inactiveColor} 
            />
          );
        }
      })}
    </div>
  );
};
