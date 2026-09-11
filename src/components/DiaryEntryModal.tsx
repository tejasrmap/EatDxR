import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Review, Interaction } from "../types";
import { X, Star, Heart, MessageSquare, Send, MapPin, Calendar, Clock, Share2, Loader2, ChevronLeft, ChevronRight, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow, format } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { ShareMenu } from "./ShareMenu";
import { StoryCardModal } from "./StoryCardModal";
import { StarRating } from "./StarRating";

interface DiaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
}

export const DiaryEntryModal: React.FC<DiaryEntryModalProps> = ({ isOpen, onClose, review }) => {
  const { user: currentUser, dishdUser, login } = useAuth();
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Lock background scroll when open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!review) return;

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
      console.error("Interactions feed error:", error);
    });

    return unsubscribe;
  }, [review?.id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!review) return null;

  const hasLiked = currentUser ? likes.some(l => l.userId === currentUser.uid) : false;
  const totalLikes = (review.likes || 0) + likes.length;
  const images = review.dishes?.filter(d => d.image).map(d => d.image) || [];
  const date = parseFirebaseDate(review.createdAt);

  const handleLike = async () => {
    if (!currentUser) { login(); return; }
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
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Failed to update like status.");
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { login(); return; }
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
    } catch (error) {
      console.error("Comment error:", error);
      toast.error("Failed to post comment.");
    } finally {
      setIsCommentLoading(false);
    }
  };

  const shareReview = () => {
    setIsShareMenuOpen(true);
  };

  if (!isOpen || !review || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-0 md:p-8 xl:p-24 overflow-hidden pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            style={{ transform: "translateZ(0)" }}
            className="fixed inset-0 bg-background/60 backdrop-blur-md will-change-transform"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full md:h-[85vh] md:max-w-5xl bg-background md:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden border border-border"
          >
            {/* Cinematic Image Stage (Left on Desktop, Top on Mobile) */}
            <div className="w-full md:w-1/2 h-[50vh] md:h-full relative overflow-hidden group">
              {images.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img 
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={images[currentImageIndex]} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                    />
                  </AnimatePresence>
                  
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-background/40 backdrop-blur-xl rounded-full border border-border text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-background/40 backdrop-blur-xl rounded-full border border-border text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 px-3 bg-background/40 backdrop-blur-xl rounded-full border border-border z-10">
                        {images.map((_, i) => (
                           <div key={i} className={`h-1 rounded-full transition-all ${i === currentImageIndex ? "w-8 bg-orange-500" : "w-1.5 bg-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4 mesh-gradient relative">
                   <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
                   <div className="w-24 h-24 rounded-full border border-border flex items-center justify-center relative z-10 glass-panel shadow-2xl">
                      <Star size={36} className="text-muted-foreground" />
                   </div>
                   <span className="text-[10px] uppercase font-black tracking-[0.5em] text-muted-foreground relative z-10">Data Unavailable</span>
                </div>
              )}
              
              {/* Mobile Native Back Header */}
              <div className="md:hidden absolute top-0 left-0 w-full p-4 md:p-6 z-[100] flex justify-between pointer-events-none">
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }} 
                  className="w-10 h-10 bg-background/60 backdrop-blur-xl border border-border rounded-full flex items-center justify-center text-foreground pointer-events-auto active:scale-95 transition-all shadow-2xl"
                 >
                   <ChevronLeft size={24} className="mr-0.5" />
                 </button>
              </div>
            </div>

            {/* Narrative Stage (Right on Desktop, Bottom on Mobile) */}
            <div className="w-full md:w-1/2 flex flex-col h-full bg-background relative">
               {/* Fixed Header Desktop */}
               <div className="hidden md:flex absolute top-6 right-6 justify-end items-center z-[100] pointer-events-none">
                  <button 
                    onClick={onClose} 
                    className="w-10 h-10 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-full transition-all border border-border text-muted-foreground hover:text-foreground pointer-events-auto active:scale-90"
                  >
                    <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto px-8 md:px-12 py-12 md:py-16 space-y-10 custom-scrollbar">
                  {/* Meta Narrative Header */}
                  <header className="space-y-6">
                     <div className="flex flex-wrap items-center gap-3">
                        <Link to={`/profile/${review.userId}`} onClick={onClose} className="flex items-center gap-2 group/user p-1 px-2.5 bg-muted/30 border border-border rounded-full hover:bg-muted transition-all">
                           <img loading="lazy" src={review.userPhoto} className="w-5 h-5 rounded-full border border-border transition-all" referrerPolicy="no-referrer" />
                           <span className="text-[10px] font-black text-muted-foreground group-hover/user:text-foreground uppercase tracking-widest">{review.userName}</span>
                        </Link>
                        <span className="text-muted-foreground/30 text-[8px] uppercase font-black">•</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                           <Calendar size={12} className="text-muted-foreground" />
                           {format(date, "MMMM dd, yyyy")}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-tight">{review.restaurantName}</h1>
                        <Link 
                           to={`/restaurant/${review.restaurantId}`} 
                           onClick={onClose}
                           className="inline-flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-orange-500/60 hover:text-orange-500 transition-colors"
                        >
                           <MapPin size={14} />
                           {review.city || "Nearby"} • View Stage Details
                        </Link>
                     </div>

                     <div className="flex items-center gap-8 py-4 border-y border-border">
                        <div className="space-y-1">
                           <span className="text-[8px] uppercase font-black tracking-[0.3em] text-muted-foreground block">The Verdict</span>
                            <StarRating rating={review.rating} size={24} />
                        </div>
                        <div className="space-y-1 border-l border-border pl-8">
                           <span className="text-[8px] uppercase font-black tracking-[0.3em] text-muted-foreground block">Curation Type</span>
                           <span className="text-xs font-bold text-foreground uppercase tracking-widest italic font-serif">
                              {review.videoUrl ? "Reel Narrative" : "Culinary Post"}
                           </span>
                        </div>
                     </div>
                  </header>

                  {/* The Narrative Body */}
                  <article className="space-y-8">
                     {review.content && (
                        <div className="relative">
                           <div className="absolute -left-6 top-0 text-6xl text-muted-foreground/10 serif italic select-none">“</div>
                           <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-serif italic first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-foreground first-letter:italic">
                              {review.content}
                           </p>
                        </div>
                     )}

                     {/* Highlighted Elements (Dishes) */}
                     <div className="space-y-4 pt-4">
                        <h3 className="text-[10px] uppercase font-black tracking-[0.4em] text-muted-foreground border-b border-border pb-2">The Cast</h3>
                        <div className="grid grid-cols-1 gap-2.5">
                           {review.dishes?.map((dish, i) => (
                              <div key={i} className="flex items-center justify-between p-3.5 bg-muted/30 border border-border rounded-2xl group hover:bg-muted transition-all">
                                 <div className="flex items-center gap-4">
                                    {dish.image && (
                                       <img src={dish.image} className="w-10 h-10 rounded-lg object-cover opacity-50 group-hover:opacity-100 transition-all" />
                                    )}
                                    <div className="flex flex-col">
                                       <span className="text-xs font-bold text-foreground tracking-tight">{dish.name}</span>
                                       <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Featured Highlight</span>
                                    </div>
                                 </div>
                                  <StarRating rating={dish.rating || 5} size={14} className="flex gap-0.5 text-orange-500/40 group-hover:text-orange-500 transition-colors" activeColor="text-current" />
                              </div>
                           ))}
                        </div>
                     </div>
                  </article>

                  {/* Reactions */}
                  <footer className="space-y-8 pt-10 border-t border-border">
                     <div className="flex items-center gap-4 py-1">
                        <button 
                           onClick={handleLike}
                           disabled={isLikeLoading}
                           className={`h-12 px-8 flex items-center gap-3 rounded-full transition-all border ${hasLiked ? "bg-rose-500 border-rose-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.3)]" : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"}`}
                        >
                           <Heart size={18} fill={hasLiked ? "currentColor" : "none"} className={hasLiked ? "animate-pulse text-white" : ""} />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">{totalLikes} Hearts</span>
                        </button>
                        <button 
                           onClick={() => setIsStoryModalOpen(true)}
                           className="h-12 px-5 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-orange-400 font-black text-[11px] uppercase tracking-wider hover:from-orange-500/20 hover:to-amber-500/20 transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                           <Sparkles size={16} />
                           <span>Story Card</span>
                        </button>
                        <button 
                           onClick={shareReview}
                           className="w-12 h-12 flex items-center justify-center bg-muted border border-border rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all active:scale-90 cursor-pointer"
                        >
                           <Share2 size={18} />
                        </button>
                     </div>

                     {/* Exchange (Comments) */}
                     <div className="space-y-6">
                        <h3 className="text-[9px] uppercase font-black tracking-[0.4em] text-muted-foreground">Exchange • {comments.length}</h3>
                        
                        <div className="space-y-6">
                           {comments.map((comment) => (
                              <div key={comment.id} className="flex gap-4 group/comm">
                                 <Link to={`/profile/${comment.userId}`} onClick={onClose}>
                                    <img src={comment.userPhoto} className="w-8 h-8 rounded-full border border-border transition-all shrink-0 mt-1" referrerPolicy="no-referrer" />
                                 </Link>
                                 <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                       <Link to={`/profile/${comment.userId}`} onClick={onClose} className="text-[10px] font-black text-foreground hover:text-orange-500 uppercase tracking-widest">{comment.userName}</Link>
                                       <span className="text-[9px] font-medium text-muted-foreground">
                                          {comment.createdAt?.toMillis ? formatDistanceToNow(comment.createdAt.toMillis()) : "Moment ago"}
                                       </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed font-serif">{comment.content}</p>
                                 </div>
                              </div>
                           ))}
                        </div>

                        <div className="pt-8">
                           <form onSubmit={handleCommentSubmit} className="relative group">
                              <input 
                                 value={newComment}
                                 onChange={(e) => setNewComment(e.target.value)}
                                 onFocus={() => !currentUser && login()}
                                 placeholder={currentUser ? "Add your perspective..." : "Login to participate..."}
                                 className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-xs font-medium focus:outline-none focus:ring-1 ring-border transition-all pr-16 placeholder:text-muted-foreground text-foreground"
                                 disabled={isCommentLoading}
                              />
                              <button 
                                 type="submit" 
                                 disabled={!newComment.trim() || isCommentLoading}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-foreground text-background rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-90"
                              >
                                 {isCommentLoading ? <Loader2 size={16} className="animate-spin text-background" /> : <Send size={16} />}
                              </button>
                           </form>
                        </div>
                        
                        {/* Conclusion CTA */}
                        <div className="pt-12 pb-8">
                           <button 
                             onClick={onClose}
                             className="w-full flex items-center justify-center gap-2 p-4 bg-muted border border-border rounded-2xl hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground group"
                           >
                              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                              <span className="text-[10px] uppercase font-black tracking-widest">Go Back</span>
                           </button>
                        </div>
                     </div>
                  </footer>
               </div>
            </div>
          </motion.div>

          <ShareMenu 
            isOpen={isShareMenuOpen} 
            onClose={() => setIsShareMenuOpen(false)} 
            review={review} 
          />

          {isStoryModalOpen && (
            <StoryCardModal
              isOpen={isStoryModalOpen}
              onClose={() => setIsStoryModalOpen(false)}
              review={review}
            />
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
