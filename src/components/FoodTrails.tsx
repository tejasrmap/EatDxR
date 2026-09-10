import React, { useState } from 'react';
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

export function FoodTrails() {
  const [trails, setTrails] = useState<FoodTrail[]>(INITIAL_FOOD_TRAILS);
  const [selectedCity, setSelectedCity] = useState('All');
  const [activeStoryTrail, setActiveStoryTrail] = useState<FoodTrail | null>(null);
  const [expandedTrailId, setExpandedTrailId] = useState<string | null>('trail_1');
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

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Hero Header */}
      <div className="relative pt-6 sm:pt-10 pb-6 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Navigation size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Curated Itineraries</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Food Crawls & Trails</h1>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-xs uppercase tracking-wider active:scale-95 shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Trail</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-white/60 max-w-xl">
          Multi-stop culinary adventures curated by top food critics. Walk, dine, and discover must-order dishes at every stop.
        </p>
      </div>

      {/* Main Trails List */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {trails.map((trail) => {
          const isExpanded = expandedTrailId === trail.id;
          const isSaved = savedTrails[trail.id];

          return (
            <div
              key={trail.id}
              className="rounded-3xl bg-zinc-950 border border-white/10 overflow-hidden shadow-2xl transition-all"
            >
              {/* Cover Banner */}
              <div className="relative h-48 sm:h-60 w-full overflow-hidden">
                <img
                  src={trail.coverImage}
                  alt={trail.title}
                  className="w-full h-full object-cover filter brightness-90 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} /> {trail.neighborhood}
                  </span>
                  {trail.isOfficial && (
                    <span className="px-2.5 py-1 rounded-full bg-orange-500 text-black text-[9px] font-black uppercase tracking-widest">
                      Critic Choice
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setActiveStoryTrail(trail);
                    }}
                    className="p-2 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white hover:text-orange-400 transition-colors cursor-pointer"
                    title="Generate 9:16 Story Card"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => toggleSave(trail.id)}
                    className={`p-2 rounded-full backdrop-blur-md border border-white/20 transition-colors cursor-pointer ${
                      isSaved ? 'bg-orange-500 text-black' : 'bg-black/70 text-white'
                    }`}
                  >
                    <Bookmark size={16} />
                  </button>
                </div>

                {/* Title & Stats */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h2 className="text-lg sm:text-2xl font-black text-white">{trail.title}</h2>
                  <p className="text-xs text-white/70 line-clamp-1">{trail.tagline}</p>

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-white/80">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-orange-400" /> {trail.stops.length} Stops ({trail.totalDistanceKm} km)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-amber-400" /> ~{trail.totalDurationHours} hrs
                    </span>
                    <span className="flex items-center gap-1">
                      <IndianRupee size={12} className="text-emerald-400" /> {trail.estimatedBudget}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible Stops Section */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white/60">
                    Trail Itinerary ({trail.stops.length} Stops)
                  </h3>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setExpandedTrailId(isExpanded ? null : trail.id);
                    }}
                    className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
                  >
                    {isExpanded ? 'Hide Route' : 'View Full Route'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/15">
                    {trail.stops.map((stop, idx) => (
                      <div
                        key={idx}
                        className="relative pl-9 flex items-start justify-between p-3 rounded-2xl bg-zinc-900/60 border border-white/10"
                      >
                        {/* Number Pin */}
                        <div className="absolute left-1.5 top-3 w-5 h-5 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-black text-[10px] font-black flex items-center justify-center shadow-md">
                          {idx + 1}
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{stop.name}</h4>
                            <span className="text-[10px] text-white/40">• {stop.cuisine}</span>
                          </div>
                          <p className="text-[11px] text-white/50">{stop.location}</p>

                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-bold flex items-center gap-1">
                              <Utensils size={10} /> Must-Order: {stop.mustOrderDish}
                            </span>
                            {stop.dishPrice && (
                              <span className="text-[10px] font-mono text-emerald-400">{stop.dishPrice}</span>
                            )}
                          </div>

                          <p className="text-[11px] text-white/60 italic mt-1.5">
                            💡 Critic Tip: "{stop.criticTip}"
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Open Route in Google Maps CTA */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => openGoogleMapsRoute(trail)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <ExternalLink size={14} className="text-orange-400" />
                        <span>Navigate All Stops in Google Maps</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic();
                          setActiveStoryTrail(trail);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black transition-all cursor-pointer"
                      >
                        <Share2 size={14} />
                        <span>Story Card</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
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
                  className="p-1.5 rounded-full bg-white/10 text-white"
                >
                  <X size={18} />
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
                    className="mt-2 text-xs font-bold text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Another Stop
                  </button>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black uppercase tracking-wider"
                  >
                    Publish Trail
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
