import React, { useState } from "react";
import { Sparkles, X, Send, Bot, Utensils, Star, MapPin, ArrowRight, Loader2, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { MOCK_DISHES } from "../data/mockData";

interface Message {
  role: "user" | "assistant";
  content: string;
  recommendations?: {
    name: string;
    type: "restaurant" | "dish";
    score: number;
    location: string;
    note: string;
    id: string;
  }[];
}

interface AIFoodAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const QUICK_PROMPTS = [
  "I'm in Hyderabad with ₹1,000 for two. I want spicy food.",
  "Where can I get the best crispy ghee roast dosa?",
  "Best late-night spot for Haleem & Chai",
  "Romantic date night with great ambience under ₹3,000"
];

export function AIFoodAssistant({ isOpen, onClose, initialPrompt }: AIFoodAssistantProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am Chef AI, your personal food guide. Ask me anything about regional flavors, budget dining, or where to find the absolute best dishes."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (initialPrompt && isOpen) {
      setQuery(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || query).trim();
    if (!promptText || isLoading) return;

    const userMessage: Message = { role: "user", content: promptText };
    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    // Simulate intelligent culinary graph response
    setTimeout(() => {
      let reply = "";
      let recs: Message["recommendations"] = [];

      const lower = promptText.toLowerCase();

      if (lower.includes("spicy") || lower.includes("hyderabad") || lower.includes("1000") || lower.includes("1,000")) {
        reply = "Based on your taste profile and critic ratings across Hyderabad, here are 3 high-impact spots that deliver authentic heat within a ₹1,000 budget:";
        recs = [
          {
            name: "Bawarchi (RTC X Roads)",
            type: "restaurant",
            score: 9.6,
            location: "RTC X Roads, Hyderabad",
            note: "Order the Chicken Dum Biryani with extra mirchi ka salan. Around ₹450 for two.",
            id: "bawarchi-rtc"
          },
          {
            name: "Hotel Shadab",
            type: "restaurant",
            score: 9.4,
            location: "Old City, Hyderabad",
            note: "Legendary saffron depth and mutton chops. Roughly ₹600 for two.",
            id: "shadab-oldcity"
          },
          {
            name: "Ulavacharu",
            type: "restaurant",
            score: 9.7,
            location: "Jubilee Hills, Hyderabad",
            note: "Home of fiery Andhra Gongura Mutton. Pair with steamed rice.",
            id: "ulavacharu"
          }
        ];
      } else if (lower.includes("dosa") || lower.includes("breakfast") || lower.includes("crisp")) {
        reply = "Here are the highest-rated spots for artisanal ghee roast dosas backed by community scores:";
        recs = [
          {
            name: "Neyi Karam Ghee Roast Dosa",
            type: "dish",
            score: 9.5,
            location: "The Rameshwaram Cafe / Chutneys",
            note: "Ultra-crisp fermented crepe slathered in pure ghee and red garlic podi.",
            id: "ghee-roast-dosa"
          },
          {
            name: "Ram Ki Bandi",
            type: "restaurant",
            score: 9.2,
            location: "Mozamjahi Market, Hyderabad",
            note: "Midnight molten butter dosa haven. Opens at 3:00 AM.",
            id: "ram-ki-bandi"
          }
        ];
      } else if (lower.includes("date") || lower.includes("romantic") || lower.includes("ambience")) {
        reply = "For an intimate date night with flattering lighting, curated drinks, and refined plates:";
        recs = [
          {
            name: "Trishna",
            type: "restaurant",
            score: 9.7,
            location: "Kala Ghoda, Mumbai",
            note: "World-renowned butter garlic crab in a historic candlelit setting.",
            id: "trishna-mumbai"
          },
          {
            name: "Subko Specialty Coffee",
            type: "restaurant",
            score: 9.6,
            location: "Bandra, Mumbai",
            note: "Sensory pour-over bar and artisanal lamination in a restored Goan bungalow.",
            id: "subko-coffee"
          }
        ];
      } else {
        reply = `Here are standout culinary recommendations tailored to "${promptText}":`;
        recs = [
          {
            name: "Hyderabadi Chicken Dum Biryani",
            type: "dish",
            score: 9.3,
            location: "Multiple Cities",
            note: "The benchmark of Nizam slow-cooking and spice harmony.",
            id: "chicken-biryani"
          },
          {
            name: "Royal Mutton Haleem",
            type: "dish",
            score: 9.7,
            location: "Charminar, Hyderabad",
            note: "12-hour wood-fired beaten meat and wheat elixir.",
            id: "mutton-haleem"
          }
        ];
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: reply,
        recommendations: recs
      }]);
      setIsLoading(false);
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-2xl"
      />

      {/* Concierge Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl h-[85vh] bg-zinc-950 border border-white/10 rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 text-white"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400">Madeater</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold">Chef AI</span>
              </div>
              <h2 className="text-sm font-bold text-white/80">Your Personal Food Advisor</h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-orange-500 text-black font-semibold rounded-tr-none shadow-lg shadow-orange-500/10"
                    : "bg-zinc-900 border border-white/10 text-white/90 rounded-tl-none font-serif"
                }`}
              >
                {m.content}
              </div>

              {/* Structured Recommendation Cards */}
              {m.recommendations && m.recommendations.length > 0 && (
                <div className="w-full mt-4 space-y-2.5">
                  {m.recommendations.map((rec, rIdx) => (
                    <Link
                      key={rIdx}
                      to={rec.type === "dish" ? `/dish/${rec.id}` : `/restaurant/${rec.id}`}
                      onClick={onClose}
                      className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/50 flex items-center justify-between gap-4 transition-all group block"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-black uppercase text-orange-400">
                            {rec.type}
                          </span>
                          <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                            {rec.name}
                          </h4>
                        </div>
                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <MapPin size={11} className="text-orange-400 shrink-0" />
                          {rec.location}
                        </p>
                        <p className="text-xs text-white/70 italic font-serif mt-1">
                          "{rec.note}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 border border-white/10">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-black text-white">{rec.score.toFixed(1)}</span>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-orange-500 group-hover:text-black flex items-center justify-center transition-colors">
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 text-xs text-white/40">
              <Loader2 size={14} className="animate-spin text-orange-400" />
              <span>Analyzing Taste Graph & verified critic ratings...</span>
            </div>
          )}
        </div>

        {/* Quick Prompt Chips */}
        <div className="px-6 py-2 border-t border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-[11px] text-white/60 hover:text-white hover:border-orange-500 whitespace-nowrap transition-colors shrink-0"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask anything (e.g. Best Biryani in Hyderabad under ₹500)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-zinc-900 border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!query.trim() || isLoading}
            className="w-11 h-11 rounded-full bg-orange-500 text-black flex items-center justify-center hover:bg-orange-400 disabled:opacity-40 transition-colors shadow-lg shadow-orange-500/20 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
