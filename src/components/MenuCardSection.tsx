import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Utensils, BookOpen, Search, Flame, ZoomIn, ZoomOut, 
  RotateCcw, ChevronLeft, ChevronRight, X, Upload, Camera, 
  Sparkles, Check, Share2, Plus, Info, ExternalLink, Loader2
} from "lucide-react";
import { MenuItem, Restaurant } from "../types";
import { getDigitalMenuForRestaurant, getMenuCardsForRestaurant } from "../utils/menuGenerator";
import { triggerHaptic } from "../services/nativeService";
import { toast } from "sonner";
import { useAuth } from "../App";

interface MenuCardSectionProps {
  restaurant: Restaurant;
  onLogDish?: (dishName: string) => void;
  onMenuUpdated?: (newCards: string[]) => void;
}

export const MenuCardSection: React.FC<MenuCardSectionProps> = ({
  restaurant,
  onLogDish,
  onMenuUpdated
}) => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<"digital" | "scans">("digital");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "non-veg" | "must-order">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Scans & Lightbox State
  const [currentScanIdx, setCurrentScanIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Dynamic Menus
  const digitalMenu: MenuItem[] = useMemo(() => {
    return getDigitalMenuForRestaurant(restaurant);
  }, [restaurant]);

  const [menuCards, setMenuCards] = useState<string[]>(() => {
    return getMenuCardsForRestaurant(restaurant);
  });

  useEffect(() => {
    setMenuCards(getMenuCardsForRestaurant(restaurant));
  }, [restaurant]);

  // Distinct Categories for digital menu
  const categories = useMemo(() => {
    const set = new Set<string>();
    digitalMenu.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [digitalMenu]);

  // Filtered digital items
  const filteredDishes = useMemo(() => {
    return digitalMenu.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      // Dietary filter
      if (dietaryFilter === "veg" && !item.isVeg) return false;
      if (dietaryFilter === "non-veg" && item.isVeg) return false;
      if (dietaryFilter === "must-order" && !item.isMustOrder) return false;

      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      return true;
    });
  }, [digitalMenu, searchQuery, dietaryFilter, selectedCategory]);

  // Lightbox keyboard controls
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        setCurrentScanIdx(prev => (prev + 1) % menuCards.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentScanIdx(prev => (prev - 1 + menuCards.length) % menuCards.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, menuCards.length]);

  return (
    <section className="space-y-6">
      {/* Section Header & View Toggles */}
      <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-5 sm:p-7 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>Menu Card & Dishes</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono font-bold">
                  Verified
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Browse prices, specialties, and original menu card scans for {restaurant.name}.
              </p>
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab("digital");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "digital"
                  ? "bg-orange-500 text-black shadow-md shadow-orange-500/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Utensils size={13} />
              <span>Digital Menu ({digitalMenu.length})</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab("scans");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "scans"
                  ? "bg-orange-500 text-black shadow-md shadow-orange-500/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <BookOpen size={13} />
              <span>Menu Scans ({menuCards.length})</span>
            </button>
          </div>
        </div>

        {/* ----------------- TAB 1: DIGITAL MENU ----------------- */}
        {activeTab === "digital" && (
          <div className="pt-5 space-y-5">
            {/* Search & Dietary Filters Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search dish name, ingredients, or styles..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dietary Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => { triggerHaptic(); setDietaryFilter("all"); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    dietaryFilter === "all"
                      ? "bg-white text-black font-black"
                      : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                  }`}
                >
                  All Items
                </button>

                <button
                  onClick={() => { triggerHaptic(); setDietaryFilter("veg"); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    dietaryFilter === "veg"
                      ? "bg-emerald-500 text-black font-black"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Veg Only</span>
                </button>

                <button
                  onClick={() => { triggerHaptic(); setDietaryFilter("non-veg"); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    dietaryFilter === "non-veg"
                      ? "bg-rose-500 text-white font-black"
                      : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Non-Veg</span>
                </button>

                <button
                  onClick={() => { triggerHaptic(); setDietaryFilter("must-order"); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    dietaryFilter === "must-order"
                      ? "bg-orange-500 text-black font-black"
                      : "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30"
                  }`}
                >
                  <Flame size={12} className={dietaryFilter === "must-order" ? "fill-black" : "fill-orange-400"} />
                  <span>Must-Order</span>
                </button>
              </div>
            </div>

            {/* Category Sub-Filters */}
            {categories.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/5 pt-1">
                <button
                  onClick={() => { triggerHaptic(); setSelectedCategory("all"); }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  All Sections
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { triggerHaptic(); setSelectedCategory(cat); }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Dishes Grid */}
            {filteredDishes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {filteredDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="p-4 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-white/10 transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2.5">
                        {/* Veg / Non-Veg Indicator Icon */}
                        <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                          dish.isVeg ? "border-emerald-500" : "border-rose-500"
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${dish.isVeg ? "bg-emerald-500" : "bg-rose-500"}`} />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-white group-hover:text-orange-400 transition-colors">
                              {dish.name}
                            </h4>
                            {dish.isMustOrder && (
                              <span className="flex items-center gap-1 text-[10px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                                <Flame size={10} className="fill-orange-400" />
                                <span>Must Order</span>
                              </span>
                            )}
                          </div>
                          {dish.category && (
                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                              {dish.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price Badge */}
                      {dish.price && (
                        <div className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-1 shrink-0">
                          {dish.price}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {dish.description && (
                      <p className="text-xs text-white/60 mb-3 line-clamp-2 pl-6">
                        {dish.description}
                      </p>
                    )}

                    {/* Bottom Action Strip */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 pl-6 mt-auto">
                      <span className="text-[10px] text-white/30 italic">
                        {dish.isMustOrder ? "Highly praised by food critics" : "Popular recommendation"}
                      </span>

                      <button
                        onClick={() => {
                          triggerHaptic();
                          onLogDish?.(dish.name);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-orange-500 text-white/70 hover:text-black font-black text-[10px] uppercase tracking-wider border border-white/10 hover:border-orange-500 transition-all cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Log Meal</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 p-6">
                <Utensils className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/60 text-xs font-bold">No dishes match your filter</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDietaryFilter("all");
                    setSelectedCategory("all");
                  }}
                  className="mt-3 text-[11px] text-orange-400 hover:underline uppercase tracking-wider font-bold"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 2: MENU SCANS & LIGHTBOX ----------------- */}
        {activeTab === "scans" && (
          <div className="pt-5 space-y-6">
            {/* Scans Control & Upload Banner */}
            <div className="flex items-center justify-between bg-white/5 p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/70">
                  Page {currentScanIdx + 1} of {menuCards.length}
                </span>
                <span className="text-[10px] text-white/40">• Tap card to zoom</span>
              </div>

              <button
                onClick={() => {
                  triggerHaptic();
                  if (!user) {
                    toast.info("Please sign in to upload menu cards");
                    login();
                  } else {
                    setIsUploadModalOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Upload size={13} />
                <span>Upload Menu Scan</span>
              </button>
            </div>

            {/* Featured Active Scan with Hover & Zoom Prompt */}
            <div 
              onClick={() => {
                triggerHaptic();
                setZoomLevel(1);
                setIsLightboxOpen(true);
              }}
              className="relative aspect-[3/4] sm:aspect-[4/3] max-h-[550px] w-full rounded-3xl overflow-hidden border border-white/15 bg-zinc-950 cursor-zoom-in group shadow-2xl"
            >
              <img
                src={menuCards[currentScanIdx]}
                alt={`Menu Page ${currentScanIdx + 1}`}
                className="w-full h-full object-contain p-2 sm:p-4 group-hover:scale-[1.02] transition-transform duration-500"
              />

              {/* Overlay Prompt */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <ZoomIn size={16} className="text-orange-400" />
                    <span>Tap to Open High-Res Fullscreen View</span>
                  </p>
                  <p className="text-xs text-white/60">Pinch and zoom into prices and dishes</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-orange-500 text-black text-xs font-black uppercase tracking-wider">
                  Zoom Scan
                </div>
              </div>

              {/* Left / Right Carousel Controls on Hover */}
              {menuCards.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      setCurrentScanIdx(prev => (prev - 1 + menuCards.length) % menuCards.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-orange-500 text-white hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100"
                    title="Previous page"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      setCurrentScanIdx(prev => (prev + 1) % menuCards.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-orange-500 text-white hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100"
                    title="Next page"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {menuCards.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {menuCards.map((scanUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      triggerHaptic();
                      setCurrentScanIdx(idx);
                    }}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      currentScanIdx === idx
                        ? "border-orange-500 scale-105 shadow-lg shadow-orange-500/20"
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={scanUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 py-0.5 text-center text-[9px] font-bold text-white uppercase">
                      P. {idx + 1}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ----------------- FULLSCREEN LIGHTBOX MODAL ----------------- */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm tracking-tight text-white uppercase">
                  {restaurant.name} • Menu Scan
                </span>
                <span className="text-xs text-white/50 font-mono">
                  ({currentScanIdx + 1} / {menuCards.length})
                </span>
              </div>

              {/* Zoom & Close Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.25))}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono text-white/70 w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(z => Math.min(3.5, z + 0.25))}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  title="Reset zoom"
                >
                  <RotateCcw size={16} />
                </button>

                <div className="w-[1px] h-6 bg-white/15 mx-1" />

                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold transition-all cursor-pointer"
                  title="Close viewer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Main Interactive Zoomable Canvas */}
            <div className="flex-1 flex items-center justify-center relative overflow-auto p-4 select-none">
              <motion.img
                key={`${currentScanIdx}-${zoomLevel}`}
                initial={{ scale: zoomLevel * 0.95 }}
                animate={{ scale: zoomLevel }}
                transition={{ duration: 0.15 }}
                src={menuCards[currentScanIdx]}
                alt={`Menu Page Fullscreen ${currentScanIdx + 1}`}
                className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform"
                style={{
                  cursor: zoomLevel > 1 ? "grab" : "default"
                }}
              />

              {/* Prev / Next Floating Arrows */}
              {menuCards.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setCurrentScanIdx(prev => (prev - 1 + menuCards.length) % menuCards.length);
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/80 hover:bg-orange-500 text-white hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-2xl"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic();
                      setCurrentScanIdx(prev => (prev + 1) % menuCards.length);
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/80 hover:bg-orange-500 text-white hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-2xl"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Info bar */}
            <div className="text-center py-2 text-white/40 text-xs font-mono">
              Use arrow keys to navigate pages • Click +/- to zoom in on prices
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- UPLOAD MENU CARD MODAL ----------------- */}
      <UploadMenuCardModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        restaurant={restaurant}
        onSuccess={(newCardUrl) => {
          const updated = [newCardUrl, ...menuCards];
          setMenuCards(updated);
          onMenuUpdated?.(updated);
          setCurrentScanIdx(0);
          setActiveTab("scans");
        }}
      />
    </section>
  );
};

interface UploadMenuCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  onSuccess: (url: string) => void;
}

const UploadMenuCardModal: React.FC<UploadMenuCardModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size is too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedFile(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please pick a photo of the menu card first.");
      return;
    }

    triggerHaptic();
    setIsSubmitting(true);
    try {
      // Dynamic import to avoid cycles
      const { uploadRestaurantMenuCard } = await import("../services/supabaseService");
      await uploadRestaurantMenuCard(restaurant.id, selectedFile);
      toast.success("🎉 Menu card scan uploaded successfully!");
      onSuccess(selectedFile);
      onClose();
    } catch (err: any) {
      console.error("Failed to upload menu card:", err);
      toast.error("Failed to upload menu card. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-5"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Camera size={18} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-tight text-white">
              Upload Menu Card Photo
            </h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-white/60">
          Upload a clear, readable photo of the physical menu card or drink sheet at <strong className="text-white">{restaurant.name}</strong>.
        </p>

        {/* Upload Area */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="relative aspect-[3/4] max-h-[300px] w-full rounded-2xl overflow-hidden border border-orange-500/40 bg-zinc-900 group">
            <img src={selectedFile} alt="Selected Menu Card" className="w-full h-full object-contain p-2" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold uppercase tracking-wider text-orange-400"
            >
              Click to replace photo
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/20 hover:border-orange-500/50 bg-white/5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-orange-500/5 p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Upload size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Take Photo or Choose File</p>
              <p className="text-[10px] text-white/40 mt-0.5">JPEG, PNG, WEBP (Max 5MB)</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isSubmitting}
            className="flex-1 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save to Menu</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
