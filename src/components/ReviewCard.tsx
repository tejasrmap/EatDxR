import { Star, Heart, MessageSquare, MapPin, Send, Loader2, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Review, Interaction } from "../types";
import { formatDistanceToNow } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDocs, updateDoc, increment } from "firebase/firestore";
import { LogMealModal } from "./LogMealModal";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { dishdUser: currentUser, login } = useAuth();
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

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
      // 1. Delete all nested interaction documents (comments & likes)
      const interactionsQuery = query(collection(db, "interactions"), where("reviewId", "==", review.id));
      const interactionsSnap = await getDocs(interactionsQuery);
      const deletePromises = interactionsSnap.docs.map(docSnap => deleteDoc(doc(db, "interactions", docSnap.id)));
      await Promise.all(deletePromises);
      
      // 2. Decrement user's reviewsWritten natively
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        "stats.reviewsWritten": increment(-1)
      });
      
      // 3. Delete the review natively
      await deleteDoc(doc(db, "reviews", review.id));
      
      toast.success("Diary entry deleted successfully.");
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete the diary entry.");
    }
  };

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
      
      const fetchedComments = interactions
        .filter(i => i.type === "COMMENT")
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeA - timeB; // Ascending order (oldest first)
        });
        
      setComments(fetchedComments);
    }, (error) => {
      // Intentionally swallow "missing perm" errors on render for unauthenticated/unconfigured users 
      // so it doesn't spam the console, but the app won't crash.
    });

    return unsubscribe;
  }, [review.id]);

  const hasLiked = currentUser ? likes.some(l => l.userId === currentUser.uid) : false;
  // Dynamic additive likes (new interactions hook into old legacy number, if any)
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
      
      if(error.message.includes('Missing or insufficient permissions')) {
         toast.error("Database denied. Did you deploy the new firestore.rules?");
      } else {
         toast.error("Failed to toggle like.");
      }
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
      if(error.message.includes('Missing or insufficient permissions')) {
         toast.error("Database denied. Did you deploy the new firestore.rules?");
      } else {
         toast.error("Failed to post comment.");
      }
    } finally {
      setIsCommentLoading(false);
    }
  };

  const dishesWithImages = review.dishes?.filter(d => d.image) || [];
  const firstImage = dishesWithImages[0]?.image;

  return (
    <div className="group py-6 border-b border-white/5 last:border-0">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Poster-style image */}
        <Link 
          to={`/restaurant/${review.restaurantId}`}
          className="w-full h-48 sm:w-24 sm:h-36 bg-zinc-800 rounded-lg sm:rounded-sm overflow-hidden flex-shrink-0 border border-white/10 shadow-lg relative"
        >
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={review.dishes?.[0]?.name || "Meal"} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 uppercase tracking-widest text-center px-2">
              No Photo
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                {review.dishes?.map((dish, i) => (
                  <React.Fragment key={i}>
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                      {dish.name}
                    </h3>
                    {i < review.dishes.length - 1 && <span className="text-white/20">&</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/40">at</span>
                <Link 
                  to={`/restaurant/${review.restaurantId}`} 
                  className="text-white/60 hover:text-white transition-colors underline decoration-white/10 underline-offset-4"
                >
                  {review.restaurantName}
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-orange-500">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      fill={i < review.rating ? "currentColor" : "none"} 
                      className={i < review.rating ? "fill-orange-500" : "text-white/10"}
                    />
                  ))}
                </div>
                {currentUser?.uid === review.userId && (
                  <div className="relative" ref={optionsRef}>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setShowOptions(!showOptions);
                      }}
                      className="p-1 text-white/40 hover:text-white transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {showOptions && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-[#2c3440] border border-white/10 rounded-sm shadow-2xl py-1 z-50">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setShowOptions(false);
                            setIsEditing(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white transition-colors"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setShowOptions(false);
                            handleDelete();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                {formatDistanceToNow(parseFirebaseDate(review.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Link to={`/profile/${review.userId}`} className="flex items-center gap-1.5 group/user">
              <img 
                src={review.userPhoto} 
                alt={review.userName} 
                className="w-4 h-4 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs text-white/40 group-hover/user:text-white transition-colors">{review.userName}</span>
            </Link>
            {review.restaurantLocation && (
              <>
                <span className="text-white/10 text-[10px]">•</span>
                <div className="flex items-center gap-1 text-white/30 text-[10px] uppercase tracking-tighter">
                  <MapPin size={10} />
                  <span>{review.city || "Nearby"}</span>
                </div>
              </>
            )}
          </div>
          
          <p className="text-white/60 text-sm line-clamp-2 mb-4 leading-relaxed font-serif italic">
            "{review.content}"
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              disabled={isLikeLoading}
              className={`flex items-center gap-1.5 text-white/30 hover:text-orange-500 transition-colors group/btn ${hasLiked ? 'text-orange-500' : ''} ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart size={14} className={hasLiked ? "fill-orange-500" : "group-hover/btn:fill-orange-500"} />
              <span className="text-[10px] uppercase tracking-widest font-bold">{totalLikes}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 transition-colors ${showComments ? 'text-white' : 'text-white/30 hover:text-white'}`}
            >
              <MessageSquare size={14} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                {comments.length > 0 ? comments.length : 'Review'}
              </span>
            </button>
          </div>

          {/* Comments Section Overlay */}
          {showComments && (
            <div className="mt-4 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
              <div className="max-h-60 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-xs text-center text-white/40 italic serif">No reviews yet. Be the first to share your thoughts!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <Link to={`/profile/${comment.userId}`}>
                        <img 
                          src={comment.userPhoto} 
                          alt={comment.userName}
                          className="w-6 h-6 rounded-full border border-white/10 shrink-0 mt-0.5"
                          referrerPolicy="no-referrer"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/profile/${comment.userId}`} className="text-xs font-bold text-white hover:underline decoration-white/30">{comment.userName}</Link>
                          <span className="text-[10px] text-white/30">
                            {comment.createdAt?.toMillis ? formatDistanceToNow(comment.createdAt.toMillis(), { addSuffix: true }) : 'just now'}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed font-serif">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-white/10 bg-black/20">
                <form 
                  onSubmit={handleCommentSubmit} 
                  className="flex gap-2"
                  onClick={(e) => {
                    if (!currentUser) login();
                  }}
                >
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => {
                      if (!currentUser) login();
                    }}
                    placeholder={currentUser ? "Add a comment..." : "Log in to join the discussion..."}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 ring-orange-500/50 transition-all placeholder:text-white/20 cursor-pointer sm:cursor-text"
                    readOnly={!currentUser}
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim() || isCommentLoading}
                    className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:hover:bg-orange-50"
                  >
                    {isCommentLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogMealModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        existingReview={review} 
      />
    </div>
  );
}
