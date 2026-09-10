import React, { useState, useEffect, useRef } from "react";
import { Review, Interaction } from "../types";
import { Link } from "react-router-dom";
import { 
  Heart, 
  MessageSquare, 
  Star, 
  Share2, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Send, 
  Loader2, 
  Sparkles,
  MapPin
} from "lucide-react";
import { useAuth } from "../App";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  setDoc, 
  serverTimestamp, 
  updateDoc, 
  increment,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "sonner";
import { StarRating } from "./StarRating";
import { LogMealModal } from "./LogMealModal";
import { ShareMenu } from "./ShareMenu";
import { DiaryEntryModal } from "./DiaryEntryModal";
import { StoryCardModal } from "./StoryCardModal";
import { useAppUrl } from "../hooks/useAppUrl";
import { triggerHaptic } from "../services/nativeService";
import { formatDistanceToNow } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { optimizeImage } from "../lib/imageOptimization";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = React.memo(({ review }) => {
  const { user: currentUser, login } = useAuth();
  const { getAppUrl } = useAppUrl();
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isDetailedViewOpen, setIsDetailedViewOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!currentUser || currentUser.uid !== review.userId) return;
    if (!window.confirm("Are you sure you want to delete this diary entry? This action cannot be undone.")) return;
    
    try {
      const interactionsQuery = query(collection(db, "interactions"), where("reviewId", "==", review.id));
      const interactionsSnap = await getDocs(interactionsQuery);
      const deletePromises = interactionsSnap.docs.map(docSnap => deleteDoc(doc(db, "interactions", docSnap.id)));
      await Promise.all(deletePromises);
      
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        "stats.reviewsWritten": increment(-1)
      });
      
      await deleteDoc(doc(db, "reviews", review.id));
      
      toast.success("Diary entry deleted successfully.");
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete the diary entry.");
    }
  };

  useEffect(() => {
    if (!isVisible) return;
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
      
      const fetchedComments = interactions
        .filter(i => i.type === "COMMENT")
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeA - timeB; 
        });
        
      setComments(fetchedComments);
    }, () => {
      // Ignore
    });

    return unsubscribe;
  }, [review.id, isVisible]);

  const hasLiked = currentUser ? likes.some(l => l.userId === currentUser.uid) : false;
  const totalLikes = (review.likes || 0) + likes.length;

  const handleLike = async () => {
    if (!currentUser) {
      login();
      return;
    }
    triggerHaptic();

    const likeId = `${review.id}_${currentUser.uid}_LIKE`;
    const willLike = !hasLiked;

    // Instant optimistic update
    if (willLike) {
      setLikes(prev => [
        ...prev,
        {
          id: likeId,
          reviewId: review.id,
          userId: currentUser.uid,
          userName: currentUser.displayName || "User",
          userPhoto: currentUser.photoURL || "",
          type: "LIKE",
          createdAt: new Date()
        }
      ]);
    } else {
      setLikes(prev => prev.filter(l => l.userId !== currentUser.uid));
    }

    try {
      const likeRef = doc(db, "interactions", likeId);
      if (!willLike) {
        await deleteDoc(likeRef);
        if (currentUser.uid !== review.userId) {
          await deleteDoc(doc(db, "notifications", likeId)).catch(() => {});
        }
      } else {
        await setDoc(likeRef, {
          id: likeId,
          reviewId: review.id,
          userId: currentUser.uid,
          userName: currentUser.displayName,
          userPhoto: currentUser.photoURL,
          type: "LIKE",
          createdAt: serverTimestamp()
        });

        if (currentUser.uid !== review.userId) {
          const notifRef = doc(collection(db, "notifications"));
          await setDoc(notifRef, {
            id: notifRef.id,
            recipientId: review.userId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName,
            actorPhoto: currentUser.photoURL,
            type: "LIKE",
            targetId: review.id,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      login();
      return;
    }
    if (!newComment.trim()) return;

    setIsCommentLoading(true);
    try {
      const commentRef = doc(collection(db, "interactions"));
      await setDoc(commentRef, {
        id: commentRef.id,
        reviewId: review.id,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL,
        type: "COMMENT",
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });

      if (currentUser.uid !== review.userId) {
        const notifRef = doc(collection(db, "notifications"));
        await setDoc(notifRef, {
          id: notifRef.id,
          recipientId: review.userId,
          actorId: currentUser.uid,
          actorName: currentUser.displayName,
          actorPhoto: currentUser.photoURL,
          type: "COMMENT",
          targetId: review.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      setNewComment("");
      toast.success("Comment posted!");
    } catch (error: any) {
      console.error("Comment error:", error);
      toast.error("Failed to post comment.");
    } finally {
      setIsCommentLoading(false);
    }
  };

  const dishesWithImages = review.dishes?.filter(d => d && d.image) || [];
  const firstImage = dishesWithImages[0]?.image;
  const primaryDishName = review.dishes?.[0]?.name || review.attachedDish || "Special Dish";

  return (
    <div ref={cardRef} className="group p-4 sm:p-5 mb-4 bg-zinc-950/60 hover:bg-zinc-950/90 border border-white/10 hover:border-white/15 rounded-3xl shadow-xl relative transition-all active:scale-[0.99] touch-manipulation">
      
      {/* 1. TOP AUTHOR & META ROW */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Link 
          to={getAppUrl(`/profile/${review.userId}`)} 
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2.5 min-w-0 group/author"
        >
          <img 
            src={optimizeImage(review.userPhoto, { width: 44 })} 
            alt={review.userName} 
            className="w-8 h-8 rounded-full border border-white/15 object-cover shrink-0 group-hover/author:border-orange-500 transition-colors"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <span className="text-xs font-bold text-white group-hover/author:text-orange-400 transition-colors block truncate leading-tight">
              {review.userName}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-white/50 leading-tight">
              <MapPin size={9} className="text-orange-500/80 shrink-0" />
              <span className="truncate">{review.city || "Bangalore"}</span>
            </div>
          </div>
        </Link>

        {/* Stars & Time */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end">
            <StarRating rating={review.rating} size={13} />
            <span className="text-[9px] text-white/40 font-mono mt-0.5">
              {formatDistanceToNow(parseFirebaseDate(review.createdAt), { addSuffix: true })}
            </span>
          </div>

          {currentUser?.uid === review.userId && (
            <div className="relative" ref={optionsRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(!showOptions);
                }}
                className="p-1 text-white/50 hover:text-white transition-colors"
              >
                <MoreVertical size={15} />
              </button>
              {showOptions && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptions(false);
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5 transition-colors"
                  >
                    <Edit2 size={12} /> Edit Entry
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptions(false);
                      handleDelete();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. HERO DISH PHOTO (Clean Aspect Ratio) */}
      {firstImage && (
        <div 
          onClick={() => setIsDetailedViewOpen(true)}
          className="w-full aspect-[16/10] sm:aspect-[16/9] max-h-72 bg-zinc-900 rounded-2xl border border-white/10 relative overflow-hidden block group/img shadow-md mb-3 cursor-pointer"
        >
          <img 
            src={optimizeImage(firstImage, { width: 600, quality: 80 })} 
            alt={primaryDishName} 
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
        </div>
      )}

      {/* 3. DISH & RESTAURANT HEADLINE */}
      <div className="cursor-pointer mb-2" onClick={() => setIsDetailedViewOpen(true)}>
        <h3 className="text-base sm:text-lg font-black text-white hover:text-orange-400 transition-colors tracking-tight line-clamp-1">
          {primaryDishName}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-white/60 mt-0.5">
          <span>at</span>
          <Link 
            to={getAppUrl(`/restaurant/${review.restaurantId}`)} 
            className="text-white hover:text-orange-400 font-bold transition-colors underline decoration-white/20 hover:decoration-orange-400 underline-offset-4 line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            {review.restaurantName}
          </Link>
        </div>
      </div>

      {/* 4. REVIEW QUOTE */}
      {review.content && (
        <p 
          onClick={() => setIsDetailedViewOpen(true)}
          className="text-white/70 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-3 cursor-pointer font-normal"
        >
          {review.content}
        </p>
      )}

      {/* 5. DECLUTTERED ACTION BAR */}
      <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs">
        
        {/* Left Actions: Like & Comment */}
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`flex items-center gap-1.5 transition-all cursor-pointer ${
              hasLiked ? 'text-rose-500 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Heart size={15} className={hasLiked ? "fill-rose-500" : ""} />
            <span className="text-[11px] font-bold">{totalLikes}</span>
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className={`flex items-center gap-1.5 transition-all cursor-pointer ${
              showComments ? 'text-white font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare size={15} className={showComments ? "fill-white" : ""} />
            <span className="text-[11px] font-bold">
              {comments.length > 0 ? comments.length : 'Review'}
            </span>
          </button>
        </div>

        {/* Right Actions: Story Card + Share */}
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsStoryModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 via-rose-500/15 to-amber-500/15 hover:from-orange-500/25 hover:to-amber-500/25 border border-orange-500/35 text-orange-400 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
            title="Open 9:16 Instagram Story Card"
          >
            <Sparkles size={11} className="text-orange-400" />
            <span>Story</span>
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsShareMenuOpen(true);
            }}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Share review"
          >
            <Share2 size={15} />
          </button>
        </div>

      </div>

      {/* Comments Drawer */}
      {showComments && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-zinc-900/60 border border-white/10 rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-72 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {comments.length === 0 ? (
              <div className="py-3 text-center">
                 <p className="text-xs text-white/50">No thoughts yet. Be the first to chime in!</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Link to={getAppUrl(`/profile/${comment.userId}`)} className="shrink-0">
                    <img 
                      src={optimizeImage(comment.userPhoto, { width: 32 })} 
                      alt={comment.userName} 
                      className="w-6 h-6 rounded-full border border-white/10 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className="flex-1 bg-white/5 rounded-2xl p-2.5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <Link 
                        to={getAppUrl(`/profile/${comment.userId}`)}
                        className="text-[11px] font-bold text-white hover:text-orange-400 transition-colors"
                      >
                        {comment.userName}
                      </Link>
                      <span className="text-[9px] text-white/40 font-mono">
                        {comment.createdAt?.toMillis ? formatDistanceToNow(comment.createdAt.toMillis(), { addSuffix: true }) : 'just now'}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed font-normal">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 bg-zinc-950 border-t border-white/10">
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a thought..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-white/30"
              />
              <button 
                type="submit" 
                disabled={isCommentLoading || !newComment.trim()}
                className="w-8 h-8 flex items-center justify-center bg-orange-500 text-black rounded-full transition-all disabled:opacity-30 hover:scale-105 shrink-0"
              >
                {isCommentLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* Associated Modals */}
      <LogMealModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        existingReview={review} 
      />

      <DiaryEntryModal 
        isOpen={isDetailedViewOpen} 
        onClose={() => setIsDetailedViewOpen(false)} 
        review={review} 
      />

      {isShareMenuOpen && (
        <ShareMenu 
          isOpen={isShareMenuOpen} 
          onClose={() => setIsShareMenuOpen(false)} 
          review={review} 
        />
      )}

      {isStoryModalOpen && (
        <StoryCardModal
          isOpen={isStoryModalOpen}
          onClose={() => setIsStoryModalOpen(false)}
          review={review}
        />
      )}
    </div>
  );
});
