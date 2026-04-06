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
        // Half star
        else if (diff >= 0.5) {
          return (
            <div key={i} className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
              <Star size={size} className={inactiveColor} />
              <StarHalf size={size} fill="currentColor" className={`absolute top-0 left-0 ${activeColor} fill-current`} />
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
