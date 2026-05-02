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
    <div className="w-full flex-1 max-w-[320px] md:max-w-xl mx-auto py-6">
      <div className="flex items-end justify-center gap-1.5 md:gap-2 h-32 md:h-48 mb-4 border-b border-white/10 pb-1.5">
        {counts.map((count, i) => {
          // Use square root scaling so small ratios remain highly visible
          const heightPercent = maxCount > 0 ? (Math.sqrt(count) / Math.sqrt(maxCount)) * 100 : 0;
          const ratingValue = (i + 1) * 0.5;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                className="w-full bg-white/40 hover:bg-white rounded-t-sm transition-colors relative border border-white/20 border-b-0"
                style={{ minHeight: count > 0 ? '6px' : '0' }}
              >
                 {count > 0 && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-white/20 px-2.5 py-1 rounded-lg text-xs font-semibold text-black transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                       {count} <span className="text-black/60 ml-0.5">{ratingValue} ★</span>
                    </div>
                 )}
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs font-medium text-white/40 px-2">
         <span>1</span>
         <span className="uppercase tracking-widest text-[10px]">Ratings Distribution</span>
         <span>5</span>
      </div>
    </div>
  );
};
