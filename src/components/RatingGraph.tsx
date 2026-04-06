import React from 'react';
import { Review } from '../types';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';

interface RatingGraphProps {
  reviews: Review[];
}

export const RatingGraph: React.FC<RatingGraphProps> = ({ reviews }) => {
  // 10 buckets for ratings: 0.5 to 5.0
  const counts = Array(10).fill(0);
  let totalRated = 0;

  reviews.forEach(r => {
    if (r.rating > 0) {
      // mapping 0.5 -> index 0, 1.0 -> index 1... 5.0 -> index 9
      const idx = Math.max(0, Math.min(9, Math.round(r.rating * 2) - 1));
      counts[idx]++;
      totalRated++;
    }
  });

  if (totalRated === 0) {
    return null; // Don't show if no rated items
  }

  const maxCount = Math.max(...counts, 1);

  return (
    <div className="w-full flex-1 max-w-[200px] md:max-w-xs mx-auto md:mx-0 py-4">
      <div className="flex items-end justify-center md:justify-start gap-[2px] md:gap-1 h-16 md:h-20 mb-2 border-b border-white/10 pb-1">
        {counts.map((count, i) => {
          const heightPercent = (count / maxCount) * 100;
          const ratingValue = (i + 1) * 0.5;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                className="w-full bg-white/20 group-hover:bg-orange-500 rounded-t-[1px] transition-colors relative"
                style={{ minHeight: count > 0 ? '4px' : '0' }}
              >
                 {count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black/80 px-2 py-0.5 rounded text-[8px] font-bold transition-opacity whitespace-nowrap border border-white/10 z-10 pointer-events-none">
                       {count} <span className="text-white/40">({ratingValue} ★)</span>
                    </div>
                 )}
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[8px] md:text-[9px] font-black text-white/30 uppercase tracking-widest px-1">
         <span>1</span>
         <span>Ratings Distribution</span>
         <span>5</span>
      </div>
    </div>
  );
};
