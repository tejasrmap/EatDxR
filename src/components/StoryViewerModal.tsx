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
  const progressInterval = useRef<any>(null);

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

  const handleSendReaction = (emoji: string) => {
    triggerHaptic();
    const newEmoji: FloatingEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      left: 20 + Math.random() * 60 // 20% to 80% screen width
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    toast.success(`Sent ${emoji} to @${currentStory.criticUsername}`);

    // Remove emoji after animation completes
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1800);
  };

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    triggerHaptic();
    toast.success(`Replied to @${currentStory.criticUsername}: "${replyText}"`);
    setReplyText("");
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

        {/* MIDDLE OVERLAY: Tagged Restaurant & Dish Pill */}
        {currentStory.restaurantName && (
          <div className="relative z-30 px-4 py-2 flex justify-center">
            <div 
              onClick={() => {
                triggerHaptic();
                onClose();
                if (currentStory.restaurantId) {
                  navigate(`/restaurant/${currentStory.restaurantId}`);
                }
              }}
              className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center gap-2 shadow-2xl cursor-pointer hover:bg-black/80 transition-all active:scale-95"
            >
              <MapPin size={13} className="text-orange-400 shrink-0" />
              <span className="text-xs font-bold text-white truncate">
                {currentStory.restaurantName}
              </span>
              {currentStory.dishName && (
                <span className="text-xs text-orange-400 font-semibold truncate">
                  · {currentStory.dishName}
                </span>
              )}
              {currentStory.rating && (
                <span className="flex items-center gap-0.5 text-[11px] text-amber-400 font-bold ml-1">
                  <Star size={11} fill="currentColor" /> {currentStory.rating}
                </span>
              )}
            </div>
          </div>
        )}

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
