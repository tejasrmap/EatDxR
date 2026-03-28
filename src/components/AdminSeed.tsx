import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { MapPin, Zap, Database, Loader2, IndianRupee, Globe, Lock, ShieldCheck } from 'lucide-react';

type SeedingRegion = 'SRMAP' | 'VIJAYAWADA';

// Admin Security Constants
const ADMIN_PASSWORD = "ADMIN-EAT-DxR";

export const AdminSeed: React.FC = () => {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [targetRegion, setTargetRegion] = useState<SeedingRegion>('SRMAP');
  const [progress, setProgress] = useState({ total: 0, current: 0 });
  
  // Security States
  const [accessKey, setAccessKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleAuthorize = () => {
    if (accessKey === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      toast.success("Secondary Authentication Successful.");
    } else {
      toast.error("Invalid Access Key.");
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

    setIsSeeding(true);
    try {
      const coords = targetRegion === 'SRMAP' ? '16.4819,80.5050' : '16.5062,80.6480';
      const radius = targetRegion === 'SRMAP' ? 30000 : 15000;
      
      toast.info(`Fetching OSM data for ${targetRegion}...`);
      
      const overpassQuery = `[out:json][timeout:60];(node["amenity"="restaurant"](around:${radius},${coords});node["amenity"="cafe"](around:${radius},${coords});node["amenity"="fast_food"](around:${radius},${coords}););out center;`;
      
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });
      
      if (!res.ok) throw new Error(`Overpass API blocked with HTTP ${res.status}`);
      
      const text = await res.text();
      if (text.trim().startsWith('<')) {
        throw new Error('Mapping API returned an XML Error!');
      }
      
      const data = JSON.parse(text);
      const validElements = data.elements?.filter((e: any) => e.tags && e.tags.name) || [];
      
      if (validElements.length === 0) throw new Error("No payload elements found.");
      
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
          (targetRegion === 'SRMAP' ? 'Guntur/Mangalagiri Area' : 'Vijayawada');
          
        const streetAttr = place.tags['addr:street'] || '';
        const _locationStr = streetAttr ? `${streetAttr}, ${cityAttr}` : `${cityAttr}`;

        const randomImage = foodImages[Math.floor(Math.random() * foodImages.length)];
        const ratingNum = Number((Math.random() * 2 + 3).toFixed(1)); 
        
        const lat = place.lat || place.center?.lat;
        const lng = place.lon || place.center?.lon;
        
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
          lat: lat,
          lng: lng
        };
        
        await setDoc(doc(db, 'restaurants', docId), payload);
        seedCount++;
        setProgress({ total: topPlaces.length, current: seedCount });
      }

      toast.success(`${targetRegion} sweep complete!`);
    } catch (error: any) {
      console.error('Seeding error:', error);
      toast.error(`Admin Error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // 1. Password Protection View
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
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Database Initialization</h1>
        
        {!isSeeding ? (
          <div className="w-full max-w-lg space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
             <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 text-left block w-full px-2">Regional Sweep Target</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTargetRegion('SRMAP')}
                    className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${targetRegion === 'SRMAP' ? 'bg-[#00e054]/10 border-[#00e054] ring-2 ring-[#00e054]/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    <Globe className={targetRegion === 'SRMAP' ? 'text-[#00e054]' : 'text-white/20'} />
                    <div className="text-center">
                      <p className="font-bold text-sm">SRMAP Region</p>
                      <p className="text-[10px] text-white/30 uppercase mt-1">30km Radius</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setTargetRegion('VIJAYAWADA')}
                    className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${targetRegion === 'VIJAYAWADA' ? 'bg-[#00e054]/10 border-[#00e054] ring-2 ring-[#00e054]/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    <MapPin className={targetRegion === 'VIJAYAWADA' ? 'text-[#00e054]' : 'text-white/20'} />
                    <div className="text-center">
                      <p className="font-bold text-sm">Vijayawada</p>
                      <p className="text-[10px] text-white/30 uppercase mt-1">15km Radius</p>
                    </div>
                  </button>
                </div>
             </div>

            <button 
              onClick={handleSeed}
              className="w-full bg-[#00e054] text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#00c044] transition-all hover:-translate-y-1 shadow-2xl shadow-[#00e054]/20 flex items-center justify-center gap-3 group"
            >
              <Zap className="fill-black group-hover:scale-110 transition-transform" size={20} />
              Execute Regional Sweep
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
            <div className="space-y-2">
              <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-sm">
                 Gathering Establishments...
              </p>
              <p className="text-white/30 text-[10px] uppercase font-bold">Injecting {progress.current} of {progress.total} locations</p>
            </div>
            <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/10 shadow-inner">
              <div 
                className="bg-gradient-to-r from-[#00e054] to-cyan-400 h-full transition-all duration-300" 
                style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
            <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest animate-pulse">Security Sweep In Progress • Please stand by</p>
          </div>
        )}
      </div>
    </div>
  );
};
