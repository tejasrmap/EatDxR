import React, { useState, useEffect, useRef } from "react";
import { Review, Interaction } from "../types";
import { X, Star, Heart, MessageSquare, Send, MapPin, Calendar, Clock, Share2, Loader2, ChevronLeft, ChevronRight, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow, format } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment, getDocs } from "firebase/firestore";
import { toast } from "sonner";

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
    const url = `${window.location.origin}/restaurant/${review.restaurantId}`;
    navigator.clipboard.writeText(url);
    toast.success("Review link copied!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-8 xl:p-24 overflow-hidden">
          {/* Backdrop Blur Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative w-full h-full md:h-auto md:max-h-[95vh] md:max-w-6xl bg-[#0a0a0a] md:rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden border border-white/10"
          >
            {/* Cinematic Image Stage (Left on Desktop, Top on Mobile) */}
            <div className="w-full md:w-1/2 h-[50vh] md:h-full bg-zinc-900/50 relative overflow-hidden group">
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
                    />
                  </AnimatePresence>
                  
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 px-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 z-10">
                        {images.map((_, i) => (
                           <div key={i} className={`h-1 rounded-full transition-all ${i === currentImageIndex ? "w-8 bg-orange-500" : "w-1.5 bg-white/10"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-4">
                   <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center">
                      <Star size={32} />
                   </div>
                   <span className="text-[10px] uppercase font-black tracking-[0.4em] text-white/20">The Film Is Missing</span>
                </div>
              )}
              
              {/* Close Button Mobile Hook */}
              <button onClick={onClose} className="md:hidden absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/60 z-[100]">
                <X size={20} />
              </button>
            </div>

            {/* Narrative Stage (Right on Desktop, Bottom on Mobile) */}
            <div className="w-full md:w-1/2 flex flex-col h-full bg-[#0a0a0a] relative">
               {/* Fixed Close Button Desktop */}
               <button onClick={onClose} className="hidden md:flex absolute top-8 right-8 w-12 h-12 items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-white/40 hover:text-white z-[100] active:scale-90">
                 <X size={24} />
               </button>

               <div className="flex-1 overflow-y-auto px-8 md:px-12 py-12 md:py-16 space-y-10 custom-scrollbar">
                  {/* Meta Narrative Header */}
                  <header className="space-y-6">
                     <div className="flex flex-wrap items-center gap-3">
                        <Link to={`/profile/${review.userId}`} onClick={onClose} className="flex items-center gap-2 group/user p-1 px-2.5 bg-white/[0.03] border border-white/5 rounded-full hover:bg-white/[0.08] transition-all">
                           <img src={review.userPhoto} className="w-5 h-5 rounded-full border border-white/10 grayscale group-hover/user:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                           <span className="text-[10px] font-black text-white/40 group-hover/user:text-white uppercase tracking-widest">{review.userName}</span>
                        </Link>
                        <span className="text-white/10 text-[8px] uppercase font-black">•</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                           <Calendar size={12} className="text-white/10" />
                           {format(date, "MMMM dd, yyyy")}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">{review.restaurantName}</h1>
                        <Link 
                           to={`/restaurant/${review.restaurantId}`} 
                           onClick={onClose}
                           className="inline-flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-orange-500/60 hover:text-orange-500 transition-colors"
                        >
                           <MapPin size={14} />
                           {review.city || "Nearby"} • View Stage Details
                        </Link>
                     </div>

                     <div className="flex items-center gap-8 py-4 border-y border-white/5">
                        <div className="space-y-1">
                           <span className="text-[8px] uppercase font-black tracking-[0.3em] text-white/20 block">The Verdict</span>
                           <div className="flex gap-1 text-orange-500">
                              {[...Array(5)].map((_, i) => (
                                 <Star key={i} size={18} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "fill-orange-500" : "text-white/10"} />
                              ))}
                           </div>
                        </div>
                        <div className="space-y-1 border-l border-white/5 pl-8">
                           <span className="text-[8px] uppercase font-black tracking-[0.3em] text-white/20 block">Curation Type</span>
                           <span className="text-xs font-bold text-white uppercase tracking-widest italic font-serif">
                              {review.videoUrl ? "Reel Narrative" : "Culinary Post"}
                           </span>
                        </div>
                     </div>
                  </header>

                  {/* The Narrative Body */}
                  <article className="space-y-8">
                     {review.content && (
                        <div className="relative">
                           <div className="absolute -left-6 top-0 text-6xl text-white/[0.02] serif italic select-none">“</div>
                           <p className="text-lg md:text-xl text-white/80 leading-relaxed font-serif italic first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-white first-letter:italic">
                              {review.content}
                           </p>
                        </div>
                     )}

                     {/* Highlighted Elements (Dishes) */}
                     <div className="space-y-4 pt-4">
                        <h3 className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 border-b border-white/5 pb-2">The Cast</h3>
                        <div className="grid grid-cols-1 gap-2.5">
                           {review.dishes?.map((dish, i) => (
                              <div key={i} className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                                 <div className="flex items-center gap-4">
                                    {dish.image && (
                                       <img src={dish.image} className="w-10 h-10 rounded-lg object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                    )}
                                    <div className="flex flex-col">
                                       <span className="text-xs font-bold text-white tracking-tight">{dish.name}</span>
                                       <span className="text-[9px] uppercase tracking-widest text-white/30 font-black">Featured Highlight</span>
                                    </div>
                                 </div>
                                 <div className="flex gap-0.5 text-orange-500/40 group-hover:text-orange-500 transition-colors">
                                    {[...Array(dish.rating || 5)].map((_, j) => (
                                       <Star key={j} size={10} fill="currentColor" />
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </article>

                  {/* Reactions */}
                  <footer className="space-y-8 pt-10 border-t border-white/5">
                     <div className="flex items-center gap-4 py-1">
                        <button 
                           onClick={handleLike}
                           disabled={isLikeLoading}
                           className={`h-12 px-8 flex items-center gap-3 rounded-full transition-all border ${hasLiked ? "bg-rose-500 border-rose-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.3)]" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"}`}
                        >
                           <Heart size={18} fill={hasLiked ? "currentColor" : "none"} className={hasLiked ? "animate-pulse" : ""} />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">{totalLikes} Hearts</span>
                        </button>
                        <button 
                           onClick={shareReview}
                           className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        >
                           <Share2 size={18} />
                        </button>
                     </div>

                     {/* Exchange (Comments) */}
                     <div className="space-y-6">
                        <h3 className="text-[9px] uppercase font-black tracking-[0.4em] text-white/30">Exchange • {comments.length}</h3>
                        
                        <div className="space-y-6">
                           {comments.map((comment) => (
                              <div key={comment.id} className="flex gap-4 group/comm">
                                 <Link to={`/profile/${comment.userId}`} onClick={onClose}>
                                    <img src={comment.userPhoto} className="w-8 h-8 rounded-full border border-white/10 grayscale group-hover/comm:grayscale-0 transition-all shrink-0 mt-1" referrerPolicy="no-referrer" />
                                 </Link>
                                 <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                       <Link to={`/profile/${comment.userId}`} onClick={onClose} className="text-[10px] font-black text-white hover:text-orange-500 uppercase tracking-widest">{comment.userName}</Link>
                                       <span className="text-[9px] font-medium text-white/10">
                                          {comment.createdAt?.toMillis ? formatDistanceToNow(comment.createdAt.toMillis()) : "Moment ago"}
                                       </span>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed font-serif">{comment.content}</p>
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
                                 className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-xs font-medium focus:outline-none focus:ring-1 ring-white/10 transition-all pr-16 placeholder:text-white/10"
                                 disabled={isCommentLoading}
                              />
                              <button 
                                 type="submit" 
                                 disabled={!newComment.trim() || isCommentLoading}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-90"
                              >
                                 {isCommentLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                              </button>
                           </form>
                        </div>
                     </div>
                  </footer>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
