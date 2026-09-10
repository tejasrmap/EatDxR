import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Dna, Sparkles, Check, ChevronRight, RefreshCw, 
  Flame, Award, Heart, Share2, Compass
} from 'lucide-react';
import { FlavorFingerprint } from '../types';
import { useAuth } from '../App';
import { triggerHaptic } from '../services/nativeService';
import { toast } from 'sonner';

interface QuestionOption {
  label: string;
  sublabel: string;
  icon: string;
  spiceDelta: number;
  umamiDelta: number;
  sweetDelta: number;
  crunchDelta: number;
  streetDelta: number;
  adventureDelta: number;
}

interface QuizQuestion {
  title: string;
  subtitle: string;
  options: QuestionOption[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    title: 'How do you handle spice heat?',
    subtitle: 'Choose your honest comfort zone',
    options: [
      { label: 'Mild & Creamy', sublabel: 'Butter chicken, malai paneer, gentle herbs', icon: '🧈', spiceDelta: 20, umamiDelta: 50, sweetDelta: 40, crunchDelta: 20, streetDelta: 20, adventureDelta: 20 },
      { label: 'Pleasantly Zesty', sublabel: 'Pepper rasam, green chillies, spicy mayo', icon: '🌶️', spiceDelta: 60, umamiDelta: 70, sweetDelta: 30, crunchDelta: 50, streetDelta: 50, adventureDelta: 60 },
      { label: 'Fiery Volcano', sublabel: 'Guntur mirchi, ghost pepper, Sichuan peppercorns', icon: '🔥', spiceDelta: 95, umamiDelta: 85, sweetDelta: 10, crunchDelta: 60, streetDelta: 85, adventureDelta: 95 },
    ],
  },
  {
    title: 'What flavor profile triggers instant cravings?',
    subtitle: 'When hunger strikes at 9 PM',
    options: [
      { label: 'Deep Umami & Smoke', sublabel: 'Truffle mushrooms, charred kebabs, miso broth', icon: '🍄', spiceDelta: 40, umamiDelta: 95, sweetDelta: 15, crunchDelta: 40, streetDelta: 60, adventureDelta: 80 },
      { label: 'Sweet & Decadent', sublabel: 'Hot fudge DBC, warm cinnamon buns, molten cookies', icon: '🍫', spiceDelta: 10, umamiDelta: 30, sweetDelta: 95, crunchDelta: 50, streetDelta: 30, adventureDelta: 40 },
      { label: 'Crisp & Tangy Citrus', sublabel: 'Pani puri, ceviche, sourdough sourdough with feta', icon: '🍋', spiceDelta: 50, umamiDelta: 60, sweetDelta: 30, crunchDelta: 85, streetDelta: 70, adventureDelta: 75 },
    ],
  },
  {
    title: 'Your dream dining environment?',
    subtitle: 'Where do you feel happiest eating?',
    options: [
      { label: 'Late Night Street Stalls', sublabel: 'Plastic stools, smoke rising, bustling energy', icon: '🛵', spiceDelta: 75, umamiDelta: 80, sweetDelta: 20, crunchDelta: 70, streetDelta: 95, adventureDelta: 85 },
      { label: 'Trendy Indie Bistro', sublabel: 'Craft brews, vinyl records, chef-driven menu', icon: '🍷', spiceDelta: 50, umamiDelta: 80, sweetDelta: 60, crunchDelta: 60, streetDelta: 40, adventureDelta: 80 },
      { label: 'Refined Tablecloth Dining', sublabel: 'Impeccable plating, wine pairing, quiet elegance', icon: '🕯️', spiceDelta: 30, umamiDelta: 85, sweetDelta: 50, crunchDelta: 50, streetDelta: 10, adventureDelta: 60 },
    ],
  },
  {
    title: 'Texture is everything in great food. Your pick?',
    subtitle: 'What makes the first bite unforgettable?',
    options: [
      { label: 'Super Crispy & Crackling', sublabel: 'Deep fried crusts, papdi, pork crackling', icon: '⚡', spiceDelta: 60, umamiDelta: 70, sweetDelta: 20, crunchDelta: 98, streetDelta: 70, adventureDelta: 60 },
      { label: 'Silky, Molten & Creamy', sublabel: 'Burrata, bone marrow butter, gelato', icon: '🍦', spiceDelta: 20, umamiDelta: 80, sweetDelta: 70, crunchDelta: 20, streetDelta: 30, adventureDelta: 65 },
      { label: 'Chewy & Al Dente', sublabel: 'Handmade noodles, authentic pasta, chewy mochi', icon: '🍜', spiceDelta: 50, umamiDelta: 85, sweetDelta: 30, crunchDelta: 40, streetDelta: 50, adventureDelta: 80 },
    ],
  },
];

interface TasteQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TasteQuizModal({ isOpen, onClose }: TasteQuizModalProps) {
  const { user, updateDishdUser } = useAuth();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({
    spice: 50,
    umami: 50,
    sweet: 50,
    crunch: 50,
    street: 50,
    adventure: 50,
  });
  const [result, setResult] = useState<FlavorFingerprint | null>(null);

  if (!isOpen) return null;

  const handleSelectOption = (opt: QuestionOption) => {
    triggerHaptic();
    const nextScores = {
      spice: Math.round((scores.spice + opt.spiceDelta) / 2),
      umami: Math.round((scores.umami + opt.umamiDelta) / 2),
      sweet: Math.round((scores.sweet + opt.sweetDelta) / 2),
      crunch: Math.round((scores.crunch + opt.crunchDelta) / 2),
      street: Math.round((scores.street + opt.streetDelta) / 2),
      adventure: Math.round((scores.adventure + opt.adventureDelta) / 2),
    };
    setScores(nextScores);

    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate Persona
      let title = 'The Gastronomic Explorer';
      let tagline = 'Balanced epicure seeking bold and authentic flavors.';

      if (nextScores.spice > 75) {
        title = 'The Fiery Spice Hunter';
        tagline = 'Chases scorching chilies, bold masala, and vibrant night food.';
      } else if (nextScores.sweet > 70) {
        title = 'The Dessert Connoisseur';
        tagline = 'Master of artisanal pastries, chocolate fondants, and gelatos.';
      } else if (nextScores.umami > 80 && nextScores.street > 70) {
        title = 'The Midnight Umami Nomad';
        tagline = 'Lives for charcoal smoke, broth depth, and street gastronomy.';
      } else if (nextScores.street < 30) {
        title = 'The Fine Dining Purist';
        tagline = 'Values delicate balance, immaculate technique, and ambience.';
      }

      const calculatedResult: FlavorFingerprint = {
        spiceTolerance: nextScores.spice,
        umamiRichness: nextScores.umami,
        sweetTooth: nextScores.sweet,
        crunchTexture: nextScores.crunch,
        streetVsFine: nextScores.street,
        adventureScale: nextScores.adventure,
        personaTitle: title,
        tagline: tagline,
      };

      setResult(calculatedResult);

      // Persist to user tasteDNA profile
      if (user) {
        updateDishdUser({
          tasteDNA: {
            spice: nextScores.spice,
            indian: nextScores.street,
            nonVeg: nextScores.adventure,
            asian: nextScores.umami,
            desserts: nextScores.sweet,
            coffee: nextScores.crunch,
            personaTitle: title,
          },
        });
      }
      toast.success('Taste DNA Fingerprint updated!');
    }
  };

  const handleRestart = () => {
    triggerHaptic();
    setStep(0);
    setScores({ spice: 50, umami: 50, sweet: 50, crunch: 50, street: 50, adventure: 50 });
    setResult(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-y-auto gpu-accelerated"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Dna size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Taste DNA Quiz</h3>
                <p className="text-[10px] text-white/50">Flavor Fingerprint Calculator</p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic();
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {result ? (
            /* RESULT FINGERPRINT VIEW */
            <div className="py-4 space-y-4 text-center">
              <div className="p-5 rounded-3xl bg-gradient-to-b from-orange-950/60 via-zinc-900 to-black border border-orange-500/40 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-2">
                  <Sparkles size={24} />
                </div>

                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Your Taste Persona
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">{result.personaTitle}</h2>
                <p className="text-xs text-white/70 italic mt-1 leading-relaxed">{result.tagline}</p>

                {/* Radar / Axis Bars */}
                <div className="space-y-2.5 mt-5 text-left">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
                      <span className="flex items-center gap-1">🌶️ Spice Heat Tolerance</span>
                      <span className="text-orange-400 font-mono">{result.spiceTolerance}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${result.spiceTolerance}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
                      <span className="flex items-center gap-1">🍄 Umami & Savory Depth</span>
                      <span className="text-amber-400 font-mono">{result.umamiRichness}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${result.umamiRichness}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
                      <span className="flex items-center gap-1">🍫 Sweet & Dessert Bias</span>
                      <span className="text-pink-400 font-mono">{result.sweetTooth}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-400 rounded-full" style={{ width: `${result.sweetTooth}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
                      <span className="flex items-center gap-1">⚡ Crunch & Crisp Texture</span>
                      <span className="text-cyan-400 font-mono">{result.crunchTexture}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${result.crunchTexture}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} /> Retake Quiz
                </button>
                <button
                  onClick={() => {
                    triggerHaptic();
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/20"
                >
                  Done & Saved
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUIZ QUESTION */
            <div className="py-3 space-y-4">
              {/* Progress bar */}
              <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                <span>Question {step + 1} of {QUIZ_QUESTIONS.length}</span>
                <span>{Math.round(((step + 1) / QUIZ_QUESTIONS.length) * 100)}% Complete</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                />
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-white leading-snug">
                  {QUIZ_QUESTIONS[step].title}
                </h2>
                <p className="text-xs text-white/50 mt-0.5">{QUIZ_QUESTIONS[step].subtitle}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {QUIZ_QUESTIONS[step].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className="w-full p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 hover:border-orange-500/40 text-left flex items-center gap-3.5 transition-all active:scale-98 group cursor-pointer"
                  >
                    <span className="text-2xl shrink-0">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                        {opt.label}
                      </h4>
                      <p className="text-[10px] text-white/50 line-clamp-1">{opt.sublabel}</p>
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
