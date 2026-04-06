import React from 'react';
import { Review } from '../types';
import { Star, MapPin, Quote } from 'lucide-react';
import { format } from 'date-fns';
import { parseFirebaseDate } from '../lib/utils';

interface ReviewPosterProps {
  review: Review;
  id?: string;
}

export const ReviewPoster: React.FC<ReviewPosterProps> = ({ review, id = "review-poster-capture" }) => {
  const images = review.dishes?.filter(d => d.image).map(d => d.image) || [];
  const mainImage = images[0];
  const date = parseFirebaseDate(review.createdAt);

  return (
    <div 
      id={id}
      className="fixed top-[200vh] left-[200vw] pointer-events-none z-[-1]"
    >
      <div className="w-[1080px] h-[1920px] bg-[#0a0a0a] text-white flex flex-col font-sans overflow-hidden">
      {/* Cinematic Backdrop */}
      {mainImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={mainImage} 
            className="w-full h-full object-cover opacity-40 grayscale" 
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>
      )}

      {/* Hero Content Stage */}
      <div className="relative z-10 flex-1 flex flex-col px-24 pt-48 pb-32">
        {/* Rating Stage */}
        <div className="flex flex-col items-center justify-center mb-16">
          <div className="flex gap-4 text-orange-500 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={80} 
                fill={i < review.rating ? "currentColor" : "none"} 
                className={i < review.rating ? "fill-orange-500" : "text-white/10"} 
              />
            ))}
          </div>
          <span className="text-2xl font-black uppercase tracking-[1em] text-white/30 italic font-serif">Narrative Rating</span>
        </div>

        {/* The Review Header */}
        <div className="space-y-6 mb-20 text-center">
          <h1 className="text-[120px] font-black tracking-tighter leading-[0.9] text-white uppercase italic font-serif shadow-2xl">
            {review.restaurantName}
          </h1>
          <div className="flex items-center justify-center gap-4 text-3xl font-black uppercase tracking-[0.5em] text-orange-500/80">
            <MapPin size={32} />
            {review.city || "Nearby"} • {format(date, "MMM dd, yyyy")}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {mainImage ? (
            <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden border-[4px] border-white/10 shadow-2xl">
               <img 
                src={mainImage} 
                className="w-full h-full object-cover" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
               <div className="absolute bottom-8 left-8 right-8">
                  <span className="text-[14px] uppercase font-bold tracking-[0.4em] text-white/40 block mb-2">Highlight</span>
                  <h2 className="text-4xl font-bold text-white italic font-serif">{review.dishes?.[0]?.name}</h2>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-white/5 rounded-[4rem] bg-white/[0.02]">
               <Quote size={160} className="text-white/5 rotate-180" />
            </div>
          )}
        </div>

        {/* The Narrative Content */}
        {review.content && (
          <div className="mt-20 relative px-12">
            <Quote size={120} className="absolute -left-12 -top-12 text-white/[0.03] italic" />
            <p className="text-[48px] text-white/80 leading-[1.3] font-serif italic text-center mx-auto max-w-4xl line-clamp-6">
              "{review.content}"
            </p>
          </div>
        )}
      </div>

      {/* Signature Branding (Always visible at bottom) */}
      <div className="relative z-10 px-24 py-24 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <img 
            src={review.userPhoto} 
            className="w-20 h-20 rounded-full border-2 border-white/10" 
          />
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-white italic font-serif">{review.userName}</span>
            <span className="text-sm uppercase font-bold tracking-widest text-white/20">Culinary Critic</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black uppercase tracking-[0.4em] text-white/20 mb-2">Captured on EATDxR</span>
          <span className="text-5xl font-black text-orange-500/80 italic font-serif tracking-tighter">Powered by EatR</span>
        </div>
      </div>

      {/* Texture Layer - Simplified for capture */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-5 bg-white/5" />
      </div>
    </div>
  );
};
