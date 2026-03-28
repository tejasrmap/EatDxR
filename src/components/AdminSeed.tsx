import React, { useState } from 'react';
import { useAuth } from '../App';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { MapPin, Zap, Database, Loader2, IndianRupee, Globe, Lock, ShieldCheck, Search, Sliders, Map as MapIcon, ChevronRight, Check } from 'lucide-react';

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
  const [locationOptions, setLocationOptions] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

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
      // Fetch up to 5 suggestions to give the user town/district context
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const results = data.map((loc: any) => ({
          lat: parseFloat(loc.lat),
          lng: parseFloat(loc.lon),
          name: loc.display_name.split(',')[0],
          fullName: loc.display_name.split(',').slice(0, 3).join(',') // First 3 parts e.g. "Town, District, State"
        }));
        setLocationOptions(results);
        
        if (results.length === 1) {
          setSelectedLocation(results[0]);
        }
      } else {
        toast.error("Location not found. Try adding a city or district name.");
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
      
      toast.info(`Fetching OSM data for ${selectedLocation.name} (${radiusKm}km radius)...`);
      
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
      
      let topPlaces = validElements.sort(() => 0.5 - Math.random()).slice(0, 500);
      
      setProgress({ total: topPlaces.length, current: 0 });
      let seedCount = 0;

      for (const place of topPlaces) {
        const type = place.tags.amenity === 'cafe' ? 'Cafe' : 
                     place.tags.amenity === 'fast_food' ? 'Fast Food' : 
                     place.tags.cuisine ? place.tags.cuisine.split(';')[0].replace('_', ' ') : 'Indian';
                     
        const cuisine = type.charAt(0).toUpperCase() + type.slice(1);
        const name = place.tags.name;
        
        const cityAttr = 
          place.tags['addr:suburb'] || 
          place.tags['addr:neighbourhood'] || 
          place.tags['addr:town'] || 
          place.tags['addr:city'] || 
          selectedLocation.name;
          
        const streetAttr = place.tags['addr:street'] || '';
        const _locationStr = streetAttr ? `${streetAttr}, ${cityAttr}` : `${cityAttr}`;

        const randomImage = foodImages[Math.floor(Math.random() * foodImages.length)];
        const ratingNum = Number((Math.random() * 2 + 3).toFixed(1)); 
        
        const plat = place.lat || place.center?.lat;
        const plon = place.lon || place.center?.lon;
        
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
           <ShieldCheck className="text-[#00e054]" size={14} />
           <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#00e054]">Session Authorized</p>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Dynamic Regional Seeding</h1>
        
        {!isSeeding ? (
          <div className="w-full max-w-lg space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
             
             {/* Dynamic Search Section */}
             <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 text-left block w-full px-2">Discovery Town / Point</label>
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input 
                        type="text"
                        placeholder="e.g., Guntur, Mangalagiri, Tenali..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/10 focus:ring-1 ring-[#00e054] outline-none transition-all"
                      />
                   </div>
                   <button 
                     disabled={isFindingLocation}
                     onClick={handleSearchLocation}
                     className="bg-zinc-800 hover:bg-zinc-700 text-white p-4 rounded-2xl transition-colors disabled:opacity-50"
                   >
                     {isFindingLocation ? <Loader2 className="animate-spin text-[#00e054]" /> : <ChevronRight />}
                   </button>
                </div>
                
                {/* Location Options List */}
                {locationOptions.length > 0 && !selectedLocation && (
                   <div className="space-y-2 mt-4 text-left">
                      <p className="text-[10px] uppercase font-bold text-white/20 px-2">Matches Found:</p>
                      {locationOptions.map((opt, i) => (
                         <div 
                           key={i}
                           onClick={() => setSelectedLocation(opt)}
                           className="bg-white/5 hover:bg-[#00e054]/10 border border-white/5 hover:border-[#00e054]/40 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                         >
                            <div className="flex items-center gap-3">
                               <MapIcon size={16} className="text-white/20 group-hover:text-[#00e054]" />
                               <div>
                                  <p className="text-sm font-bold text-white group-hover:text-[#00e054]">{opt.fullName}</p>
                                  <p className="text-[10px] font-mono text-white/20 uppercase mt-0.5">
                                     {opt.lat.toFixed(4)}, {opt.lng.toFixed(4)}
                                  </p>
                               </div>
                            </div>
                            <ChevronRight size={14} className="text-white/10" />
                         </div>
                      ))}
                   </div>
                )}

                {selectedLocation && (
                   <div className="bg-[#00e054]/5 border border-[#00e054]/20 p-4 rounded-2xl flex items-start justify-between text-left">
                      <div className="flex items-start gap-3">
                        <MapIcon size={18} className="text-[#00e054] mt-0.5" />
                        <div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-[#00e054]/60">Target Confirmed</p>
                           <p className="text-white font-bold">{selectedLocation.fullName}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedLocation(null)}
                        className="text-[9px] uppercase font-black text-rose-500 hover:underline"
                      >
                        Change
                      </button>
                   </div>
                )}
             </div>

             {/* Radius Section */}
             <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">Discovery Radius</label>
                   <span className="text-xs font-black text-[#00e054]">{radiusKm} KM</span>
                </div>
                <div className="relative pt-2">
                   <input 
                     type="range"
                     min="1"
                     max="50"
                     value={radiusKm}
                     onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                     className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#00e054]"
                   />
                </div>
             </div>

            <button 
              onClick={handleSeed}
              disabled={!selectedLocation}
              className="w-full bg-[#00e054] text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#00c044] transition-all hover:-translate-y-1 shadow-2xl shadow-[#00e054]/20 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale disabled:transform-none"
            >
              <Zap className="fill-black group-hover:scale-110 transition-transform" size={20} />
              Inject Region Data
            </button>
          </div>
        ) : (
          <div className="space-y-8 w-full max-w-md bg-zinc-900 p-10 rounded-3xl border border-[#00e054]/20 shadow-2xl">
            <div className="relative">
              <Loader2 className="w-20 h-20 animate-spin text-[#00e054] mx-auto opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xl font-black text-white">{Math.round((progress.current / Math.max(1, progress.total)) * 100)}%</p>
              </div>
            </div>
            <div className="text-center space-y-2">
               <p className="text-white/80 font-bold uppercase tracking-[0.1em] text-sm leading-tight">
                  Sweeping {selectedLocation?.name} Area...
               </p>
               <p className="text-white/30 text-[10px] uppercase font-bold">Processed {progress.current} of {progress.total} spots</p>
            </div>
            <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/10 shadow-inner">
              <div 
                className="bg-gradient-to-r from-[#00e054] to-cyan-400 h-full transition-all duration-300" 
                style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
