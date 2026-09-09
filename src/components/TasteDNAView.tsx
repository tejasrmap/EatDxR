import React from "react";
import { TasteDNA, User } from "../types";
import { Sparkles, Flame, Coffee, Cake, Utensils, Award, Users, Share2 } from "lucide-react";
import { MOCK_CRITICS_DATA } from "../data/mockData";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface TasteDNAViewProps {
  user: User;
}

export function TasteDNAView({ user }: TasteDNAViewProps) {
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

  const handleShareDNA = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Taste DNA profile link copied!");
  };

  return (
    <div className="w-full space-y-12">
      {/* DNA Persona Banner */}
      <div className="relative rounded-3xl p-8 bg-gradient-to-br from-zinc-900 via-zinc-900/60 to-zinc-950 border border-white/10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/30">
                Taste Genome v2.5
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

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleShareDNA}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 text-xs font-bold text-white transition-all"
            >
              <Share2 size={14} />
              <span>Share DNA</span>
            </button>
            <Link
              to="/wrapped"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 text-black text-xs font-black uppercase tracking-wider hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
            >
              <Sparkles size={14} />
              <span>Year in Food</span>
            </Link>
          </div>
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
          {MOCK_CRITICS_DATA.filter(c => c.uid !== user.uid).slice(0, 3).map((critic, i) => {
            const matchScore = [89, 84, 79][i] || 82;
            return (
              <Link
                key={critic.uid}
                to={`/profile/${critic.username || critic.uid}`}
                className="p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/40 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={critic.photoURL} alt={critic.displayName} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                      {critic.displayName}
                    </p>
                    <p className="text-[10px] text-white/40 truncate">
                      @{critic.username}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-orange-400">{matchScore}%</span>
                  <p className="text-[9px] uppercase font-bold text-white/40">Match</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
