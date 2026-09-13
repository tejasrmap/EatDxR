import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, MapPin, Utensils, Star, DollarSign, Clock, 
  Sparkles, Navigation, Loader2, Upload, Camera, 
  Check, ChevronDown, CheckCircle2, Image as ImageIcon,
  BookOpen, Plus, Crosshair, Compass
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { triggerHaptic } from "../services/nativeService";
import { createRestaurant } from "../services/supabaseService";
import { registerNewRestaurantLocally, getCurrentCity, getPreciseAddress } from "../services/mapsService";
import { Restaurant } from "../types";
import { toast } from "sonner";
import { Geolocation } from "@capacitor/geolocation";

const POPULAR_CUISINES = [
  "Hostel Mess & Dining",
  "Night Canteen & Maggi Point",
  "Student Mess & Tiffins",
  "Hyderabadi Biryani",
  "South Indian Deluxe",
  "North Indian & Mughlai",
  "Cafe & Bakery",
  "Pan-Asian & Sushi",
  "Italian & Pizza",
  "Street Food & Chaat",
  "Burgers & Fast Food",
  "Desserts & Ice Cream",
  "Fine Dining & Grills",
  "Cocktails & Lounge"
];

const PRESET_COVERS = [
  {
    label: "Biryani & Feast",
    url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Fine Dining",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Cozy Cafe",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "South Indian",
    url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Street Food",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
  },
  {
    label: "Pan-Asian",
    url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80"
  }
];

const PRICE_TIERS = [
  { level: "₹", desc: "Budget" },
  { level: "₹₹", desc: "Casual" },
  { level: "₹₹₹", desc: "Upscale" },
  { level: "₹₹₹₹", desc: "Fine Dining" }
];

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess?: (restaurant: Restaurant) => void;
}

export const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({
  isOpen,
  onClose,
  initialName = "",
  onSuccess
}) => {
  const [name, setName] = useState(initialName);
  const [cuisine, setCuisine] = useState("Hyderabadi Biryani");
  const [customCuisine, setCustomCuisine] = useState("");
  const [isCustomCuisine, setIsCustomCuisine] = useState(false);
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [priceLevel, setPriceLevel] = useState("₹₹");
  const [signatureDish, setSignatureDish] = useState("");
  const [hours, setHours] = useState("11:00 AM - 11:00 PM");
  const [selectedImage, setSelectedImage] = useState(PRESET_COVERS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [menuCardImages, setMenuCardImages] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({ lat: 16.4819, lng: 80.5050 });
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuCardInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialName) setName(initialName);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  // Interactive Leaflet Pinpoint Mini-Map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current || leafletMapRef.current) return;

      const initialLat = coords.lat || 16.4819;
      const initialLng = coords.lng || 80.5050;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: coords.lat ? 17 : 14,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "dark-map-tiles"
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "custom-pinpoint-marker",
        iconSize: [36, 44],
        iconAnchor: [18, 42],
        html: `
          <div class="relative flex flex-col items-center cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-orange-500 border-2 border-white shadow-xl shadow-orange-500/80 flex items-center justify-center text-sm font-black animate-pulse">
              📍
            </div>
            <div class="w-2.5 h-2.5 bg-orange-500 rotate-45 -mt-1 shadow-sm"></div>
          </div>
        `
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: pinIcon,
        draggable: true,
        zIndexOffset: 1000
      }).addTo(map);

      pinMarkerRef.current = marker;
      leafletMapRef.current = map;

      const updatePinLocation = async (lat: number, lng: number) => {
        setCoords({ lat, lng });
        setIsReverseGeocoding(true);
        try {
          const res = await getPreciseAddress(lat, lng);
          if (res) {
            if (res.city) setCity(res.city);
            if (res.address) setLocation(res.address);
          }
        } catch {
          // ignore
        } finally {
          setIsReverseGeocoding(false);
        }
      };

      marker.on("dragend", () => {
        triggerHaptic();
        const pos = marker.getLatLng();
        updatePinLocation(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        triggerHaptic();
        marker.setLatLng(e.latlng);
        updatePinLocation(e.latlng.lat, e.latlng.lng);
      });

      // Attempt silent device location on first open if user hasn't explicitly moved pin
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const uLat = pos.coords.latitude;
            const uLng = pos.coords.longitude;
            setCoords({ lat: uLat, lng: uLng });
            marker.setLatLng([uLat, uLng]);
            map.flyTo([uLat, uLng], 17, { duration: 1 });
            updatePinLocation(uLat, uLng);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 6000 }
        );
      }

      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        pinMarkerRef.current = null;
      }
    };
  }, [isOpen]);

  // Auto-detect GPS Coordinates & City with Pin Snap
  const handleDetectLocation = async () => {
    triggerHaptic();
    setIsLocating(true);
    setIsReverseGeocoding(true);
    try {
      let lat: number, lng: number;
      try {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        const webPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
        });
        lat = webPos.coords.latitude;
        lng = webPos.coords.longitude;
      }

      setCoords({ lat, lng });

      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([lat, lng]);
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo([lat, lng], 18, { duration: 1.2 });
      }

      const res = await getPreciseAddress(lat, lng);
      if (res) {
        if (res.city) setCity(res.city);
        if (res.address) setLocation(res.address);
      } else {
        const detectedCity = await getCurrentCity(lat, lng);
        if (detectedCity) {
          setCity(detectedCity);
          if (!location) setLocation(`Near ${detectedCity}`);
        }
      }
      toast.success("📍 Exact pinpoint locked from device GPS!");
    } catch {
      toast.error("Could not obtain device GPS. You can tap or drag the pin on the map to pinpoint.");
    } finally {
      setIsLocating(false);
      setIsReverseGeocoding(false);
    }
  };

  // Image Upload Handling
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large. Please select an image under 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      setCustomImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleMenuCardFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Menu image too large (max 4MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setMenuCardImages(prev => [...prev, dataUrl]);
      toast.success("Menu card scan attached!");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();

    if (!name.trim()) {
      toast.error("Please enter the restaurant name.");
      return;
    }

    const finalCuisine = isCustomCuisine ? customCuisine.trim() : cuisine;
    if (!finalCuisine) {
      toast.error("Please select or enter a cuisine.");
      return;
    }

    if (!location.trim()) {
      toast.error("Please enter the area or address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalLat = coords.lat ?? (leafletMapRef.current ? leafletMapRef.current.getCenter().lat : 16.4819);
      const finalLng = coords.lng ?? (leafletMapRef.current ? leafletMapRef.current.getCenter().lng : 80.5050);

      const newRestaurant = await createRestaurant({
        name: name.trim(),
        cuisine: finalCuisine,
        location: location.trim(),
        city: city.trim() || "Hyderabad",
        priceLevel,
        signatureDish: signatureDish.trim() || undefined,
        hours: hours.trim() || "11:00 AM - 11:00 PM",
        image: customImageUrl || selectedImage,
        lat: finalLat,
        lng: finalLng,
        rating: 4.8,
        reviewCount: 1,
        menuCards: menuCardImages
      });

      // Register into maps cache for instant live lookups
      registerNewRestaurantLocally({
        id: newRestaurant.id,
        name: newRestaurant.name,
        location: newRestaurant.location,
        city: newRestaurant.city,
        cuisine: newRestaurant.cuisine,
        image: newRestaurant.image,
        lat: newRestaurant.lat,
        lng: newRestaurant.lng,
        rating: newRestaurant.rating,
        priceLevel: newRestaurant.priceLevel,
        menuItems: newRestaurant.signatureDish ? [newRestaurant.signatureDish] : []
      });

      toast.success(`🎉 ${newRestaurant.name} added to Madeater!`);
      onSuccess?.(newRestaurant);
      onClose();
    } catch (err: any) {
      console.error("Failed to add restaurant:", err);
      toast.error(err?.message || "Failed to add restaurant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300" 
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-zinc-950/95 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Utensils size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>Add New Spot</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono text-[10px] font-bold">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-white/50">Catalogue a new culinary gem into the Madeater directory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-left flex-1">
          {/* 1. Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Restaurant Name <span className="text-orange-400">*</span>
            </label>
            <div className="relative flex items-center h-12 rounded-2xl bg-white/5 border border-white/10 focus-within:border-orange-500 transition-all px-3.5">
              <Utensils size={16} className="text-white/40 mr-2.5 shrink-0" />
              <input
                type="text"
                required
                placeholder="e.g. Pista House, Blue Tokai, Meghana Foods"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* 2. Cuisine Quick Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Cuisine Specialty <span className="text-orange-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => { triggerHaptic(); setIsCustomCuisine(!isCustomCuisine); }}
                className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
              >
                {isCustomCuisine ? "← Pick from popular" : "+ Other cuisine"}
              </button>
            </div>

            {isCustomCuisine ? (
              <div className="h-12 rounded-2xl bg-white/5 border border-white/10 focus-within:border-orange-500 transition-all px-3.5 flex items-center">
                <Sparkles size={16} className="text-orange-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="Enter custom cuisine (e.g. Lebanese, Andhra Mess, Korean BBQ)"
                  value={customCuisine}
                  onChange={(e) => setCustomCuisine(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none font-medium"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {POPULAR_CUISINES.map((c) => {
                  const isSelected = cuisine === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { triggerHaptic(); setCuisine(c); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-orange-500 text-black shadow-md shadow-orange-500/20"
                          : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Location & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Address / Area <span className="text-orange-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                >
                  {isLocating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Navigation size={11} className="text-orange-400" />
                  )}
                  <span>Auto-fill GPS</span>
                </button>
              </div>
              <div className="relative flex items-center h-12 rounded-2xl bg-white/5 border border-white/10 focus-within:border-orange-500 transition-all px-3.5">
                <MapPin size={16} className="text-white/40 mr-2.5 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Banjara Hills, Road No. 36"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                City <span className="text-orange-400">*</span>
              </label>
              <div className="relative flex items-center h-12 rounded-2xl bg-white/5 border border-white/10 focus-within:border-orange-500 transition-all px-3.5">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Accurate Interactive Pinpoint Map Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <MapPin size={13} className="text-orange-400" />
                <span>Pinpoint Exact Entrance on Map</span>
                <span className="text-[10px] text-orange-400 font-mono">(Visible on live map)</span>
              </label>
              {coords.lat && coords.lng && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Check size={11} strokeWidth={3} />
                  <span>Pinpoint Locked ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</span>
                </span>
              )}
            </div>

            <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 shadow-inner group">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Floating Snap to GPS Button */}
              <div className="absolute top-2.5 right-2.5 z-[400]">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="px-2.5 py-1.5 rounded-xl bg-black/80 hover:bg-orange-500 text-white hover:text-black border border-white/20 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer"
                  title="Snap Pinpoint to My Device GPS"
                >
                  {isLocating ? (
                    <Loader2 size={12} className="animate-spin text-orange-400" />
                  ) : (
                    <Crosshair size={12} className="text-orange-400" />
                  )}
                  <span>Snap My GPS</span>
                </button>
              </div>

              {/* Bottom Instructions Banner */}
              <div className="absolute bottom-2 inset-x-2 z-[400] bg-black/80 backdrop-blur-md rounded-xl p-1.5 px-3 border border-white/10 flex items-center justify-between text-[11px] text-white/70 pointer-events-none">
                <span className="truncate mr-2">📍 Drag pin or tap on map to position at hostel / food spot entrance</span>
                {isReverseGeocoding && (
                  <span className="text-orange-400 flex items-center gap-1 text-[10px] shrink-0">
                    <Loader2 size={10} className="animate-spin" /> Resolving...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Price Tier & Signature Dish */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Price Level
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
                {PRICE_TIERS.map((tier) => (
                  <button
                    key={tier.level}
                    type="button"
                    onClick={() => { triggerHaptic(); setPriceLevel(tier.level); }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      priceLevel === tier.level
                        ? "bg-white text-black shadow-md font-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <div>{tier.level}</div>
                    <div className="text-[9px] opacity-70 font-normal">{tier.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Signature Must-Order Dish (Optional)
              </label>
              <div className="relative flex items-center h-12 rounded-2xl bg-white/5 border border-white/10 focus-within:border-orange-500 transition-all px-3.5">
                <Sparkles size={16} className="text-amber-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Mutton Biryani, Truffle Pasta"
                  value={signatureDish}
                  onChange={(e) => setSignatureDish(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* 5. Menu Card Scans (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <BookOpen size={13} className="text-orange-400" />
                <span>Attach Menu Card Scans (Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => menuCardInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
              >
                <Upload size={12} />
                <span>Add Menu Page</span>
              </button>
              <input
                ref={menuCardInputRef}
                type="file"
                accept="image/*"
                onChange={handleMenuCardFile}
                className="hidden"
              />
            </div>

            {menuCardImages.length > 0 ? (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {menuCardImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-20 rounded-xl overflow-hidden border border-white/20 shrink-0 group">
                    <img src={img} alt={`Menu page ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMenuCardImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]"
                      title="Remove"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => menuCardInputRef.current?.click()}
                  className="w-16 h-20 rounded-xl border border-dashed border-white/20 hover:border-orange-500/50 bg-white/5 flex flex-col items-center justify-center text-white/40 hover:text-orange-400 transition-all shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  <span className="text-[9px] mt-1">Add</span>
                </button>
              </div>
            ) : (
              <div 
                onClick={() => menuCardInputRef.current?.click()}
                className="py-2.5 px-3.5 rounded-2xl bg-white/5 border border-dashed border-white/10 hover:border-orange-500/30 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Camera size={14} className="text-orange-400" />
                  <span>Upload physical menu card scans or price sheet</span>
                </div>
                <span className="text-[10px] text-orange-400 uppercase font-bold tracking-wider">Browse</span>
              </div>
            )}
          </div>

          {/* 6. Cover Photo & Ambiance Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Ambiance Cover Photo
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
              >
                <Camera size={12} />
                <span>Upload Custom Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_COVERS.map((preset) => {
                const isSelected = selectedImage === preset.url && !customImageUrl;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setSelectedImage(preset.url);
                      setCustomImageUrl("");
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-video sm:aspect-square group border transition-all cursor-pointer ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/30 scale-100"
                        : "border-white/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                      <span className="text-[9px] font-bold text-white truncate w-full text-left">
                        {preset.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 text-black flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin text-black" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit & Register Spot</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};
