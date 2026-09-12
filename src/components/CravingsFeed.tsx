import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Review, CravingTag } from "../types";
import { CravingCard } from "./CravingCard";
import { CravingUploadModal } from "./CravingUploadModal";
import { Flame, Plus, Sparkles, Filter, Loader2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

      setCravings(fetched);
      setLoading(false);
    }, (err) => {
      console.warn("Cravings fetch notice:", err.message);
      setCravings([]);
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
    <div className="h-[100dvh] w-full bg-black text-white relative flex flex-col items-center justify-start overflow-hidden select-none">
      
      {/* Top Sleek Control Bar (Floating right below notch) */}
      <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.5rem)] left-0 right-0 z-40 max-w-xl mx-auto px-3 flex flex-col items-center gap-2 pointer-events-none">
        <div className="w-full flex items-center justify-between pointer-events-auto bg-black/75 backdrop-blur-2xl border border-white/10 px-3.5 py-1.5 rounded-full shadow-2xl">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Cravings</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic();
              user ? setIsUploadOpen(true) : login();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black text-[11px] font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-orange-500/25 cursor-pointer"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Post Reel</span>
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
              className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border shrink-0 active:scale-95 cursor-pointer ${
                selectedCategory === cat.label
                  ? "bg-white text-black border-white shadow-lg font-black"
                  : "bg-black/85 backdrop-blur-md text-white/60 border-white/10 hover:border-white/30 hover:text-white"
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
        <div className="w-full h-[100dvh] snap-y snap-mandatory overflow-y-scroll no-scrollbar select-none">
          {filteredCravings.map((craving) => (
            <CravingCard 
              key={craving.id} 
              review={craving} 
              isActive={true}
            />
          ))}
        </div>
      ) : (
        <div className="h-[70vh] flex flex-col items-center justify-center text-center px-6 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500/20 to-rose-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4 shadow-xl">
            <Flame size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">No Cravings Yet</h3>
          <p className="text-xs text-white/50 mb-6">
            {selectedCategory === "All Cravings" 
              ? "Be the very first to capture and share a crave-worthy food reel!"
              : `No cravings found under "${selectedCategory}".`}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {selectedCategory !== "All Cravings" && (
              <button
                onClick={() => setSelectedCategory("All Cravings")}
                className="px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all"
              >
                View All
              </button>
            )}
            <button
              onClick={() => {
                triggerHaptic();
                if (!user) login();
                else setIsUploadOpen(true);
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-orange-500/25 active:scale-95 transition-all"
            >
              + Post First Craving
            </button>
          </div>
        </div>
      )}

      <CravingUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
