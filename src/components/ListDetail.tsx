import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FoodList } from "../types";
import { MOCK_LISTS } from "../data/mockData";
import { ChevronLeft, Heart, Bookmark, Share2, Star, MapPin, Plus, ArrowRight, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../App";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";

export function ListDetail() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { getAppUrl, isAppMode } = useAppUrl();
  const [list, setList] = useState<FoodList | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    // Check mock data first
    const mock = MOCK_LISTS.find(l => l.id === listId);
    if (mock) {
      setList(mock);
      setLikesCount(mock.likes);
      return;
    }

    // Try fetching from Firestore
    if (listId) {
      getDoc(doc(db, "lists", listId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data() as FoodList;
          setList({ ...data, id: snap.id });
          setLikesCount(data.likes || 0);
        } else {
          setList(MOCK_LISTS[0]);
          setLikesCount(MOCK_LISTS[0].likes);
        }
      }).catch(() => {
        setList(MOCK_LISTS[0]);
        setLikesCount(MOCK_LISTS[0].likes);
      });
    }
  }, [listId]);

  if (!list) return null;

  const handleLike = () => {
    if (!user) { login(); return; }
    setHasLiked(!hasLiked);
    setLikesCount(prev => prev + (hasLiked ? -1 : 1));
    toast.success(hasLiked ? "Unliked list" : "Liked list!");
  };

  const handleSaveAll = () => {
    if (!user) { login(); return; }
    toast.success("All list items saved to your Want-to-Eat!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("List link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-black text-white pt-4 sm:pt-12 pb-24 px-4 sm:px-6 max-w-5xl mx-auto">
      
      {/* Back button & Action controls */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        {!isAppMode ? (
          <button 
            onClick={() => { triggerHaptic(); navigate(-1); }}
            className="flex items-center gap-1.5 text-xs uppercase font-bold text-white/60 hover:text-white transition-colors active:scale-95"
          >
            <ChevronLeft size={16} />
            <span>Back to Lists</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-3">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
              hasLiked 
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
            }`}
          >
            <Heart size={14} className={hasLiked ? "fill-rose-400" : ""} />
            <span>{likesCount}</span>
          </button>

          <button 
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white/80"
          >
            <Bookmark size={14} />
            <span>Save All</span>
          </button>

          <button 
            onClick={handleShare}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="mb-12 space-y-4 border-b border-white/10 pb-8">
        <div className="flex items-center gap-3">
          <img 
            src={list.userPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
            alt={list.userName} 
            className="w-8 h-8 rounded-full border border-white/20 object-cover" 
          />
          <span className="text-xs font-bold text-white/80">Curated by {list.userName || "Critic"}</span>
          {list.isRanked && (
            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider text-amber-400">
              Ranked
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
          {list.title}
        </h1>

        <p className="text-sm md:text-base text-white/60 font-serif italic max-w-2xl leading-relaxed">
          "{list.description}"
        </p>
      </div>

      {/* Ranked Items List */}
      <div className="space-y-4">
        {list.items?.map((item, idx) => (
          <div 
            key={item.id || idx}
            className="p-6 rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-orange-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
          >
            <div className="flex items-start md:items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                idx === 0 ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" :
                idx === 1 ? "bg-slate-300 text-black" :
                idx === 2 ? "bg-amber-700 text-white" : "bg-white/10 text-white/60"
              }`}>
                #{idx + 1}
              </div>

              <div>
                <h3 className="text-base md:text-lg font-black text-white group-hover:text-orange-400 transition-colors">
                  {item.name}
                </h3>
                {item.location && (
                  <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-orange-400" />
                    {item.location}
                  </p>
                )}
                {item.note && (
                  <p className="text-xs text-white/70 italic font-serif mt-2 max-w-xl">
                    "{item.note}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              {item.score && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-white">{item.score.toFixed(1)}</span>
                </div>
              )}
              <Link 
                to={getAppUrl(item.type === "dish" ? `/dish/${encodeURIComponent(item.name)}` : `/restaurant/${item.id}`)}
                onClick={() => triggerHaptic()}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-orange-500 hover:text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 touch-manipulation"
              >
                <span>View</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
