import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  X, Heart, Flame, Sparkles, MapPin, Navigation, 
  Users, Share2, Check, RefreshCw, Trophy, Utensils
} from 'lucide-react';
import { triggerHaptic } from '../services/nativeService';
import { toast } from 'sonner';

interface MatcherCard {
  id: string;
  dishName: string;
  restaurantName: string;
  cuisine: string;
  location: string;
  distance: string;
  priceLevel: string;
  rating: number;
  isMustOrder: boolean;
  flavorTags: string[];
  image: string;
}

const SAMPLE_MATCHER_DECK: MatcherCard[] = [
  {
    id: 'match_1',
    dishName: 'Smoked Butter Garlic Prawns',
    restaurantName: 'The Coastal Bay',
    cuisine: 'Coastal Seafood',
    location: 'Indiranagar',
    distance: '1.2 km',
    priceLevel: '₹₹₹',
    rating: 9.6,
    isMustOrder: true,
    flavorTags: ['Garlicky', 'Buttery', 'Smoky'],
    image: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'match_2',
    dishName: 'Truffle Mushroom Woodfired Pizza',
    restaurantName: 'BrikOven',
    cuisine: 'Neapolitan Pizza',
    location: 'Church Street',
    distance: '2.5 km',
    priceLevel: '₹₹',
    rating: 9.4,
    isMustOrder: true,
    flavorTags: ['Truffle Aroma', 'Crisp Crust', 'Cheesy'],
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'match_3',
    dishName: 'Mutton Ghee Roast & Neer Dosa',
    restaurantName: 'Kudla Mangalore Kitchen',
    cuisine: 'South Indian / Mangalorean',
    location: 'Koramangala',
    distance: '3.1 km',
    priceLevel: '₹₹',
    rating: 9.7,
    isMustOrder: true,
    flavorTags: ['Fiery Spiced', 'Desi Ghee', 'Tender Meat'],
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'match_4',
    dishName: 'Tonkotsu Ramen with Chashu Pork',
    restaurantName: 'Naru Noodle Bar',
    cuisine: 'Japanese Ramen',
    location: 'Central Bangalore',
    distance: '4.0 km',
    priceLevel: '₹₹₹',
    rating: 9.8,
    isMustOrder: true,
    flavorTags: ['Rich Broth', 'Umami Bomb', 'Handmade Noodles'],
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'match_5',
    dishName: 'Basque Burnt Cheesecake',
    restaurantName: 'Sapa Sourdough & Pastry',
    cuisine: 'European Bakery',
    location: 'Indiranagar',
    distance: '1.8 km',
    priceLevel: '₹₹',
    rating: 9.5,
    isMustOrder: true,
    flavorTags: ['Caramelized Top', 'Velvety Molten Center'],
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
  },
];

interface CravingMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CravingMatcherModal({ isOpen, onClose }: CravingMatcherModalProps) {
  const [deck, setDeck] = useState<MatcherCard[]>(SAMPLE_MATCHER_DECK);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [roomCode, setRoomCode] = useState('EAT8');
  const [participantsCount, setParticipantsCount] = useState(3);
  const [matchedCard, setMatchedCard] = useState<MatcherCard | null>(null);

  // Motion values for swipe
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacityLike = useTransform(x, [20, 100], [0, 1]);
  const opacityNope = useTransform(x, [-100, -20], [1, 0]);

  if (!isOpen) return null;

  const currentItem = deck[currentIndex];
  const isDeckFinished = currentIndex >= deck.length;

  const handleSwipe = (direction: 'left' | 'right') => {
    triggerHaptic();
    if (direction === 'right') {
      // Simulate random match in group mode, or after 2-3 rights in solo
      if (isGroupMode || currentIndex === 1 || currentIndex === 3) {
        setMatchedCard(currentItem);
        return;
      }
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleRestart = () => {
    triggerHaptic();
    setCurrentIndex(0);
    setMatchedCard(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-hidden select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col h-[85vh] max-h-[700px] justify-between gpu-accelerated"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Flame size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Craving Matcher</h3>
                <p className="text-[10px] text-white/50">
                  {isGroupMode ? `Room #${roomCode} (${participantsCount} foodies)` : 'Solo Craving Deck'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  triggerHaptic();
                  setIsGroupMode(!isGroupMode);
                  toast.success(isGroupMode ? 'Switched to Solo mode' : 'Group room activated!');
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isGroupMode
                    ? 'bg-orange-500 text-black shadow-md'
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Users size={12} />
                <span>{isGroupMode ? 'Party Mode' : 'Solo'}</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic();
                  onClose();
                }}
                className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* MAIN CARD CONTAINER */}
          <div className="relative flex-1 my-3 flex items-center justify-center overflow-hidden">
            {matchedCard ? (
              /* MATCH CELEBRATION MODAL */
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full rounded-2xl bg-gradient-to-b from-orange-950/80 via-zinc-950 to-black border border-orange-500/40 p-5 flex flex-col items-center justify-between text-center relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-32 bg-orange-500/20 blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-2">
                    <Sparkles size={12} /> It's a Match!
                  </span>
                  <h2 className="text-xl font-black text-white">Everyone Craves This!</h2>
                  <p className="text-xs text-white/60">Your group agreed on dinner tonight.</p>
                </div>

                <div className="relative z-10 w-full max-w-[260px] rounded-2xl overflow-hidden border border-white/20 shadow-2xl my-auto">
                  <img
                    src={matchedCard.image}
                    alt={matchedCard.dishName}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-3 bg-zinc-900 text-left">
                    <h4 className="text-sm font-bold text-white truncate">{matchedCard.dishName}</h4>
                    <p className="text-xs text-orange-400 font-semibold">{matchedCard.restaurantName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50">
                      <span>{matchedCard.location}</span>
                      <span>•</span>
                      <span>{matchedCard.distance}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 w-full space-y-2">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(matchedCard.restaurantName + ' ' + matchedCard.location)}`, '_blank');
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-500/30"
                  >
                    <Navigation size={16} />
                    <span>Get Directions to Restaurant</span>
                  </button>

                  <button
                    onClick={handleRestart}
                    className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
                  >
                    Keep Swiping More Dishes
                  </button>
                </div>
              </motion.div>
            ) : isDeckFinished ? (
              /* DECK EXHAUSTED VIEW */
              <div className="text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
                  <Trophy size={28} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Deck Complete!</h3>
                  <p className="text-xs text-white/50 max-w-xs mx-auto mt-1">
                    You've swiped through all top-rated local dishes in this neighborhood.
                  </p>
                </div>
                <button
                  onClick={handleRestart}
                  className="px-6 py-2.5 rounded-full bg-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 mx-auto active:scale-95 shadow-lg"
                >
                  <RefreshCw size={14} />
                  <span>Shuffle Deck Again</span>
                </button>
              </div>
            ) : (
              /* ACTIVE SWIPE CARD */
              <motion.div
                key={currentItem.id}
                style={{ x, rotate }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 90) handleSwipe('right');
                  else if (info.offset.x < -90) handleSwipe('left');
                }}
                className="relative w-full h-full rounded-2xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl flex flex-col justify-between cursor-grab active:cursor-grabbing"
              >
                {/* Visual Swipe Badges */}
                <motion.div
                  style={{ opacity: opacityLike }}
                  className="absolute top-4 left-4 z-30 px-3 py-1 rounded-xl bg-emerald-500 text-black font-black text-sm uppercase tracking-widest rotate-[-12deg] shadow-xl pointer-events-none"
                >
                  CRAVING ❤️
                </motion.div>
                <motion.div
                  style={{ opacity: opacityNope }}
                  className="absolute top-4 right-4 z-30 px-3 py-1 rounded-xl bg-red-500 text-white font-black text-sm uppercase tracking-widest rotate-[12deg] shadow-xl pointer-events-none"
                >
                  PASS ✕
                </motion.div>

                {/* Card Hero Image */}
                <div className="relative w-full h-3/5 overflow-hidden">
                  <img
                    src={currentItem.image}
                    alt={currentItem.dishName}
                    className="w-full h-full object-cover filter brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold">
                      {currentItem.distance}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-white/80 text-[10px] font-mono">
                      {currentItem.priceLevel}
                    </span>
                  </div>

                  {currentItem.isMustOrder && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-orange-500 text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                      <Flame size={11} /> Must-Order
                    </div>
                  )}

                  {/* Rating Pill */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-amber-400/40 text-amber-400 text-xs font-black flex items-center gap-1">
                    ★ {currentItem.rating}
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-950">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-1">
                      {currentItem.dishName}
                    </h2>
                    <p className="text-xs text-orange-400 font-semibold mt-0.5">
                      {currentItem.restaurantName} • <span className="text-white/50">{currentItem.cuisine}</span>
                    </p>
                    <p className="text-[11px] text-white/50 flex items-center gap-1 mt-1">
                      <MapPin size={11} className="text-orange-400" /> {currentItem.location}
                    </p>
                  </div>

                  {/* Flavor Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {currentItem.flavorTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70 text-[9px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Action Controls (Pass & Like) */}
          {!matchedCard && !isDeckFinished && (
            <div className="flex items-center justify-center gap-6 pt-2 pb-1">
              <button
                onClick={() => handleSwipe('left')}
                className="w-13 h-13 rounded-full bg-zinc-900 border border-white/15 text-red-400 hover:text-red-300 hover:scale-110 active:scale-90 transition-all flex items-center justify-center shadow-lg cursor-pointer"
                title="Pass"
              >
                <X size={24} className="stroke-[2.5]" />
              </button>

              <button
                onClick={() => handleSwipe('right')}
                className="w-15 h-15 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-black hover:scale-110 active:scale-90 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] cursor-pointer"
                title="Crave this!"
              >
                <Heart size={28} className="fill-black stroke-black" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
