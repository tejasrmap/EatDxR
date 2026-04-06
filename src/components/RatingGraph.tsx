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
      <div className="flex items-end justify-center gap-1.5 md:gap-2 h-32 md:h-48 mb-4 border-b border-white/20 pb-1.5">
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
                className="w-full bg-[#00e054]/80 group-hover:bg-[#00e054] rounded-t-sm transition-all relative shadow-[0_0_15px_rgba(0,224,84,0.15)] group-hover:shadow-[0_0_20px_rgba(0,224,84,0.4)]"
                style={{ minHeight: count > 0 ? '6px' : '0' }}
              >
                 {count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-zinc-900 border border-white/20 px-2.5 py-1 rounded text-[10px] font-black text-white transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-2xl">
                       {count} <span className="text-[#00e054]/80 ml-0.5">{ratingValue} ★</span>
                    </div>
                 )}
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest px-2">
         <span>1</span>
         <span>★ Ratings Distribution ★</span>
         <span>5</span>
      </div>
    </div>
  );
};
