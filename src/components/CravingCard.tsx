import React, { useState, useEffect, useRef } from "react";
import { Star, Heart, MessageSquare, MapPin, Navigation, Volume2, VolumeX, Sparkles, Flame, ShieldCheck, Share2, Tag, Utensils, Play, Eye, EyeOff } from "lucide-react";
import { Review, Interaction } from "../types";
import { Link } from "react-router-dom";
import { useAuth } from "../App";

import { toggleSupabaseLike, toggleSupabaseFollow, getProfile, getComments } from "../services/supabaseService";
import { toast } from "sonner";
import { CommentModal } from "./CommentModal";
import { ShareMenu } from "./ShareMenu";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";
import { motion, AnimatePresence } from "motion/react";

interface CravingCardProps {
  review: Review;
  isActive?: boolean;
}

export const CravingCard: React.FC<CravingCardProps> = ({ review, isActive = true }) => {
  const { dishdUser: currentUser } = useAuth();
  const { getAppUrl } = useAppUrl();
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.stats?.followingList) {
      setIsFollowing(currentUser.stats.followingList.includes(review.userId));
    } else {
      getProfile(currentUser.uid).then(p => {
        if (p?.stats?.followingList) {
          setIsFollowing(p.stats.followingList.includes(review.userId));
        }
      });
    }
  }, [currentUser, review.userId]);

  useEffect(() => {
    getComments(review.id).then(c => {
      setComments(c);
    });
  }, [review.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible && isActive && isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible, isActive, isPlaying]);

  const hasLiked = currentUser ? likes.some(l => l.userId === currentUser.uid) : false;
  const totalLikes = (review.likes || 0) + likes.length;
  const firstImage = review.dishes?.find(d => d.image)?.image;

  const handleLike = async () => {
    triggerHaptic();
    if (!currentUser) {
      toast.error("Sign in to like this craving");
      return;
    }

    try {
      const isNowLiked = await toggleSupabaseLike(review.id, currentUser.uid, hasLiked, {
        name: currentUser.displayName || undefined,
        photo: currentUser.photoURL || undefined
      });

      if (isNowLiked) {
        setLikes(prev => [...prev, {
          id: `like_${currentUser.uid}_${review.id}`,
          reviewId: review.id,
          userId: currentUser.uid,
          userName: currentUser.displayName || "User",
          userPhoto: currentUser.photoURL || "",
          type: "LIKE",
          createdAt: new Date()
        }]);
      } else {
        setLikes(prev => prev.filter(l => l.userId !== currentUser.uid));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleToggleFollow = async () => {
    triggerHaptic();
    if (!currentUser) return toast.error("Sign in to follow critics");
    if (currentUser.uid === review.userId) return;
    
    setIsUpdatingFollow(true);
    try {
      const newFollowStatus = await toggleSupabaseFollow(
        currentUser.uid,
        review.userId,
        isFollowing,
        {
          name: currentUser.displayName || undefined,
          photo: currentUser.photoURL || undefined
        }
      );

      setIsFollowing(newFollowStatus);
      toast.success(newFollowStatus ? `Following ${review.userName}` : `Unfollowed ${review.userName}`);
    } catch (error) {
      console.error("Error following:", error);
      toast.error("Process failed");
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const handleMediaTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      // Double tap => Instant Like!
      triggerHaptic();
      if (!hasLiked) {
        handleLike();
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          triggerHaptic();
          // Single tap toggles Clean Mode (hides/shows all overlays)
          setIsCleanMode(prev => !prev);
          lastTapRef.current = 0;
        }
      }, 290);
    }
  };

  const attachedDish = review.attachedDish || review.dishes?.[0]?.name;
  const cravingScore = review.attachedScore || review.rating;

  return (
    <div 
      ref={containerRef} 
      onClick={handleMediaTap}
      className="snap-start snap-always w-full h-[100dvh] bg-black relative flex flex-col justify-between overflow-hidden select-none cursor-pointer"
    >
      {/* Video / Background Media */}
      {review.videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={review.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
          />
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/40 z-15 pointer-events-none"
            >
              <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
                <Play size={28} className="fill-white translate-x-0.5" />
              </div>
            </div>
          )}
        </>
      ) : firstImage ? (
        <img 
          src={firstImage} 
          alt={review.restaurantName}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950" />
      )}

      {/* Ambient Soft Dark Gradient Overlays (fade out completely in Clean Mode for 100% full-color video) */}
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 via-black/25 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
        isCleanMode ? 'opacity-0' : 'opacity-100'
      }`} />
      <div className={`absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
        isCleanMode ? 'opacity-0' : 'opacity-100'
      }`} />

      {/* Double-Tap Heart Burst Animation */}
      <AnimatePresence>
        {showHeartBurst && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 1] }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <div className="p-5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-[0_0_50px_rgba(244,63,94,0.7)]">
              <Heart size={68} className="text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Mode Toast Notification */}
      <AnimatePresence>
        {isCleanMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-2xl">
              <EyeOff size={13} className="text-orange-400" />
              <span>Clean View • Tap video to restore</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR: Tag Pill & Sound Control (padded below notch, smooth fade in clean mode) */}
      <div className={`relative z-20 pt-[calc(env(safe-area-inset-top,0px)+5.5rem)] px-4 flex items-center justify-between pointer-events-none transition-all duration-300 ${
        isCleanMode ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <div className="flex items-center gap-1.5 flex-wrap max-w-[75%] pointer-events-auto">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-xl border border-white/15 text-orange-400 shadow-md">
            <Flame size={11} className="text-orange-500 fill-orange-500 animate-pulse" />
            {review.cravingTag || "Food Craving"}
          </span>
          {review.isVerifiedVisit && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-950/70 backdrop-blur-xl border border-emerald-500/30 text-emerald-400 shadow-md">
              <ShieldCheck size={10} className="text-emerald-400" />
              Verified
            </span>
          )}
        </div>

        {review.videoUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              setIsMuted(!isMuted);
            }}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90 shadow-md pointer-events-auto cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}
      </div>

      {/* BOTTOM CONTENT AREA (Streamlined compact glass layout, padded safely above dock) */}
      <div className={`relative z-20 pb-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] px-4 space-y-2 max-w-[80%] pointer-events-auto transition-all duration-300 ${
        isCleanMode ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
          
          {/* Dish & Restaurant Sleek Floating Capsule */}
          {(attachedDish || review.restaurantName) && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/15 rounded-full shadow-lg max-w-full truncate group/badge hover:border-orange-500/40 transition-all">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                <Utensils size={10} className="text-orange-400" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                {attachedDish && (
                  <Link 
                    to={getAppUrl(`/dish/${encodeURIComponent(attachedDish)}`)}
                    onClick={(e) => { e.stopPropagation(); triggerHaptic(); }}
                    className="text-xs font-black uppercase tracking-tight text-white hover:text-orange-400 transition-colors truncate max-w-[140px]"
                  >
                    {attachedDish}
                  </Link>
                )}
                {review.restaurantName && (
                  <Link
                    to={getAppUrl(`/restaurant/${review.restaurantId}`)}
                    onClick={(e) => { e.stopPropagation(); triggerHaptic(); }}
                    className="text-[11px] font-medium text-white/75 hover:text-white transition-colors truncate max-w-[120px]"
                  >
                    • {review.restaurantName}
                  </Link>
                )}
              </div>
              {cravingScore && (
                <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-white/20 text-amber-400 shrink-0">
                  <Star size={10} className="fill-amber-400" />
                  <span className="text-[11px] font-black text-white">{cravingScore.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {/* Author & Follow Row */}
          <div className="flex items-center gap-2">
            <Link 
              to={getAppUrl(`/profile/${review.userId}`)} 
              onClick={(e) => { e.stopPropagation(); triggerHaptic(); }} 
              className="flex items-center gap-2 group/user active:scale-95 shrink-0"
            >
              <img 
                src={review.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName || 'Critic')}&background=f97316&color=fff`} 
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName || 'Critic')}&background=f97316&color=fff`;
                }}
                className="w-7 h-7 rounded-full border border-white/30 object-cover" 
                alt={review.userName} 
              />
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white group-hover/user:text-orange-400 transition-colors truncate max-w-[130px] drop-shadow-md">{review.userName}</span>
                {review.userCriticLevel && (
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    {review.userCriticLevel.replace("Madeater ", "")}
                  </span>
                )}
              </div>
            </Link>

            {currentUser?.uid !== review.userId && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFollow();
                }}
                disabled={isUpdatingFollow}
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-all border shrink-0 ${
                  isFollowing 
                    ? 'border-white/20 text-white/50 hover:border-white/40' 
                    : 'border-orange-500 bg-orange-500 text-black hover:bg-orange-400 active:scale-95'
                }`}
              >
                {isFollowing ? 'Following' : '+ Follow'}
              </button>
            )}
          </div>

          {/* Commentary */}
          {review.content && (
            <p className="text-xs font-normal text-white/90 leading-snug line-clamp-2 drop-shadow-md">
              {review.content}
            </p>
          )}
        </div>

      {/* Floating Side Action Stack (padded above bottom dock) */}
      <div className={`absolute right-3.5 bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] flex flex-col items-center gap-3 z-30 pointer-events-auto transition-all duration-300 ${
        isCleanMode ? 'opacity-25 hover:opacity-100' : 'opacity-100'
      }`}>
        {/* Clean Mode Toggle */}
        <div className="flex flex-col items-center gap-0.5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              setIsCleanMode(!isCleanMode);
            }}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
              isCleanMode 
                ? 'bg-orange-500 text-black border-orange-400 shadow-lg shadow-orange-500/30' 
                : 'bg-black/65 text-white/80 border-white/15 hover:text-white'
            }`}
            title={isCleanMode ? "Exit Clean View" : "Clean View (Hide Overlays)"}
          >
            {isCleanMode ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <span className="text-[8px] font-bold text-white/60">Clean</span>
        </div>

        {/* Like */}
        <div className="flex flex-col items-center gap-0.5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`w-10 h-10 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
              hasLiked ? 'text-rose-500 shadow-lg shadow-rose-500/20' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Heart size={18} className={hasLiked ? "fill-rose-500" : ""} />
          </button>
          <span className="text-[9px] font-black text-white">{totalLikes}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-0.5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              setIsCommentModalOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
          >
            <MessageSquare size={17} />
          </button>
          <span className="text-[9px] font-black text-white">{comments.length}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-0.5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              setIsShareMenuOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
          >
            <Share2 size={17} />
          </button>
          <span className="text-[8px] font-bold text-white/50">Share</span>
        </div>
      </div>

      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        review={review}
      />

      <ShareMenu
        isOpen={isShareMenuOpen}
        onClose={() => setIsShareMenuOpen(false)}
        review={review}
      />
    </div>
  );
};
