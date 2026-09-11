import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Navigation, MapPin, Clock, IndianRupee, Sparkles, 
  Share2, ExternalLink, Plus, Bookmark, Heart, ChevronRight, X, Utensils, Check
} from 'lucide-react';
import { FoodTrail, TrailStop } from '../types';
import { TrailCardModal } from './TrailCardModal';
import { triggerHaptic } from '../services/nativeService';
import { toast } from 'sonner';

export const INITIAL_FOOD_TRAILS: FoodTrail[] = [
  {
    id: 'trail_1',
    title: 'Indiranagar Midnight Dessert Crawl',
    tagline: '4 legendary late-night sweet spots across 100ft road',
    description: 'An indulgent midnight trail through artisanal ice creams, warm molten cookies, and Basque cheesecakes.',
    city: 'Bangalore',
    neighborhood: 'Indiranagar',
    curatorName: 'Chef Rahul',
    curatorCriticLevel: 'Madeater Top Critic',
    coverImage: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1000&auto=format&fit=crop&q=80',
    totalDistanceKm: 2.2,
    totalDurationHours: 2.5,
    estimatedBudget: '₹600 - ₹900',
    tags: ['Late Night', 'Desserts', 'Artisanal', 'Walking Crawl'],
    likesCount: 342,
    savesCount: 189,
    isOfficial: true,
    stops: [
      {
        order: 1,
        name: 'Milano Ice Cream',
        cuisine: 'Italian Gelato',
        location: '100ft Road, Indiranagar',
        mustOrderDish: 'Dark Chocolate & Passion Fruit Gelato',
        dishPrice: '₹190',
        dishImage: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=500&auto=format&fit=crop&q=80',
        criticTip: 'Ask for fresh waffle cone made in front of you.',
        recommendedDurationMins: 30,
      },
      {
        order: 2,
        name: 'Corner House',
        cuisine: 'Classic Desserts',
        location: '12th Main, Indiranagar',
        mustOrderDish: 'Death By Chocolate (DBC)',
        dishPrice: '₹240',
        dishImage: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80',
        criticTip: 'Double the hot fudge sauce for the ultimate classic bite.',
        recommendedDurationMins: 35,
      },
      {
        order: 3,
        name: 'Magnolia Bakery',
        cuisine: 'American Bakery',
        location: '100ft Road, Indiranagar',
        mustOrderDish: 'Classic Banana Pudding',
        dishPrice: '₹280',
        dishImage: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80',
        criticTip: 'Get it chilled; perfect creamy layers.',
        recommendedDurationMins: 25,
      },
    ],
  },
  {
    id: 'trail_2',
    title: 'Old Town Heritage Biryani Trail',
    tagline: 'Centuries of wood-fired aroma & melt-in-mouth kebabs',
    description: 'A culinary pilgrimage through Shivaji Nagar & Frazer Town for authentic dum biryani, sheekh kebabs, and sulaimani chai.',
    city: 'Bangalore',
    neighborhood: 'Shivajinagar',
    curatorName: 'Ananya Sharma',
    curatorCriticLevel: 'Verified Critic',
    coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1000&auto=format&fit=crop&q=80',
    totalDistanceKm: 3.5,
    totalDurationHours: 3.0,
    estimatedBudget: '₹400 - ₹700',
    tags: ['Biryani', 'Street Food', 'Heritage', 'Meat Lovers'],
    likesCount: 628,
    savesCount: 412,
    isOfficial: true,
    stops: [
      {
        order: 1,
        name: 'Rahhams',
        cuisine: 'Mughlai & Biryani',
        location: 'MM Road, Frazer Town',
        mustOrderDish: 'Mutton Dum Biryani',
        dishPrice: '₹340',
        dishImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
        criticTip: 'Pair with onion raita and their fiery korma.',
        recommendedDurationMins: 45,
      },
      {
        order: 2,
        name: 'Savera Hotel',
        cuisine: 'Street Kebabs & Chai',
        location: 'Russell Market, Shivajinagar',
        mustOrderDish: 'Charcoal Beef / Mutton Sheekh with Sulaimani',
        dishPrice: '₹140',
        dishImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
        criticTip: 'Eat straight from the skewer with lime & mint chutney.',
        recommendedDurationMins: 30,
      },
      {
        order: 3,
        name: 'Albert Bakery',
        cuisine: 'Parsi / Anglo-Indian',
        location: 'Mosque Road',
        mustOrderDish: 'Mutton Keema Samosa',
        dishPrice: '₹80',
        dishImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
        criticTip: 'Arrive before 6 PM before daily batch sells out.',
        recommendedDurationMins: 20,
      },
    ],
  },
  {
    id: 'trail_3',
    title: 'Artisan Coffee & Sourdough Walk',
    tagline: 'Specialty roasters, pourovers, and flakiest croissants',
    description: 'Experience the third-wave coffee revolution in Koramangala with single-origin beans and artisanal pastries.',
    city: 'Bangalore',
    neighborhood: 'Koramangala',
    curatorName: 'Vikram Mehta',
    curatorCriticLevel: 'Food Critic',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&auto=format&fit=crop&q=80',
    totalDistanceKm: 1.8,
    totalDurationHours: 2.0,
    estimatedBudget: '₹500 - ₹800',
    tags: ['Coffee', 'Bakery', 'Morning Walk', 'Cafes'],
    likesCount: 290,
    savesCount: 145,
    isOfficial: false,
    stops: [
      {
        order: 1,
        name: 'Third Wave Coffee',
        cuisine: 'Specialty Coffee',
        location: '4th Block, Koramangala',
        mustOrderDish: 'Sea Salt Mocha & Almond Croissant',
        dishPrice: '₹320',
        dishImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
        criticTip: 'Sit on the balcony for morning breeze.',
        recommendedDurationMins: 35,
      },
      {
        order: 2,
        name: 'Maverick & Farmer Coffee',
        cuisine: 'Experimental Brews',
        location: '80ft Road, Koramangala',
        mustOrderDish: 'Cold Brew Beer (Non-Alc) & Sourdough Toast',
        dishPrice: '₹260',
        dishImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80',
        criticTip: 'Ask the barista for notes on the fermentation process.',
        recommendedDurationMins: 40,
      },
    ],
  },
];

const TRAIL_CATEGORIES = ['All', 'Desserts', 'Biryani', 'Late Night', 'Coffee'];

export function FoodTrails() {
  const [trails, setTrails] = useState<FoodTrail[]>(INITIAL_FOOD_TRAILS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeStoryTrail, setActiveStoryTrail] = useState<FoodTrail | null>(null);
  const [expandedTrailId, setExpandedTrailId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [savedTrails, setSavedTrails] = useState<Record<string, boolean>>({});

  // New Trail Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newBudget, setNewBudget] = useState('₹500 - ₹1000');
  const [newStops, setNewStops] = useState<TrailStop[]>([
    { order: 1, name: '', cuisine: '', location: '', mustOrderDish: '', criticTip: '' },
    { order: 2, name: '', cuisine: '', location: '', mustOrderDish: '', criticTip: '' },
  ]);

  const toggleSave = (id: string) => {
    triggerHaptic();
    setSavedTrails((prev) => {
      const next = !prev[id];
      toast.success(next ? 'Saved to your Bookmarked Trails!' : 'Removed from bookmarks');
      return { ...prev, [id]: next };
    });
  };

  const openGoogleMapsRoute = (trail: FoodTrail) => {
    triggerHaptic();
    const stopsQuery = trail.stops.map((s) => encodeURIComponent(`${s.name}, ${s.location}`)).join('/');
    const mapsUrl = `https://www.google.com/maps/dir/${stopsQuery}`;
    window.open(mapsUrl, '_blank');
  };

  const handleCreateTrail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newStops.some((s) => !s.name.trim())) {
      toast.error('Please fill in title and stop names');
      return;
    }
    const createdTrail: FoodTrail = {
      id: `trail_${Date.now()}`,
      title: newTitle,
      tagline: newTagline || 'A custom foodie itinerary',
      description: 'Community curated crawl on Madeater.',
      city: 'Bangalore',
      neighborhood: newNeighborhood || 'Central',
      curatorName: 'You',
      curatorCriticLevel: 'Food Critic',
      coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80',
      totalDistanceKm: 2.5,
      totalDurationHours: 2.0,
      estimatedBudget: newBudget,
      tags: ['Custom Crawl', 'Community'],
      likesCount: 1,
      savesCount: 1,
      stops: newStops.filter((s) => s.name.trim()),
    };

    setTrails([createdTrail, ...trails]);
    setIsCreateModalOpen(false);
    toast.success('🎉 Food Trail published successfully!');
  };

  const filteredTrails = trails.filter(trail => {
    if (selectedCategory === 'All') return true;
    const catLower = selectedCategory.toLowerCase();
    const matchTag = trail.tags.some(t => t.toLowerCase().includes(catLower));
    const matchTitle = trail.title.toLowerCase().includes(catLower);
    const matchTagline = trail.tagline.toLowerCase().includes(catLower);
    return matchTag || matchTitle || matchTagline;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-28 sm:pb-32 select-none">
      {/* Sleek Minimalist Header */}
      <div className="pt-3 sm:pt-6 pb-2.5 px-3 sm:px-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-400 flex items-center gap-1">
              <Navigation size={10} className="text-orange-500" />
              Curated Crawls
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Food Trails</h1>
          </div>

          <button
            onClick={() => {
              triggerHaptic();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-xs uppercase tracking-wider active:scale-95 shadow-md shadow-orange-500/20 cursor-pointer shrink-0"
          >
            <Plus size={14} strokeWidth={3} />
            <span>New Trail</span>
          </button>
        </div>

        {/* Minimal Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {TRAIL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { triggerHaptic(); setSelectedCategory(cat); }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 active:scale-95 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-white text-black border-white shadow-md font-black"
                  : "bg-zinc-900/80 text-white/60 border-white/10 hover:border-white/25 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Trails List */}
      <div className="max-w-3xl mx-auto px-3 sm:px-6 space-y-4">
        {filteredTrails.map((trail) => {
          const isExpanded = expandedTrailId === trail.id;
          const isSaved = savedTrails[trail.id];

          return (
            <div
              key={trail.id}
              className="rounded-2xl sm:rounded-3xl bg-zinc-950 border border-white/10 overflow-hidden shadow-xl transition-all"
            >
              {/* Cover Banner */}
              <div 
                onClick={() => {
                  triggerHaptic();
                  setExpandedTrailId(isExpanded ? null : trail.id);
                }}
                className="relative h-44 sm:h-52 w-full overflow-hidden cursor-pointer group"
              >
                <img
                  src={trail.coverImage}
                  alt={trail.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 filter brightness-90 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                {/* Top Badges & Actions */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap max-w-[70%]">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={10} /> {trail.neighborhood}
                    </span>
                    {trail.isOfficial && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black text-[9px] font-black uppercase tracking-widest">
                        Critic Pick
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic();
                        setActiveStoryTrail(trail);
                      }}
                      className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white hover:text-orange-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Share Story Card"
                    >
                      <Share2 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(trail.id);
                      }}
                      className={`w-7 h-7 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors cursor-pointer ${
                        isSaved ? 'bg-orange-500 text-black' : 'bg-black/70 text-white'
                      }`}
                    >
                      <Bookmark size={13} className={isSaved ? "fill-black" : ""} />
                    </button>
                  </div>
                </div>

                {/* Bottom Title & Stats */}
                <div className="absolute bottom-2.5 left-3 right-3">
                  <h2 className="text-base sm:text-xl font-black text-white leading-snug">{trail.title}</h2>
                  <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">{trail.tagline}</p>

                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/80 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-orange-400" /> {trail.stops.length} Stops ({trail.totalDistanceKm} km)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-amber-400" /> ~{trail.totalDurationHours} hrs
                    </span>
                    <span className="flex items-center gap-1">
                      <IndianRupee size={11} className="text-emerald-400" /> {trail.estimatedBudget}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible Stops Header Bar */}
              <div className="px-3.5 py-2.5 bg-zinc-900/40 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/50">
                  {trail.stops.length} Stops • {trail.neighborhood}
                </span>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setExpandedTrailId(isExpanded ? null : trail.id);
                  }}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Itinerary' : 'View Itinerary'}</span>
                  <ChevronRight size={13} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Collapsed/Expanded Stops */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/5 p-3.5 sm:p-5 bg-zinc-950"
                  >
                    <div className="space-y-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-orange-500 before:via-amber-400 before:to-orange-500/20">
                      {trail.stops.map((stop, idx) => (
                        <div
                          key={idx}
                          className="relative pl-8 flex items-start justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5"
                        >
                          {/* Number Pin */}
                          <div className="absolute left-1.5 top-3 w-5 h-5 rounded-full bg-orange-500 text-black text-[10px] font-black flex items-center justify-center shadow-md">
                            {idx + 1}
                          </div>

                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-white">{stop.name}</h4>
                              <span className="text-[10px] text-white/40 truncate">{stop.cuisine}</span>
                            </div>
                            <p className="text-[10px] text-white/40 truncate mt-0.5">{stop.location}</p>

                            <div className="mt-2 flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                              <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1 truncate">
                                <Utensils size={10} /> Must-Order: {stop.mustOrderDish}
                              </span>
                              {stop.dishPrice && (
                                <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">{stop.dishPrice}</span>
                              )}
                            </div>

                            {stop.criticTip && (
                              <p className="text-[10px] text-white/50 italic mt-1.5 leading-snug">
                                💡 Tip: "{stop.criticTip}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Action Row */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => openGoogleMapsRoute(trail)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          <ExternalLink size={13} />
                          <span>Start Route in Maps</span>
                        </button>
                        <button
                          onClick={() => {
                            triggerHaptic();
                            setActiveStoryTrail(trail);
                          }}
                          className="py-2.5 px-4 rounded-xl bg-orange-500 text-black text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Story Card Modal */}
      {activeStoryTrail && (
        <TrailCardModal
          isOpen={!!activeStoryTrail}
          onClose={() => setActiveStoryTrail(null)}
          trail={activeStoryTrail}
        />
      )}

      {/* Create Custom Trail Modal */}
      {isCreateModalOpen && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white">Create Food Trail</h3>
                    <p className="text-[10px] text-white/50">Chain multiple spots into a curated crawl</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateTrail} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-white/70 block mb-1">Trail Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Koramangala Burger & Shake Crawl"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-white text-xs placeholder:text-white/30 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-white/70 block mb-1">Neighborhood</label>
                    <input
                      type="text"
                      placeholder="e.g. Indiranagar"
                      value={newNeighborhood}
                      onChange={(e) => setNewNeighborhood(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-white text-xs placeholder:text-white/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-white/70 block mb-1">Estimated Budget</label>
                    <input
                      type="text"
                      placeholder="₹500 - ₹1000"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-white text-xs placeholder:text-white/30 outline-none"
                    />
                  </div>
                </div>

                {/* Stops */}
                <div>
                  <label className="text-[11px] font-bold text-white/70 block mb-2">Stops & Must-Orders</label>
                  <div className="space-y-3">
                    {newStops.map((stop, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 space-y-2">
                        <span className="text-[10px] font-black text-orange-400">Stop #{idx + 1}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Restaurant Name"
                            value={stop.name}
                            onChange={(e) => {
                              const updated = [...newStops];
                              updated[idx].name = e.target.value;
                              setNewStops(updated);
                            }}
                            className="px-2.5 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Must-Order Dish"
                            value={stop.mustOrderDish}
                            onChange={(e) => {
                              const updated = [...newStops];
                              updated[idx].mustOrderDish = e.target.value;
                              setNewStops(updated);
                            }}
                            className="px-2.5 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Critic Tip (e.g. Try the spicy dip)"
                          value={stop.criticTip}
                          onChange={(e) => {
                            const updated = [...newStops];
                            updated[idx].criticTip = e.target.value;
                            setNewStops(updated);
                          }}
                          className="w-full px-2.5 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewStops([
                        ...newStops,
                        { order: newStops.length + 1, name: '', cuisine: '', location: '', mustOrderDish: '', criticTip: '' },
                      ]);
                    }}
                    className="mt-2 text-xs font-bold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add Another Stop
                  </button>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Publish Trail
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
