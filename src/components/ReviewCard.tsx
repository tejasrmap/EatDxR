import { Star, Heart, MessageSquare, MapPin, Send, Loader2, MoreVertical, Edit2, Trash2, Share2 } from "lucide-react";
import { Review, Interaction } from "../types";
import { formatDistanceToNow } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import React, { useState, useEffect, useRef, memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDocs, updateDoc, increment } from "firebase/firestore";
import { LogMealModal } from "./LogMealModal";
import { DiaryEntryModal } from "./DiaryEntryModal";
import { ShareMenu } from "./ShareMenu";
import { StarRating } from "./StarRating";
import { optimizeImage } from "../lib/imageOptimization";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = memo(({ review }) => {
  const { dishdUser: currentUser, login } = useAuth();
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailedViewOpen, setIsDetailedViewOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
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
    }, (error) => {
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
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    try {
      const likeId = `${review.id}_${currentUser.uid}_LIKE`;
      const likeRef = doc(db, "interactions", likeId);
      
      if (hasLiked) {
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
          await setDoc(doc(db, "notifications", likeId), {
            id: likeId,
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
    } catch (error: any) {
      console.error("Like error:", error);
      toast.error("Failed to toggle like.");
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      login();
      return;
    }
    if (!newComment.trim() || isCommentLoading) return;
    
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

  const dishesWithImages = review.dishes?.filter(d => d.image) || [];
  const firstImage = dishesWithImages[0]?.image;

  return (
    <div ref={cardRef} className="group p-4 sm:p-6 md:p-7 mb-4 sm:mb-6 bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/10 hover:border-white/20 rounded-3xl shadow-xl relative transition-all hover:-translate-y-0.5">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-7">
        <Link 
          to={`/restaurant/${review.restaurantId}`}
          className="w-full h-52 sm:w-44 sm:h-44 md:w-52 md:h-52 bg-zinc-900 rounded-2xl border border-white/10 relative block group/img overflow-hidden shrink-0 shadow-md"
        >
          {firstImage ? (
            <img 
              src={optimizeImage(firstImage, { width: 400, quality: 75 })} 
              alt={review.dishes?.[0]?.name || "Meal"} 
              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000 ease-out"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] font-medium text-muted-foreground">No Photo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
        </Link>
        
        <div className="flex-1 min-w-0" onClick={() => setIsDetailedViewOpen(true)}>
          <div className="flex items-start justify-between mb-2 cursor-pointer">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                {review.dishes?.map((dish, i) => (
                  <React.Fragment key={i}>
                    <h3 className="text-xl font-semibold text-foreground transition-colors truncate tracking-tight">
                      {dish.name}
                    </h3>
                    {i < review.dishes.length - 1 && <span className="text-muted-foreground font-medium text-lg mx-1">+</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground font-medium text-xs">at</span>
                <Link 
                  to={`/restaurant/${review.restaurantId}`} 
                  className="text-foreground hover:text-foreground transition-colors underline decoration-border hover:decoration-foreground underline-offset-4 font-medium text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {review.restaurantName}
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-3">
                <StarRating rating={review.rating} size={16} />
                {currentUser?.uid === review.userId && (
                  <div className="relative" ref={optionsRef}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowOptions(!showOptions);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {showOptions && (
                      <div className="absolute right-0 top-full mt-2 w-40 bg-background border border-border rounded-xl shadow-2xl py-2 z-50 backdrop-blur-xl">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowOptions(false);
                            setIsEditing(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 small-caps text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 size={12} /> Edit Entry
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowOptions(false);
                            handleDelete();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-500/10 small-caps text-rose-500/60 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="font-medium text-[10px] text-muted-foreground">
                {formatDistanceToNow(parseFirebaseDate(review.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Link 
              to={`/profile/${review.userId}`} 
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="flex items-center gap-2 group/user"
            >
              <img 
                src={optimizeImage(review.userPhoto, { width: 40 })} 
                alt={review.userName} 
                className="w-6 h-6 rounded-full border border-border shadow-sm group-hover/user:border-foreground transition-all"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <span className="text-[11px] font-medium text-muted-foreground group-hover/user:text-foreground transition-colors">{review.userName}</span>
            </Link>
            {review.city && (
              <>
                <span className="text-border text-[10px] font-medium">/</span>
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[10px]">
                  <MapPin size={10} className="text-muted-foreground" />
                  <span>{review.city}</span>
                </div>
              </>
            )}
          </div>
          
          <p className="text-foreground/80 text-sm line-clamp-3 mb-6 leading-relaxed font-normal">
            {review.content}
          </p>

          <div className="flex items-center gap-6">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={isLikeLoading}
              className={`flex items-center gap-2 text-muted-foreground hover:text-rose-500 transition-all group/btn ${hasLiked ? 'text-rose-500 scale-110' : ''} ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart size={16} className={hasLiked ? "fill-rose-500" : "group-hover/btn:fill-rose-500 transition-transform group-hover/btn:scale-110"} />
              <span className="font-medium text-[11px] text-inherit">{totalLikes}</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className={`flex items-center gap-2 transition-all ${showComments ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <MessageSquare size={16} className={showComments ? "fill-foreground" : ""} />
              <span className="font-medium text-[11px]">
                {comments.length > 0 ? comments.length : 'Review'}
              </span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsShareMenuOpen(true);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all group/share"
            >
              <Share2 size={16} className="group-hover/share:-rotate-12 transition-transform" />
              <span className="font-medium text-[11px]">Share</span>
            </button>
          </div>

          {showComments && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-muted/30 border border-border rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-80 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {comments.length === 0 ? (
                  <div className="py-4 text-center">
                     <p className="text-xs font-medium text-muted-foreground">No thoughts yet.</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group/comment">
                      <Link to={`/profile/${comment.userId}`} className="shrink-0">
                        <img 
                          src={optimizeImage(comment.userPhoto, { width: 40 })} 
                          alt={comment.userName}
                          className="w-8 h-8 rounded-full border border-border transition-all"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Link to={`/profile/${comment.userId}`} className="text-xs font-medium text-foreground hover:text-foreground/80 transition-colors">{comment.userName}</Link>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {comment.createdAt?.toMillis ? formatDistanceToNow(comment.createdAt.toMillis(), { addSuffix: true }) : 'just now'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed font-normal">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 bg-transparent border-t border-border">
                <form 
                  onSubmit={handleCommentSubmit} 
                  className="flex gap-3"
                >
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => {
                      if (!currentUser) login();
                    }}
                    placeholder={currentUser ? "Add a comment..." : "Sign in to comment..."}
                    className="flex-1 bg-muted border border-border rounded-full px-5 py-2.5 text-sm font-normal text-foreground focus:outline-none focus:border-muted-foreground transition-all placeholder:text-muted-foreground"
                    readOnly={!currentUser}
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim() || isCommentLoading}
                    className="w-10 h-10 flex items-center justify-center bg-foreground text-background rounded-full transition-all disabled:opacity-20 shadow-lg hover:scale-105"
                  >
                    {isCommentLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>

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
    </div>
  );
});
