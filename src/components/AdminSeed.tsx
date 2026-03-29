import React, { useState } from 'react';
import { useAuth } from '../App';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { MapPin, Zap, Database, Loader2, IndianRupee, Globe, Lock, ShieldCheck, Search, Sliders, Map as MapIcon, ChevronRight, Check, Timer, Trash2, Rocket } from 'lucide-react';
import { VIJAYAWADA_RESTAURANTS, GUDIVADA_RESTAURANTS } from '../data/apRestaurants';

// Admin Security Constants
const ADMIN_PASSWORD = "ADMIN-EAT-DxR";

interface LocationResult {
  lat: number;
  lng: number;
  name: string;
  fullName: string;
}

export const AdminSeed: React.FC = () => {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0 });

  // Security States
  const [accessKey, setAccessKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Search & Radius States
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(15);
  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const [usePinpoint, setUsePinpoint] = useState(true);
  const [locationOptions, setLocationOptions] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

  const purgeRestaurants = async () => {
    const { collection, getDocs, deleteDoc, writeBatch } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, "restaurants"));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    return snap.size;
  };

  const handleMegaSeedAP = async () => {
    if (!user || user.email !== 'tejag.vijay@gmail.com') {
      toast.error('Identity Verification Failed.');
      return;
    }

    setIsSeeding(true);
    setProgress({ total: 1, current: 0 }); // Visual indicator starting

    try {
      const { collection, writeBatch, doc } = await import('firebase/firestore');

      toast.info("Purging old inaccuracies...");
      const deletedCount = await purgeRestaurants();
      toast.success(`Cleared ${deletedCount} entries. Preparing transplant...`);

      const allData = [...VIJAYAWADA_RESTAURANTS, ...GUDIVADA_RESTAURANTS];
      setProgress({ total: allData.length, current: 0 });

      // Firestore batches have a limit of 500 operations
      const batch = writeBatch(db);
      let count = 0;

      for (const item of allData) {
        const ref = doc(collection(db, 'restaurants'));
        batch.set(ref, {
          ...item,
          id: ref.id,
          likesCount: 0,
          menuItems: item.mustTry || []
        });
        count++;
        setProgress(prev => ({ ...prev, current: count }));
      }

      await batch.commit();
      toast.success(`Success! Seeded ${count} premium restaurants.`);
    } catch (error: any) {
      console.error('Mega-Seed error:', error);
      toast.error(`Transplant Error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAuthorize = () => {
    if (accessKey === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      toast.success("Secondary Authentication Successful.");
    } else {
      toast.error("Invalid Access Key.");
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsFindingLocation(true);
    setLocationOptions([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();

      if (data && data.length > 0) {
        const results = data.map((loc: any) => ({
          lat: parseFloat(loc.lat),
          lng: parseFloat(loc.lon),
          name: loc.display_name.split(',')[0],
          fullName: loc.display_name.split(',').slice(0, 3).join(',')
        }));
        setLocationOptions(results);

        if (results.length === 1) {
          setSelectedLocation(results[0]);
        }
      } else {
        toast.error("Location not found.");
      }
    } catch (error) {
      toast.error("Geocoding service unavailable.");
    } finally {
      setIsFindingLocation(false);
    }
  };

  const foodImages = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1525640788966-69bdb028aa73?auto=format&fit=crop&q=80&w=800"
  ];

  // Utility to delay for Nominatim Usage Policy (1 request per second)
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSeed = async () => {
    if (!user || user.email !== 'tejag.vijay@gmail.com') {
      toast.error('Identity Verification Failed.');
      return;
    }

    if (!selectedLocation) {
      toast.error("Please select a location first.");
      return;
    }

    setIsSeeding(true);
    try {
      const { lat, lng } = selectedLocation;
      const radiusMeters = radiusKm * 1000;

      toast.info(`Scanning OSM for ${selectedLocation.name}...`);

      const overpassQuery = `[out:json][timeout:60];(node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});node["amenity"="cafe"](around:${radiusMeters},${lat},${lng});node["amenity"="fast_food"](around:${radiusMeters},${lat},${lng}););out center;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });

      if (!res.ok) throw new Error(`Overpass API blocked with HTTP ${res.status}`);

      const text = await res.text();
      const data = JSON.parse(text);
      const validElements = data.elements?.filter((e: any) => e.tags && e.tags.name) || [];

      if (validElements.length === 0) throw new Error("No results in this area.");

      // Cap at 40 places per sweep to keep Pinpoint lookup fast (40 seconds total)
      let topPlaces = validElements.sort(() => 0.5 - Math.random()).slice(0, 40);

      setProgress({ total: topPlaces.length, current: 0 });
      let seedCount = 0;

      for (const place of topPlaces) {
        const plat = place.lat || place.center?.lat;
        const plon = place.lon || place.center?.lon;

        // --- Pinpoint Accuracy: Reverse Geocode lookup ---
        let pinpointTown = selectedLocation.name;

        if (usePinpoint) {
          try {
            // Respect Nominatim rate limit (max 1 request per sec)
            await wait(1100);
            const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${plat}&lon=${plon}&zoom=14`);

            if (revRes.status === 429) {
              toast.error("API Quota Reached. Switching to standard mode...");
              setUsePinpoint(false); // Auto-disable for the rest of the run
            } else if (revRes.ok) {
              const revData = await revRes.json();
              // Extract most specific town/suburb name
              pinpointTown = revData.address.suburb ||
                revData.address.town ||
                revData.address.neighbourhood ||
                revData.address.village ||
                revData.address.city_district ||
                revData.address.city ||
                selectedLocation.name;
            }
          } catch (e) {
            console.error("Reverse geocode failed", e);
          }
        }

        const type = place.tags.amenity === 'cafe' ? 'Cafe' :
          place.tags.amenity === 'fast_food' ? 'Fast Food' :
            place.tags.cuisine ? place.tags.cuisine.split(';')[0].replace('_', ' ') : 'Indian';

        const cuisine = type.charAt(0).toUpperCase() + type.slice(1);
        const name = place.tags.name;

        // Street fallback
        const streetAttr = place.tags['addr:street'] || '';
        const _locationStr = streetAttr ? `${streetAttr}, ${pinpointTown}` : `${pinpointTown}`;

        const randomImage = foodImages[Math.floor(Math.random() * foodImages.length)];
        const ratingNum = Number((Math.random() * 2 + 3).toFixed(1));

        const docId = `osm-${place.id}`;

        const payload = {
          id: docId,
          name: name,
          cuisine: cuisine,
          location: _locationStr,
          rating: ratingNum,
          reviewCount: Math.floor(Math.random() * 200) + 10,
          image: randomImage,
          menuItems: [],
          lat: plat,
          lng: plon
        };

        await setDoc(doc(db, 'restaurants', docId), payload);
        seedCount++;
        setProgress({ total: topPlaces.length, current: seedCount });
      }

      toast.success(`Sweep for ${selectedLocation.name} complete!`);
    } catch (error: any) {
      console.error('Seeding error:', error);
      toast.error(`Admin Error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-zinc-900 border border-white/5 p-10 rounded-[2.5rem] text-center shadow-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white/40" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Access Key Required</h2>
          <p className="text-white/30 text-xs font-serif italic mb-8">This tool is in Stealth Mode. Please provide your secondary credential.</p>

          <input
            type="password"
            placeholder="Enter Access Key..."
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuthorize()}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder:text-white/10 focus:ring-1 ring-[#00e054] outline-none transition-all mb-4"
          />
          <button
            onClick={handleAuthorize}
            className="w-full bg-[#00e054] text-black font-black uppercase tracking-widest py-3 rounded-xl hover:bg-[#00c044] transition-colors"
          >
            Unlock Tool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#00e054] to-cyan-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-[#00e054]/20">
          <Database className="text-black w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-[#00e054]" size={14} />
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#00e054]">Session Authorized</p>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Database & Content Admin</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mt-8">
          {/* AP Mega-Transplant: The Definitive Seed */}
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl hover:border-red-500/50 transition-all group text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Rocket size={120} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-red-500" size={16} />
              <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Operation: Mega-Seed</span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">AP Mega-Transplant</h2>
            <p className="text-white/40 text-xs font-serif italic mb-8 leading-relaxed">
              Reconstruct the entire database for Vijayawada & Gudivada. Clears all old data and injects 50+ legendary icons with real addresses and GPS.
            </p>
            <button
              onClick={handleMegaSeedAP}
              disabled={isSeeding}
              className="w-full bg-red-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-red-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-[0.98]"
            >
              {isSeeding ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
              Purge & Seed AP Icons
            </button>
          </div>

          {/* OSM Pinpoint Seeding: The Discovery Engine */}
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl hover:border-[#00e054]/50 transition-all group text-left">
            <div className="flex items-center gap-2 mb-4">
              <Search className="text-[#00e054]" size={16} />
              <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Operation: Discovery</span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Pinpoint Discovery</h2>
            <p className="text-white/40 text-xs font-serif italic mb-8 leading-relaxed">
              Scan any global region using OpenStreetMap. Latent discovery of fast food, cafes, and local eateries within a custom radius.
            </p>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Discovery Town..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:ring-1 ring-[#00e054] outline-none"
                />
                <button
                  onClick={handleSearchLocation}
                  className="bg-zinc-800 p-3 rounded-xl"
                >
                  {isFindingLocation ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                </button>
              </div>

              {selectedLocation && (
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="w-full bg-[#00e054] text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-[#00f064] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#00e054]/20"
                >
                  <Zap size={18} />
                  Inject {selectedLocation.name}
                </button>
              )}
            </div>
          </div>
        </div>

        {isSeeding && (
          <div className="mt-12 w-full max-w-lg mx-auto bg-zinc-900 p-10 rounded-3xl border border-[#00e054]/20 shadow-2xl">
            <div className="relative">
              <Loader2 className="w-20 h-20 animate-spin text-[#00e054] mx-auto opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xl font-black text-white">{Math.round((progress.current / Math.max(1, progress.total)) * 100)}%</p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#00e054] animate-pulse">
                <Timer size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest">Pinpoint Reverse Geocoding Active</p>
              </div>
              <div className="space-y-1">
                <p className="text-white/80 font-bold uppercase tracking-[0.1em] text-sm leading-tight">
                  Sweeping {selectedLocation?.name} Area...
                </p>
                <p className="text-white/30 text-[10px] uppercase font-bold">Processed {progress.current} of {progress.total} spots</p>
              </div>
            </div>
            <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/10 shadow-inner">
              <div
                className="bg-gradient-to-r from-[#00e054] to-cyan-400 h-full transition-all duration-300"
                style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
            <p className="text-center text-[9px] text-white/20 italic">Ensuring pinpoint town names (1.1s delay per spot)</p>
          </div>
        )}
      </div>
    </div>
  );
};
