import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Review, CravingTag } from "../types";
import { CravingCard } from "./CravingCard";
import { CravingUploadModal } from "./CravingUploadModal";
import { MOCK_CRAVINGS } from "../data/mockData";
import { Flame, Plus, Sparkles, Filter, Loader2 } from "lucide-react";
import { useAuth } from "../App";
import { triggerHaptic } from "../services/nativeService";

const CATEGORIES: { label: string; tag?: CravingTag }[] = [
  { label: "All Cravings" },
  { label: "🔥 Worth It?", tag: "Worth it?" },
  { label: "🍔 First Bite", tag: "First bite reaction" },
  { label: "📍 Hidden Gems", tag: "Hidden restaurant" },
  { label: "🌶️ Spicy Challenge", tag: "Spicy food challenge" },
  { label: "💰 Under ₹500", tag: "₹500 food challenge" },
  { label: "👨‍🍳 Chef Stories", tag: "Chef interview" },
  { label: "🍰 Desserts", tag: "Dessert review" }
];

export function CravingsFeed() {
  const { user, login } = useAuth();
  const [cravings, setCravings] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Cravings");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      where("type", "==", "craving"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Review[];

      // Merge with MOCK_CRAVINGS ensuring zero duplicates
      const existingIds = new Set(fetched.map(c => c.id));
      const combined = [...fetched, ...MOCK_CRAVINGS.filter(m => !existingIds.has(m.id))];
      setCravings(combined);
      setLoading(false);
    }, (err) => {
      console.warn("Cravings fetch notice (using mock stream):", err.message);
      setCravings(MOCK_CRAVINGS);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredCravings = cravings.filter(craving => {
    if (selectedCategory === "All Cravings") return true;
    const cat = CATEGORIES.find(c => c.label === selectedCategory);
    return cat?.tag ? craving.cravingTag === cat.tag : true;
  });

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-start overflow-hidden pt-16 pb-24 md:pb-12">
      
      {/* Top Sleek Control Bar */}
      <div className="fixed top-14 left-0 right-0 z-40 max-w-xl mx-auto px-3.5 flex flex-col items-center gap-2 pointer-events-none">
        <div className="w-full flex items-center justify-between pointer-events-auto bg-black/75 backdrop-blur-2xl border border-white/10 px-3.5 py-1.5 rounded-full shadow-2xl">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Madeater Cravings</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic();
              user ? setIsUploadOpen(true) : login();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-black text-[11px] font-black uppercase tracking-wider hover:bg-orange-400 active:scale-95 transition-all shadow-md shadow-orange-500/20"
          >
            <Plus size={13} />
            <span>Post a Craving</span>
          </button>
        </div>

        {/* Category Filter Pills (Scrollable horizontally) */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-0.5 px-0.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => {
                triggerHaptic();
                setSelectedCategory(cat.label);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border shrink-0 active:scale-95 ${
                selectedCategory === cat.label
                  ? "bg-white text-black border-white shadow-lg font-black"
                  : "bg-black/80 backdrop-blur-md text-white/60 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Snap Scroll Container */}
      {loading ? (
        <div className="h-[75vh] flex flex-col items-center justify-center">
          <Loader2 className="w-9 h-9 animate-spin text-orange-400 mb-3" />
          <p className="text-xs uppercase tracking-widest font-black text-white/40">Loading Cravings...</p>
        </div>
      ) : filteredCravings.length > 0 ? (
        <div className="w-full h-[calc(100dvh-125px)] md:h-[calc(100vh-100px)] snap-y-container no-scrollbar pt-14">
          {filteredCravings.map((craving) => (
            <CravingCard 
              key={craving.id} 
              review={craving} 
              isActive={true}
            />
          ))}
        </div>
      ) : (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <p className="text-white/40 font-serif italic text-base mb-3">No cravings found under this category yet.</p>
          <button
            onClick={() => setSelectedCategory("All Cravings")}
            className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all"
          >
            View All Cravings
          </button>
        </div>
      )}

      <CravingUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
