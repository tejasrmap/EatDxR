import React, { useState, useEffect, useRef } from "react";
import { Star, Heart, MessageSquare, MapPin, Navigation, Volume2, VolumeX, Sparkles, Flame, ShieldCheck, Share2, Tag, Utensils } from "lucide-react";
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

interface CravingCardProps {
  review: Review;
  isActive?: boolean;
}

export const CravingCard: React.FC<CravingCardProps> = ({ review, isActive = true }) => {
  const { dishdUser: currentUser, login } = useAuth();
  const { getAppUrl } = useAppUrl();
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      console.warn("Craving interactions error:", error.message);
    });

    return unsubscribe;
  }, [review.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const hasLiked = currentUser ? likes.some(l => l.userId === currentUser.uid) : false;
  const totalLikes = (review.likes || 0) + likes.length;
  const firstImage = review.dishes?.find(d => d.image)?.image;

  const handleLike = async () => {
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

  const attachedDish = review.attachedDish || review.dishes?.[0]?.name;
  const cravingScore = review.attachedScore || review.rating;

  return (
    <div className="snap-child relative w-full h-[88vh] md:h-[90vh] bg-black overflow-hidden flex items-center justify-center p-2 md:p-4">
      
      {/* Media Viewport */}
      <div className="relative w-full h-full max-w-md bg-zinc-950 rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 group flex flex-col justify-between">
        
        {/* Video / Background Media */}
        {review.videoUrl ? (
          <video
            ref={videoRef}
            src={review.videoUrl}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            loop
            playsInline
            muted={isMuted}
            onClick={() => setIsMuted(!isMuted)}
          />
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
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-10" />

        {/* TOP BAR: Tag Pill & Sound Control */}
        <div className="relative z-20 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-orange-400 shadow-lg">
              <Flame size={12} className="text-orange-500 fill-orange-500 animate-pulse" />
              {review.cravingTag || "Food Craving"}
            </span>
            {review.isVerifiedVisit && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400">
                <ShieldCheck size={11} className="text-emerald-400" />
                Verified Visit
              </span>
            )}
          </div>

          {review.videoUrl && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 shadow-lg"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}
        </div>

        {/* BOTTOM CONTENT AREA */}
        <div className="relative z-20 p-6 space-y-4">
          
          {/* FOOD DATABASE ANCHOR BADGE (The Madeater Differentiator) */}
          {(attachedDish || review.restaurantName) && (
            <div className="p-3 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/15 rounded-2xl transition-all group/badge shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                    <Utensils size={16} className="text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    {attachedDish && (
                      <Link 
                        to={getAppUrl(`/dish/${review.attachedDish ? encodeURIComponent(review.attachedDish) : 'biryani'}`)}
                        onClick={() => triggerHaptic()}
                        className="text-xs font-black uppercase tracking-tight text-white group-hover/badge:text-orange-400 transition-colors block truncate active:scale-95"
                      >
                        {attachedDish}
                      </Link>
                    )}
                    <Link
                      to={getAppUrl(`/restaurant/${review.restaurantId}`)}
                      onClick={() => triggerHaptic()}
                      className="text-[11px] font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1 truncate active:scale-95"
                    >
                      <MapPin size={10} className="text-orange-400 shrink-0" />
                      <span>{review.restaurantName}</span>
                      {review.city && <span className="text-white/40">• {review.city}</span>}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/10 shrink-0">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-white">{cravingScore ? cravingScore.toFixed(1) : "9.0"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Author & Follow Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                to={getAppUrl(`/profile/${review.userId}`)} 
                onClick={() => triggerHaptic()} 
                className="flex items-center gap-2.5 group/user active:scale-95"
              >
                <img 
                  src={review.userPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                  className="w-9 h-9 rounded-full border border-white/30 object-cover" 
                  alt={review.userName} 
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white group-hover/user:text-orange-400 transition-colors">{review.userName}</span>
                    {review.userCriticLevel && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {review.userCriticLevel.replace("Madeater ", "")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {currentUser?.uid !== review.userId && (
                <button 
                  onClick={handleToggleFollow}
                  disabled={isUpdatingFollow}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all border ${
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

          {/* Content / Hot Take */}
          {review.content && (
            <p className="text-sm font-normal text-white/90 leading-snug line-clamp-2 italic font-serif">
              "{review.content}"
            </p>
          )}

          {/* Detailed Critic Attribute Meters */}
          {review.ratingsDetail && (
            <div className="flex flex-wrap gap-2 pt-1">
              {review.ratingsDetail.taste && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-white/80">
                  Taste <span className="text-orange-400 font-black">{review.ratingsDetail.taste.toFixed(1)}</span>
                </span>
              )}
              {review.ratingsDetail.spice !== undefined && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-white/80">
                  Spice <span className="text-rose-400 font-black">{review.ratingsDetail.spice.toFixed(1)}</span>
                </span>
              )}
              {review.ratingsDetail.value && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-white/80">
                  Value <span className="text-emerald-400 font-black">{review.ratingsDetail.value.toFixed(1)}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Floating Side Action Stack */}
        <div className="absolute right-4 bottom-28 flex flex-col items-center gap-5 z-30 pointer-events-auto">
          {/* Like */}
          <div className="flex flex-col items-center gap-1 group/btn">
            <button 
              onClick={handleLike}
              className={`w-11 h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center transition-all active:scale-90 ${
                hasLiked ? 'text-rose-500 shadow-lg shadow-rose-500/20' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Heart size={20} className={hasLiked ? "fill-rose-500" : ""} />
            </button>
            <span className="text-[10px] font-black text-white">{totalLikes}</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1 group/btn">
            <button 
              onClick={() => setIsCommentModalOpen(true)}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <MessageSquare size={19} />
            </button>
            <span className="text-[10px] font-black text-white">{comments.length}</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1 group/btn">
            <button 
              onClick={() => setIsShareMenuOpen(true)}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <Share2 size={19} />
            </button>
            <span className="text-[10px] font-bold text-white/50">Share</span>
          </div>

          {/* Restaurant Page Direct Jump */}
          <div className="flex flex-col items-center gap-1 group/btn">
            <Link 
              to={`/restaurant/${review.restaurantId}`}
              className="w-11 h-11 rounded-full bg-orange-500 text-black flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-90 transition-all hover:bg-orange-400"
              title="Visit Restaurant Page"
            >
              <Navigation size={18} className="fill-black" />
            </Link>
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Spot</span>
          </div>
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
