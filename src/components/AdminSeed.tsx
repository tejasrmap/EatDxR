import React, { useState } from 'react';
import { useAuth } from '../App';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export const AdminSeed: React.FC = () => {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0 });

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
    if (!user) {
      toast.error('Must be logged in to seed.');
      return;
    }
    
    setIsSeeding(true);
    try {
      // 1. Fetch real Overpass API data for Vijayawada (50km radius)
      toast.info('Fetching OpenStreetMap data for Vijayawada (50km radius)...');
      
      const query = `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"](around:50000,16.5062,80.6480);
        node["amenity"="cafe"](around:50000,16.5062,80.6480);
        node["amenity"="fast_food"](around:50000,16.5062,80.6480);
      );
      out body;
      `;
      
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const data = await res.json();
      const validElements = data.elements.filter((e: any) => e.tags && e.tags.name);
      
      // Shuffle & limit to top 300 to not kill Firebase Free Tier instantly
      let topPlaces = validElements.sort(() => 0.5 - Math.random()).slice(0, 300);
      
      setProgress({ total: topPlaces.length, current: 0 });
      let seedCount = 0;

      for (const place of topPlaces) {
        const type = place.tags.amenity === 'cafe' ? 'Cafe' : 
                     place.tags.amenity === 'fast_food' ? 'Fast Food' : 
                     place.tags.cuisine ? place.tags.cuisine.split(';')[0].replace('_', ' ') : 'Indian';
                     
        const cuisine = type.charAt(0).toUpperCase() + type.slice(1);
        const name = place.tags.name;
        // Basic location format
        const _locationStr = place.tags['addr:street'] ? 
          `${place.tags['addr:street']}, ${place.tags['addr:city'] || 'Vijayawada'}` : 
          (Math.random() > 0.5 ? 'Vijayawada, Andhra Pradesh' : 'Guntur, Andhra Pradesh');

        const randomImage = foodImages[Math.floor(Math.random() * foodImages.length)];
        const ratingNum = Number((Math.random() * 2 + 3).toFixed(1)); // 3.0 to 5.0
        
        const docId = `osm-${place.id}`;

        const payload = {
          id: docId,
          name: name,
          cuisine: cuisine,
          location: _locationStr,
          rating: ratingNum,
          reviewCount: Math.floor(Math.random() * 200) + 10,
          image: randomImage,
          menuItems: []
        };
        
        await setDoc(doc(db, 'restaurants', docId), payload);
        seedCount++;
        setProgress({ total: topPlaces.length, current: seedCount });
      }

      toast.success(`Successfully injected ${seedCount} restaurants into the database!`);
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error('Failed to run the seed script. Check console.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <h1 className="text-3xl font-black uppercase tracking-widest text-[#00e054] mb-4">Admin Database Injection</h1>
      <p className="text-white/60 mb-8 font-serif leading-relaxed">
        This tool connects securely to the OpenStreetMap graph, scrapes all restaurants, cafes, and bakeries within a 50km radius of Vijayawada and Guntur, injects high-res Unsplash restaurant-interior stock imagery, and writes them into your Firebase database.
      </p>

      {!isSeeding ? (
        <button 
          onClick={handleSeed}
          className="bg-[#00e054] text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-[#00c044] transition-colors"
        >
          Initialize Mass-Seed Operation
        </button>
      ) : (
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00e054] mx-auto"></div>
          <p className="text-white/80 font-bold tracking-widest">
            INJECTING {progress.current} / {progress.total}...
          </p>
          <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden border border-white/10">
            <div 
              className="bg-[#00e054] h-full transition-all duration-300" 
              style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
            />
          </div>
          <p className="text-white/40 text-xs italic">Do not close this page.</p>
        </div>
      )}
    </div>
  );
};
