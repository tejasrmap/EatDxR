import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Heart, 
  Send, 
  Flame, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Star
} from "lucide-react";
import { triggerHaptic } from "../services/nativeService";
import { toast } from "sonner";
import { useAuth } from "../App";
import { sendDirectMessage } from "../services/supabaseService";

export interface StoryItem {
  id: string;
  criticId: string;
  criticName: string;
  criticUsername: string;
  criticPhoto: string;
  mediaUrl: string;
  isVideo?: boolean;
  dishName?: string;
  restaurantName?: string;
  restaurantId?: string;
  rating?: number;
  spiceLevel?: number;
  poll?: {
    question: string;
    yesVotes: number;
    noVotes: number;
    userVote?: "yes" | "no";
  };
  timestamp: string;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  left: number;
}

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryItem[];
  initialIndex?: number;
}

const DURATION_PER_STORY_MS = 5000;

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  stories,
  initialIndex = 0
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [pollVotes, setPollVotes] = useState<Record<string, "yes" | "no">>(() => {
    try {
      const saved = localStorage.getItem("madeater_story_poll_votes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const progressInterval = useRef<any>(null);

  const handleVotePoll = (storyId: string, choice: "yes" | "no") => {
    triggerHaptic();
    const updated = { ...pollVotes, [storyId]: choice };
    setPollVotes(updated);
    localStorage.setItem("madeater_story_poll_votes", JSON.stringify(updated));
    toast.success(choice === "yes" ? "Voted: Yes! 🤤" : "Voted: Pass 🙅‍♂️");
  };

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex]);

  // Story progress timer
  useEffect(() => {
    if (!isOpen || isPaused || stories.length === 0) return;

    const stepMs = 50;
    const increment = (stepMs / DURATION_PER_STORY_MS) * 100;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isOpen, isPaused, currentIndex, stories.length]);

  if (!isOpen || stories.length === 0 || typeof document === "undefined") return null;

  const currentStory = stories[currentIndex] || stories[0];

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const { user, dishdUser } = useAuth();

  const handleSendReaction = (emoji: string) => {
    triggerHaptic();
    const newEmoji: FloatingEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      left: 20 + Math.random() * 60 // 20% to 80% screen width
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    toast.success(`Sent ${emoji} to @${currentStory.criticUsername}`);

    if (user?.uid && currentStory.criticId) {
      const senderName = dishdUser?.displayName || user.displayName || "Food Critic";
      const senderPhoto = dishdUser?.photoURL || user.photoURL || "";
      sendDirectMessage({
        senderId: user.uid,
        senderName,
        senderPhoto,
        recipientId: currentStory.criticId,
        recipientName: currentStory.criticName,
        recipientPhoto: currentStory.criticPhoto,
        text: `Reacted ${emoji} to your story "${currentStory.dishName || currentStory.restaurantName || "Food Story"}"`
      }).catch(() => {});
    }

    // Remove emoji after animation completes
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1800);
  };

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    triggerHaptic();
    const textToSend = replyText.trim();
    setReplyText("");
    toast.success(`Replied to @${currentStory.criticUsername}: "${textToSend}"`);

    if (user?.uid && currentStory.criticId) {
      const senderName = dishdUser?.displayName || user.displayName || "Food Critic";
      const senderPhoto = dishdUser?.photoURL || user.photoURL || "";
      sendDirectMessage({
        senderId: user.uid,
        senderName,
        senderPhoto,
        recipientId: currentStory.criticId,
        recipientName: currentStory.criticName,
        recipientPhoto: currentStory.criticPhoto,
        text: `Replying to story (${currentStory.dishName || currentStory.restaurantName || "Food Story"}): "${textToSend}"`
      }).catch(() => {});
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 select-none backdrop-blur-md">
      {/* 9:16 Mobile Phone Canvas */}
      <div 
        className="relative w-full h-full md:max-w-md md:h-[90vh] md:rounded-3xl bg-black overflow-hidden shadow-2xl flex flex-col justify-between border-0 md:border md:border-white/10 animate-in zoom-in-95 duration-150"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Full-bleed Media */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.dishName || "Story media"}
            className="w-full h-full object-cover"
          />
          {/* Subtle top and bottom dark gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Tap areas: Left 35% (Prev), Right 35% (Next) */}
        <div 
          onClick={handlePrev}
          className="absolute inset-y-16 left-0 w-[35%] z-10 cursor-pointer"
        />
        <div 
          onClick={handleNext}
          className="absolute inset-y-16 right-0 w-[35%] z-10 cursor-pointer"
        />

        {/* Floating Animated Emojis Layer */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {floatingEmojis.map(item => (
            <div
              key={item.id}
              style={{ left: `${item.left}%` }}
              className="absolute bottom-20 text-4xl animate-in fade-in slide-in-from-bottom-8 duration-500 transform transition-all ease-out"
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* TOP OVERLAY: Segmented Progress Bars & Author Row */}
        <div className="relative z-30 p-3 sm:p-4 space-y-2.5">
          {/* Segmented Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((s, idx) => {
              let fillWidth = "0%";
              if (idx < currentIndex) fillWidth = "100%";
              else if (idx === currentIndex) fillWidth = `${progress}%`;

              return (
                <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    style={{ width: fillWidth }}
                    className="h-full bg-white rounded-full transition-all duration-75"
                  />
                </div>
              );
            })}
          </div>

          {/* Author Row */}
          <div className="flex items-center justify-between">
            <div 
              onClick={() => {
                triggerHaptic();
                onClose();
                navigate(`/app/profile/${currentStory.criticUsername}`);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <img
                src={currentStory.criticPhoto}
                alt={currentStory.criticName}
                className="w-9 h-9 rounded-full object-cover border border-white/40 shadow-sm"
              />
              <div>
                <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors drop-shadow-md">
                  {currentStory.criticUsername}
                </p>
                <p className="text-[10px] text-white/70 drop-shadow">
                  {currentStory.timestamp}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsMuted(!isMuted);
                }}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all cursor-pointer"
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE OVERLAY: Interactive Food Stickers Layer */}
        <div className="relative z-30 px-4 py-2 space-y-2 flex flex-col items-center pointer-events-none">
          {/* 1. Tagged Restaurant & Dish Pill */}
          {currentStory.restaurantName && (
            <div 
              onClick={() => {
                triggerHaptic();
                onClose();
                if (currentStory.restaurantId) {
                  navigate(`/restaurant/${currentStory.restaurantId}`);
                }
              }}
              className="px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 flex items-center gap-2 shadow-2xl cursor-pointer hover:bg-black/80 transition-all active:scale-95 pointer-events-auto"
            >
              <MapPin size={13} className="text-orange-400 shrink-0" />
              <span className="text-xs font-bold text-white truncate max-w-[160px]">
                {currentStory.restaurantName}
              </span>
              {currentStory.dishName && (
                <span className="text-xs text-orange-400 font-semibold truncate max-w-[120px]">
                  · {currentStory.dishName}
                </span>
              )}
              {currentStory.rating && (
                <span className="flex items-center gap-0.5 text-[11px] text-amber-400 font-bold ml-1">
                  <Star size={11} fill="currentColor" /> {currentStory.rating}
                </span>
              )}
            </div>
          )}

          {/* 2. Spice Meter Sticker */}
          {currentStory.spiceLevel && (
            <div className="p-2.5 rounded-2xl bg-black/75 backdrop-blur-xl border border-orange-500/40 text-white shadow-2xl w-full max-w-[220px] pointer-events-auto">
              <div className="flex items-center justify-between text-[11px] font-black">
                <span className="text-orange-400 flex items-center gap-1">
                  <Flame size={12} className="fill-orange-500" /> Spice Heat
                </span>
                <span>{["🌶️ Mild", "🌶️🌶️ Med", "🌶️🌶️🌶️ Hot", "🌶️🌶️🌶️🌶️ Fiery", "🌶️ Nuclear 🔥"][currentStory.spiceLevel - 1]}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div 
                  style={{ width: `${(currentStory.spiceLevel / 5) * 100}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full"
                />
              </div>
            </div>
          )}

          {/* 3. Interactive "Would You Eat This?" Poll */}
          {currentStory.poll && (
            <div className="p-3.5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/25 text-white shadow-2xl w-full max-w-[260px] space-y-2 pointer-events-auto select-none">
              <p className="text-xs font-black text-center text-white drop-shadow">
                {currentStory.poll.question || "Would you eat this?"}
              </p>
              
              {pollVotes[currentStory.id] ? (
                // Results View with live animated percentages
                <div className="space-y-1.5 pt-0.5">
                  <div className="relative h-8 rounded-xl bg-white/10 overflow-hidden flex items-center px-3 justify-between text-xs font-bold">
                    <div 
                      style={{ width: `${currentStory.poll.yesVotes ? Math.round((currentStory.poll.yesVotes / (currentStory.poll.yesVotes + currentStory.poll.noVotes + 1)) * 100) : 75}%` }}
                      className="absolute inset-y-0 left-0 bg-orange-500/50 rounded-xl transition-all duration-500"
                    />
                    <span className="relative z-10 flex items-center gap-1 text-white">
                      Yes 🤤 {pollVotes[currentStory.id] === "yes" && "✓"}
                    </span>
                    <span className="relative z-10 font-black text-orange-200">
                      {currentStory.poll.yesVotes ? Math.round((currentStory.poll.yesVotes / (currentStory.poll.yesVotes + currentStory.poll.noVotes + 1)) * 100) : 75}%
                    </span>
                  </div>

                  <div className="relative h-8 rounded-xl bg-white/10 overflow-hidden flex items-center px-3 justify-between text-xs font-bold">
                    <div 
                      style={{ width: `${currentStory.poll.noVotes ? Math.round((currentStory.poll.noVotes / (currentStory.poll.yesVotes + currentStory.poll.noVotes + 1)) * 100) : 25}%` }}
                      className="absolute inset-y-0 left-0 bg-zinc-600/50 rounded-xl transition-all duration-500"
                    />
                    <span className="relative z-10 flex items-center gap-1 text-white">
                      Pass 🙅‍♂️ {pollVotes[currentStory.id] === "no" && "✓"}
                    </span>
                    <span className="relative z-10 font-black text-zinc-300">
                      {currentStory.poll.noVotes ? Math.round((currentStory.poll.noVotes / (currentStory.poll.yesVotes + currentStory.poll.noVotes + 1)) * 100) : 25}%
                    </span>
                  </div>
                </div>
              ) : (
                // Interactive Voting Buttons
                <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => handleVotePoll(currentStory.id, "yes")}
                    className="py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black active:scale-95 transition-all shadow-lg cursor-pointer"
                  >
                    Yes 🤤
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVotePoll(currentStory.id, "no")}
                    className="py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white active:scale-95 transition-all border border-white/20 cursor-pointer"
                  >
                    Pass 🙅‍♂️
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM OVERLAY: Quick Emoji Reactions + Message Input */}
        <div className="relative z-30 p-3 sm:p-4 space-y-3">
          {/* Fast Emoji Reactions Floating Bar */}
          <div className="flex items-center justify-around bg-black/40 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/10">
            {["🔥", "🤤", "💯", "❤️", "👏", "🍕"].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendReaction(emoji)}
                className="text-xl hover:scale-125 active:scale-90 transition-transform cursor-pointer p-1"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply input */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentStory.criticUsername}...`}
              className="flex-1 bg-black/50 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/60 focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                replyText.trim() 
                  ? "bg-orange-500 text-white active:scale-90 shadow-lg" 
                  : "bg-white/10 text-white/40 pointer-events-none"
              }`}
            >
              <Send size={15} />
            </button>
          </form>
        </div>

      </div>
    </div>,
    document.body
  );
};
