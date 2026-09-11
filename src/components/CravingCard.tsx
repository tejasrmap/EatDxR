import React, { useState, useEffect, useRef } from "react";
import { Star, Heart, MessageSquare, MapPin, Navigation, Volume2, VolumeX, Sparkles, Flame, ShieldCheck, Share2, Tag, Utensils, Play } from "lucide-react";
import { Review, Interaction } from "../types";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
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
    const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (snapshot) => {
      const userData = snapshot.data();
      if (userData?.stats?.followingList) {
        setIsFollowing(userData.stats.followingList.includes(review.userId));
      }
    });
    return unsubscribe;
  }, [currentUser, review.userId]);

  useEffect(() => {
    const q = query(
      collection(db, "interactions"),
      where("reviewId", "==", review.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const interactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Interaction[];
      
      setLikes(interactions.filter(i => i.type === "LIKE"));
      setComments(interactions.filter(i => i.type === "COMMENT"));
    }, (error) => {
      console.warn("Craving interactions notice:", error.message);
    });

    return unsubscribe;
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

    const likeId = `like_${currentUser.uid}_${review.id}`;
    const likeRef = doc(db, "interactions", likeId);
    
    try {
      if (hasLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          id: likeId,
          reviewId: review.id,
          userId: currentUser.uid,
          userName: currentUser.displayName || "User",
          userPhoto: currentUser.photoURL || "",
          type: "LIKE",
          createdAt: serverTimestamp()
        });
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
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserRef = doc(db, "users", review.userId);
      const notifId = `${currentUser.uid}_${review.userId}_FOLLOW`;
      
      if (isFollowing) {
        await updateDoc(currentUserRef, { "stats.followingList": arrayRemove(review.userId) });
        await updateDoc(currentUserRef, { "stats.following": increment(-1) });
        await updateDoc(targetUserRef, { "stats.followers": increment(-1) });
        await deleteDoc(doc(db, "notifications", notifId)).catch(() => {});
        toast.success(`Unfollowed ${review.userName}`);
      } else {
        await updateDoc(currentUserRef, { "stats.followingList": arrayUnion(review.userId) });
        await updateDoc(currentUserRef, { "stats.following": increment(1) });
        await updateDoc(targetUserRef, { "stats.followers": increment(1) });
        await setDoc(doc(db, "notifications", notifId), {
          id: notifId,
          recipientId: review.userId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          actorPhoto: currentUser.photoURL,
          type: "FOLLOW",
          read: false,
          createdAt: serverTimestamp()
        });
        toast.success(`Following ${review.userName}`);
      }
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
    if (now - lastTapRef.current < 320) {
      // Double tap!
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
          setIsPlaying(!isPlaying);
          lastTapRef.current = 0;
        }
      }, 330);
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

      {/* Ambient Dark Gradient Overlays */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/95 via-black/75 to-transparent pointer-events-none z-10" />

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

      {/* TOP BAR: Tag Pill & Sound Control (padded below notch & top category pills) */}
      <div className="relative z-20 pt-[calc(env(safe-area-inset-top,0px)+6.25rem)] px-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap max-w-[80%] pointer-events-auto">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-md border border-white/20 text-orange-400 shadow-lg">
            <Flame size={11} className="text-orange-500 fill-orange-500 animate-pulse" />
            {review.cravingTag || "Food Craving"}
          </span>
          {review.isVerifiedVisit && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 shadow-lg">
              <ShieldCheck size={10} className="text-emerald-400" />
              Verified Visit
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
            className="w-8 h-8 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90 shadow-lg pointer-events-auto cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}
      </div>

      {/* BOTTOM CONTENT AREA (padded safely above the floating navigation dock) */}
      <div className="relative z-20 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] px-4 space-y-2 max-w-[80%] pointer-events-auto">
          
          {/* Dish & Restaurant Capsule */}
          {(attachedDish || review.restaurantName) && (
            <div className="p-2.5 bg-black/60 backdrop-blur-xl border border-white/15 rounded-xl transition-all group/badge shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                    <Utensils size={13} className="text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    {attachedDish && (
                      <Link 
                        to={getAppUrl(`/dish/${encodeURIComponent(attachedDish)}`)}
                        onClick={() => triggerHaptic()}
                        className="text-xs font-black uppercase tracking-tight text-white hover:text-orange-400 transition-colors block truncate"
                      >
                        {attachedDish}
                      </Link>
                    )}
                    <Link
                      to={getAppUrl(`/restaurant/${review.restaurantId}`)}
                      onClick={() => triggerHaptic()}
                      className="text-[10px] font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1 truncate"
                    >
                      <MapPin size={9} className="text-orange-400 shrink-0" />
                      <span>{review.restaurantName}</span>
                      {review.city && <span className="text-white/40">• {review.city}</span>}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 bg-black/80 px-2 py-1 rounded-lg border border-white/15 shrink-0">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-black text-white">{cravingScore ? cravingScore.toFixed(1) : "9.0"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Author & Follow Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link 
                to={getAppUrl(`/profile/${review.userId}`)} 
                onClick={() => triggerHaptic()} 
                className="flex items-center gap-2 group/user active:scale-95 shrink-0"
              >
                <img 
                  src={review.userPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                  className="w-7 h-7 rounded-full border border-white/30 object-cover" 
                  alt={review.userName} 
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white group-hover/user:text-orange-400 transition-colors truncate max-w-[110px]">{review.userName}</span>
                  {review.userCriticLevel && (
                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      {review.userCriticLevel.replace("Madeater ", "")}
                    </span>
                  )}
                </div>
              </Link>

              {currentUser?.uid !== review.userId && (
                <button 
                  onClick={handleToggleFollow}
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
          </div>

          {/* Commentary */}
          {review.content && (
            <p className="text-xs font-normal text-white/85 leading-snug line-clamp-2 italic font-serif">
              "{review.content}"
            </p>
          )}
        </div>

      {/* Floating Side Action Stack (padded above bottom navigation dock) */}
      <div className="absolute right-3.5 bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] flex flex-col items-center gap-3.5 z-30 pointer-events-auto">
        {/* Like */}
        <div className="flex flex-col items-center gap-0.5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`w-10 h-10 rounded-full bg-black/75 backdrop-blur-xl border border-white/15 flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
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
            className="w-10 h-10 rounded-full bg-black/75 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
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
            className="w-10 h-10 rounded-full bg-black/75 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
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
