import React, { useState, useEffect } from "react";
import { TasteDNA, User } from "../types";
import { Sparkles, Flame, Coffee, Cake, Utensils, Award, Users, Share2, Dna, Trophy, ChevronRight } from "lucide-react";
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
    { label: "Spice Tolerance", val: dna.spice, icon: "🌶️", color: "from-rose-500 to-red-500" },
    { label: "Indian & Regional", val: dna.indian, icon: "🍛", color: "from-orange-500 to-amber-500" },
    { label: "Non-Veg Preference", val: dna.nonVeg, icon: "🥩", color: "from-red-500 to-rose-600" },
    { label: "Asian & Noodles", val: dna.asian, icon: "🍜", color: "from-amber-400 to-yellow-500" },
    { label: "Dessert Affinity", val: dna.desserts, icon: "🍰", color: "from-pink-500 to-rose-400" },
    { label: "Coffee Connoisseur", val: dna.coffee, icon: "☕", color: "from-amber-600 to-orange-700" },
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
    <div className="w-full space-y-7 pt-1">
      {/* 1. Seamless Glassmorphism Persona Banner */}
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent border border-white/[0.08] backdrop-blur-xl shadow-lg overflow-hidden transition-all">
        {/* Soft Ambient Radiance */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-orange-500/[0.12] blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/[0.08] blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-500/25">
                <Dna size={12} className="text-orange-400" />
                <span>Taste Genome v2.5</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">• Algorithmic Palate</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white capitalize">
              {dna.personaTitle}
            </h2>

            <p className="text-xs sm:text-[13px] text-zinc-400 font-normal leading-relaxed">
              Synthesized from dining frequency, spice ratings, regional dish logs, and culinary consistency.
            </p>
          </div>

          {/* Balanced Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 pt-1 md:pt-0">
            <button
              onClick={() => {
                triggerHaptic();
                setIsQuizOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-black text-xs font-bold transition-all shadow-md shadow-orange-500/15 active:scale-95 cursor-pointer"
            >
              <Dna size={14} strokeWidth={2.5} />
              <span>Retake Quiz</span>
            </button>

            <button
              onClick={handleShareDNA}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] text-xs font-semibold text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Share2 size={13} />
              <span>Share DNA</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Unlocked Critic Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Unlocked Critic Badges
            </h3>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              setIsQuestsOpen(true);
            }}
            className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <span>All Quests</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {INITIAL_QUEST_BADGES.slice(0, 3).map((badge) => (
            <div
              key={badge.id}
              onClick={() => {
                triggerHaptic();
                setIsQuestsOpen(true);
              }}
              className="p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-orange-500/25 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                {badge.icon}
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors truncate">
                  {badge.title}
                </h5>
                <p className="text-[10px] text-zinc-500 capitalize">{badge.rarity} Badge</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sensory Breakdown */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Sensory Palate Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {attributes.map((attr) => (
            <div
              key={attr.label}
              className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.045] border border-white/[0.06] space-y-2.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{attr.icon}</span>
                  <span className="text-xs font-medium text-zinc-300">{attr.label}</span>
                </div>
                <span className="text-xs font-bold text-zinc-200">{attr.val}%</span>
              </div>

              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${attr.color} rounded-full transition-all duration-700`} 
                  style={{ width: `${attr.val}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Critic Taste Match Leaderboard */}
      <div className="border-t border-white/[0.06] pt-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Critics With Similar Palates
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Matching taste graph proximity
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {critics.length > 0 ? (
            critics.slice(0, 3).map((critic, i) => {
              const matchScore = [92, 87, 81][i] || 82;
              return (
                <Link
                  key={critic.uid}
                  to={`/app/profile/${critic.username || critic.uid}`}
                  className="p-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-orange-500/25 transition-all flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={critic.photoURL || `https://ui-avatars.com/api/?name=${critic.displayName}&background=f97316&color=fff`} 
                      alt={critic.displayName} 
                      className="w-9 h-9 rounded-full border border-white/10 object-cover shrink-0" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors truncate">
                        {critic.displayName}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        @{critic.username || "critic"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-orange-400">{matchScore}%</span>
                    <p className="text-[9px] uppercase font-semibold text-zinc-500">Match</p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xs text-zinc-500">Follow more food lovers to discover palates matched with yours.</p>
            </div>
          )}
        </div>
      </div>

      <TasteQuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
      <CriticQuestsModal isOpen={isQuestsOpen} onClose={() => setIsQuestsOpen(false)} />
    </div>
  );
}
