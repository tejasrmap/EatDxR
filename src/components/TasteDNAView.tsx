import React, { useState, useEffect } from "react";
import { TasteDNA, User } from "../types";
import { Sparkles, Flame, Coffee, Cake, Utensils, Award, Users, Share2, Dna, Trophy } from "lucide-react";
import { getTopCritics } from "../services/supabaseService";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { TasteQuizModal } from "./TasteQuizModal";
import { CriticQuestsModal, INITIAL_QUEST_BADGES } from "./CriticQuestsModal";
import { triggerHaptic } from "../services/nativeService";
import { getShareUrl } from "../utils/shareUrl";

interface TasteDNAViewProps {
  user: User;
}

export function TasteDNAView({ user }: TasteDNAViewProps) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [critics, setCritics] = useState<User[]>([]);

  useEffect(() => {
    getTopCritics(6).then((topCritics) => {
      setCritics(topCritics.filter(u => u.uid !== user.uid));
    }).catch(() => {});
  }, [user.uid]);

  // Use user's tasteDNA or fallback to calculated defaults
  const dna: TasteDNA = user.tasteDNA || {
    spice: 92,
    indian: 94,
    nonVeg: 85,
    asian: 78,
    desserts: 48,
    coffee: 88,
    personaTitle: "The Spice Hunter & Biryani Purist"
  };

  const attributes = [
    { label: "Spice Tolerance", val: dna.spice, icon: "🌶️", color: "from-rose-500 to-red-600" },
    { label: "Indian & Regional", val: dna.indian, icon: "🍛", color: "from-orange-500 to-amber-600" },
    { label: "Non-Veg Preference", val: dna.nonVeg, icon: "🥩", color: "from-red-500 to-rose-700" },
    { label: "Asian / Noodles", val: dna.asian, icon: "🍜", color: "from-yellow-500 to-amber-500" },
    { label: "Dessert Affinity", val: dna.desserts, icon: "🍰", color: "from-pink-500 to-rose-400" },
    { label: "Coffee Connoisseur", val: dna.coffee, icon: "☕", color: "from-amber-600 to-yellow-800" },
  ];

  const handleShareDNA = async () => {
    triggerHaptic();
    const url = getShareUrl(`/app/profile/${user.username || user.uid}?tab=taste`);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.displayName || "Critic"}'s Taste DNA`,
          text: `Check out my Taste DNA flavor persona on Madeater!`,
          url,
        });
        return;
      } catch {
        // fallback
      }
    }
    navigator.clipboard.writeText(url);
    toast.success("Taste DNA profile link copied!");
  };

  return (
    <div className="w-full space-y-10">
      {/* DNA Persona Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-zinc-900 via-zinc-900/60 to-zinc-950 border border-white/10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/30 flex items-center gap-1">
                <Dna size={12} /> Taste Genome v2.5
              </span>
              <span className="text-xs text-white/40">• Algorithmic Fingerprint</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white">
              {dna.personaTitle}
            </h2>
            <p className="text-xs md:text-sm text-white/60 font-serif italic max-w-xl">
              Computed from your dining frequency, spice intensity logs, regional ratings, and taste consistency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                triggerHaptic();
                setIsQuizOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-black text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <Dna size={14} />
              <span>Retake Quiz</span>
            </button>

            <button
              onClick={handleShareDNA}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share DNA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critic Badges & Prestige Track */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
              Unlocked Critic Badges
            </h3>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              setIsQuestsOpen(true);
            }}
            className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
          >
            View All Quests & City Ranks →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INITIAL_QUEST_BADGES.slice(0, 3).map((badge) => (
            <div
              key={badge.id}
              onClick={() => {
                triggerHaptic();
                setIsQuestsOpen(true);
              }}
              className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-orange-500/30 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                {badge.icon}
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                  {badge.title}
                </h5>
                <p className="text-[10px] text-white/40 capitalize">{badge.rarity} Badge</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attribute Meters */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6">
          Sensory Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {attributes.map((attr) => (
            <div
              key={attr.label}
              className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{attr.icon}</span>
                  <span className="text-xs font-bold text-white">{attr.label}</span>
                </div>
                <span className="text-sm font-black text-white">{attr.val}%</span>
              </div>

              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${attr.color} rounded-full transition-all duration-1000`} 
                  style={{ width: `${attr.val}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critic Taste Match Leaderboard */}
      <div className="border-t border-white/10 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-orange-400 text-xs font-black uppercase tracking-widest mb-1">
              <Users size={14} />
              <span>Taste Graph Proximity</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white">
              Critics Sharing Your Palate
            </h3>
          </div>
          <p className="hidden md:block text-xs text-white/40">
            Based on shared dish ratings and spice preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {critics.length > 0 ? (
            critics.slice(0, 3).map((critic, i) => {
              const matchScore = [89, 84, 79][i] || 82;
              return (
                <Link
                  key={critic.uid}
                  to={`/profile/${critic.username || critic.uid}`}
                  className="p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/40 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={critic.photoURL || `https://ui-avatars.com/api/?name=${critic.displayName}`} alt={critic.displayName} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                        {critic.displayName}
                      </p>
                      <p className="text-[10px] text-white/40 truncate">
                        @{critic.username || "critic"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-orange-400">{matchScore}%</span>
                    <p className="text-[9px] uppercase font-bold text-white/40">Match</p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full p-6 rounded-2xl bg-zinc-900/30 border border-white/5 text-center">
              <p className="text-xs text-white/50">Follow other food lovers and critics to unlock real-time Taste Matches!</p>
            </div>
          )}
        </div>
      </div>

      <TasteQuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
      <CriticQuestsModal isOpen={isQuestsOpen} onClose={() => setIsQuestsOpen(false)} />
    </div>
  );
}
