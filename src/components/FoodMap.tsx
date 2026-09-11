import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  MapPin, 
  Star, 
  Navigation, 
  Compass, 
  Utensils, 
  Flame, 
  ChevronRight, 
  X, 
  Crosshair, 
  ExternalLink,
  Search,
  Check,
  Share2,
  Sparkles,
  Phone,
  Clock,
  Layers
} from "lucide-react";
import { GLOBAL_RESTAURANTS, GLOBAL_CITIES, GlobalRestaurant } from "../data/globalRestaurants";
import { getDistanceKM, formatDistance } from "../lib/distance";

export function FoodMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [selectedCity, setSelectedCity] = useState("All");
  const [filterType, setFilterType] = useState<"all" | "critic" | "trending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSpot, setActiveSpot] = useState<GlobalRestaurant | null>(GLOBAL_RESTAURANTS[0]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Available city shortcuts
  const cities = useMemo(() => [
    "All",
    "Hyderabad",
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Amaravati (SRMAP)",
    "Tokyo",
    "New York"
  ], []);

  // Filtered spots based on City, FilterType, and Search Query
  const filteredSpots = useMemo(() => {
    return GLOBAL_RESTAURANTS.filter((spot) => {
      const matchesCity = selectedCity === "All" || spot.city.toLowerCase().includes(selectedCity.toLowerCase());
      const matchesFilter =
        filterType === "all"
          ? true
          : filterType === "critic"
          ? spot.rating >= 4.8
          : spot.reviewCount >= 3000;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        spot.name.toLowerCase().includes(q) ||
        spot.cuisine.toLowerCase().includes(q) ||
        spot.location.toLowerCase().includes(q) ||
        spot.signatureDishes?.some((d) => d.toLowerCase().includes(q));

      return matchesCity && matchesFilter && matchesSearch;
    });
  }, [selectedCity, filterType, searchQuery]);

  // Request user live GPS coordinates
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setIsLocating(false);
        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.5 });
        }
      },
      (err) => {
        console.warn("Location access denied or timed out:", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Attempt silent GPS fetch on initial load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    // Default center on Hyderabad (gastronomic epicenter)
    const initialCenter: [number, number] = [17.4042, 78.4983];
    const initialZoom = 12;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
      maxZoom: 19
    });

    // Clean Dark Map Tiles (OpenStreetMap with dark cartography styling - No API Key, No Watermark)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      className: "dark-map-tiles",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Zoom Controls in top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    leafletMapRef.current = map;

    // Invalidate size once DOM stabilizes
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Sync User Location Marker
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !userCoords) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      const userIcon = L.divIcon({
        className: "custom-map-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <div class="absolute w-7 h-7 rounded-full bg-cyan-400/30 animate-ping"></div>
            <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg shadow-cyan-400/80"></div>
          </div>
        `
      });

      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map);
    }
  }, [userCoords]);

  // Sync Restaurant Markers when filteredSpots or activeSpot changes
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    filteredSpots.forEach((spot) => {
      const isSelected = activeSpot?.id === spot.id;

      const markerIcon = L.divIcon({
        className: "custom-map-marker",
        iconSize: isSelected ? [140, 42] : [110, 36],
        iconAnchor: isSelected ? [70, 21] : [55, 18],
        html: `
          <div class="cursor-pointer transition-transform duration-200 ${isSelected ? "scale-110 z-50" : "hover:scale-105"}">
            <div class="px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xl border transition-all ${
              isSelected
                ? "bg-orange-500 text-black border-orange-300 ring-4 ring-orange-500/30 font-black shadow-orange-500/40"
                : "bg-zinc-950/90 backdrop-blur-md text-white border-white/20 hover:border-orange-500/80 hover:bg-zinc-900"
            }">
              <div class="w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-black" : "bg-orange-400"}"></div>
              <span class="text-[11px] font-bold truncate max-w-[65px]">${spot.name}</span>
              <span class="text-[10px] font-black opacity-90 px-1 py-0.5 rounded ${isSelected ? "bg-black/20 text-black" : "bg-white/10 text-orange-400"}">★${spot.rating.toFixed(1)}</span>
            </div>
          </div>
        `
      });

      const marker = L.marker([spot.lat, spot.lng], {
        icon: markerIcon,
        zIndexOffset: isSelected ? 500 : 10
      });

      marker.on("click", () => {
        setActiveSpot(spot);
        map.flyTo([spot.lat, spot.lng], Math.max(map.getZoom(), 14), { duration: 1 });
      });

      markersLayer.addLayer(marker);
    });
  }, [filteredSpots, activeSpot]);

  // Jump to selected city coordinates
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    if (!leafletMapRef.current) return;

    if (cityName === "All") {
      if (userCoords) {
        leafletMapRef.current.flyTo([userCoords.lat, userCoords.lng], 13, { duration: 1.2 });
      } else {
        leafletMapRef.current.flyTo([17.4042, 78.4983], 12, { duration: 1.2 });
      }
      return;
    }

    const cityMeta = GLOBAL_CITIES.find((c) => c.name.toLowerCase().includes(cityName.toLowerCase()));
    if (cityMeta) {
      leafletMapRef.current.flyTo([cityMeta.lat, cityMeta.lng], 13, { duration: 1.2 });
    }
  };

  // Turn-by-Turn directions URLs
  const getGoogleMapsUrl = (spot: GlobalRestaurant) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
  };

  const getAppleMapsUrl = (spot: GlobalRestaurant) => {
    return `https://maps.apple.com/?daddr=${spot.lat},${spot.lng}&dirflg=d`;
  };

  // Real distance computation for active spot
  const activeSpotDistance = useMemo(() => {
    if (!activeSpot || !userCoords) return null;
    const km = getDistanceKM(userCoords.lat, userCoords.lng, activeSpot.lat, activeSpot.lng);
    return formatDistance(km);
  }, [activeSpot, userCoords]);

  const handleShareSpot = (spot: GlobalRestaurant) => {
    const url = window.location.origin + `/restaurant/${spot.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const location = useLocation();
  const isAppMode = location.pathname.startsWith("/app");

  return (
    <div className={`min-h-screen bg-black text-white ${isAppMode ? "pt-3 sm:pt-4" : "pt-20 sm:pt-24"} pb-24 md:pb-12 px-3 sm:px-6 max-w-7xl mx-auto flex flex-col`}>
      
      {/* Top Header & Geospatial Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 mb-1">
            <Compass size={14} className="animate-spin [animation-duration:30s]" />
            <span>Interactive Real-World Map</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
            Madeater Food Map
          </h1>
        </div>

        {/* Global Action Bar: Search, Locate Me, Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spots, dishes..."
              className="w-full bg-zinc-900/90 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/80 transition-all"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Locate Me GPS Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
              userCoords
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 shadow-lg shadow-cyan-500/10"
                : "bg-zinc-900 text-white/70 border-white/15 hover:border-white/30 hover:text-white"
            }`}
          >
            <Crosshair size={14} className={isLocating ? "animate-spin text-cyan-400" : userCoords ? "text-cyan-400" : "text-white/50"} />
            <span>{isLocating ? "Locating..." : userCoords ? "GPS Active" : "Locate Me"}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => handleCitySelect(city)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                selectedCity === city
                  ? "bg-white text-black border-white shadow-md"
                  : "bg-zinc-900/80 text-white/60 border-white/10 hover:border-white/25 hover:text-white"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="hidden sm:block w-[1px] h-5 bg-white/10 shrink-0" />

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setFilterType(filterType === "critic" ? "all" : "critic")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer ${
              filterType === "critic"
                ? "bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/20"
                : "bg-zinc-900/80 text-white/60 border-white/10 hover:border-white/25 hover:text-white"
            }`}
          >
            <Star size={12} className={filterType === "critic" ? "fill-black" : "fill-current"} />
            <span>Critic Picks (★ 4.8+)</span>
          </button>

          <button
            onClick={() => setFilterType(filterType === "trending" ? "all" : "trending")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer ${
              filterType === "trending"
                ? "bg-orange-500 text-black border-orange-500 shadow-md shadow-orange-500/20"
                : "bg-zinc-900/80 text-white/60 border-white/10 hover:border-white/25 hover:text-white"
            }`}
          >
            <Flame size={12} className={filterType === "trending" ? "fill-black" : "fill-current"} />
            <span>Trending</span>
          </button>
        </div>
      </div>

      {/* Main Map + Inspection Card Container */}
      <div className="relative flex-1 min-h-[68vh] rounded-[2rem] bg-zinc-950 border border-white/10 overflow-hidden shadow-2xl flex flex-col lg:flex-row">
        
        {/* Leaflet Real Interactive Map Canvas */}
        <div className="relative flex-1 w-full min-h-[48vh] lg:min-h-[68vh] z-0">
          <div ref={mapContainerRef} className="w-full h-full min-h-[48vh] lg:min-h-[68vh] z-0 select-none" />

          {/* Floating Location Badge */}
          {userCoords && (
            <div className="absolute top-4 left-4 z-[400] px-3 py-1.5 rounded-full bg-zinc-950/90 backdrop-blur-md border border-cyan-500/40 text-cyan-400 text-[11px] font-bold flex items-center gap-2 shadow-xl pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Live GPS: {userCoords.lat.toFixed(3)}, {userCoords.lng.toFixed(3)}</span>
            </div>
          )}

          {/* Floating Map Counter */}
          <div className="absolute bottom-4 left-4 z-[400] px-3 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-bold shadow-xl">
            Showing <span className="text-orange-400 font-black">{filteredSpots.length}</span> verified culinary stages
          </div>
        </div>

        {/* Selected Spot Details Flyout Panel */}
        {activeSpot ? (
          <div className="w-full lg:w-96 bg-zinc-950/95 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/10 p-5 sm:p-6 flex flex-col justify-between shrink-0 max-h-[45vh] lg:max-h-[68vh] overflow-y-auto scrollbar-hide z-10">
            <div>
              {/* Header with image, rating badge, and close button */}
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-lg group">
                <img
                  src={activeSpot.image}
                  alt={activeSpot.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Rating Badge */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-white">{activeSpot.rating.toFixed(1)}</span>
                </div>

                {/* Price Level */}
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-black text-white/90">
                  {activeSpot.priceLevel || "₹₹"}
                </div>
              </div>

              {/* Cuisine & City */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">
                    {activeSpot.cuisine}
                  </span>
                  <span className="text-white/40 text-xs">• {activeSpot.city}</span>
                </div>

                {/* Real-World Distance Pill */}
                {activeSpotDistance ? (
                  <div className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[10px] font-black flex items-center gap-1">
                    <Navigation size={10} />
                    <span>{activeSpotDistance}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLocateMe}
                    className="text-[10px] font-bold text-white/40 hover:text-cyan-400 transition-colors underline cursor-pointer"
                  >
                    Check Distance
                  </button>
                )}
              </div>

              {/* Restaurant Name */}
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white mb-1.5">
                {activeSpot.name}
              </h2>

              {/* Physical Location Address */}
              <p className="text-xs text-white/60 flex items-start gap-1.5 mb-4 leading-relaxed">
                <MapPin size={13} className="text-orange-400 shrink-0 mt-0.5" />
                <span>{activeSpot.location}</span>
              </p>

              {/* Signature Dishes Tags */}
              {activeSpot.signatureDishes && activeSpot.signatureDishes.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 mb-4">
                  <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-white/40 tracking-wider">
                    <Utensils size={10} className="text-orange-400" />
                    <span>Signature Culinary Highlights</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSpot.signatureDishes.map((dish) => (
                      <span
                        key={dish}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-white/90"
                      >
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Turn-by-Turn Navigation & Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              
              {/* Google Maps and Apple Maps Direction Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* Google Maps */}
                <a
                  href={getGoogleMapsUrl(activeSpot)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                >
                  <Navigation size={13} />
                  <span>Google Maps</span>
                  <ExternalLink size={10} className="opacity-70" />
                </a>

                {/* Apple Maps */}
                <a
                  href={getAppleMapsUrl(activeSpot)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 shadow-lg transition-all active:scale-95"
                >
                  <Compass size={13} className="text-orange-400" />
                  <span>Apple Maps</span>
                  <ExternalLink size={10} className="opacity-70" />
                </a>
              </div>

              {/* In-App Restaurant Explorer & Share */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/restaurant/${activeSpot.id}`}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-wider text-xs text-center transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
                >
                  <span>Explore Restaurant</span>
                  <ChevronRight size={14} />
                </Link>

                <button
                  onClick={() => handleShareSpot(activeSpot)}
                  title="Share restaurant"
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all active:scale-90 cursor-pointer"
                >
                  {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full lg:w-96 bg-zinc-950/90 p-6 flex flex-col items-center justify-center text-center text-white/40">
            <MapPin size={32} className="text-white/20 mb-2" />
            <p className="text-xs">Select any marker on the map to view restaurant details, real distance, and direct turn-by-turn navigation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
