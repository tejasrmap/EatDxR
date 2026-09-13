import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, MessageSquare, Loader2, User as UserIcon } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Interaction, Review } from "../types";
import { useAuth } from "../App";
import { getComments, addComment } from "../services/supabaseService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
}

export const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, review }) => {
  const { dishdUser: currentUser } = useAuth();
  const [comments, setComments] = useState<Interaction[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, "interactions"),
      where("reviewId", "==", review.id),
      where("type", "==", "COMMENT"),
      orderBy("createdAt", "asc")
    );

    // Social Synchronization Events: Notify Navigation to hide when discussing
    if (isOpen) {
        window.dispatchEvent(new CustomEvent('MODAL_OPEN_STATE_CHANGE', { detail: { isOpen: true, type: 'COMMENT' } }));
    }

    // 1. Primary: Fetch comments from Supabase
    getComments(review.id).then(supaComments => {
      if (supaComments && supaComments.length > 0) {
        setComments(supaComments.map(c => ({
          id: c.id,
          reviewId: c.targetId,
          userId: c.userId,
          userName: c.userName,
          userPhoto: c.userPhoto,
          type: "COMMENT",
          content: c.text,
          createdAt: c.createdAt
        } as unknown as Interaction)));
        setLoading(false);
      } else {
        // Fallback to Firestore comments
        const q = query(
          collection(db, "interactions"),
          where("reviewId", "==", review.id),
          where("type", "==", "COMMENT"),
          orderBy("createdAt", "asc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedComments = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as Interaction[];
          setComments(fetchedComments);
          setLoading(false);
        }, () => setLoading(false));
        return () => unsubscribe();
      }
    }).catch(() => setLoading(false));

    return () => {
        window.dispatchEvent(new CustomEvent('MODAL_OPEN_STATE_CHANGE', { detail: { isOpen: false, type: 'COMMENT' } }));
    };
  }, [isOpen, review.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Sign in to comment");
    if (!newComment.trim()) return;

    setIsPosting(true);
    const commentText = newComment.trim();

    try {
      // 1. Primary: Save comment in Supabase
      const savedComment = await addComment({
        targetId: review.id,
        targetType: "review",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Critic",
        userPhoto: currentUser.photoURL,
        text: commentText
      });

      if (savedComment) {
        setComments(prev => [...prev, {
          id: savedComment.id,
          reviewId: review.id,
          userId: currentUser.uid,
          userName: currentUser.displayName || "Critic",
          userPhoto: currentUser.photoURL,
          type: "COMMENT",
          content: commentText,
          createdAt: savedComment.createdAt
        } as unknown as Interaction]);
      }

      // 2. Mirror to Firestore for legacy sync
      try {
        const commentId = `comment_${currentUser.uid}_${Date.now()}`;
        const commentRef = doc(db, "interactions", commentId);
        await setDoc(commentRef, {
          id: commentId,
          reviewId: review.id,
          userId: currentUser.uid,
          userName: currentUser.displayName || "Critic",
          userPhoto: currentUser.photoURL || "",
          type: "COMMENT",
          content: commentText,
          createdAt: serverTimestamp()
        });

        if (currentUser.uid !== review.userId) {
          const notifId = `notif_comment_${currentUser.uid}_${Date.now()}`;
          await setDoc(doc(db, "notifications", notifId), {
            id: notifId,
            recipientId: review.userId,
            actorId: currentUser.uid,
            actorName: currentUser.displayName || "Critic",
            actorPhoto: currentUser.photoURL || "",
            type: "COMMENT",
            targetId: review.id,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      } catch (fbErr) {
        console.warn("Notice mirroring comment to Firebase:", fbErr);
      }

      setNewComment("");
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Post error:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/90"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
          className="relative w-full max-w-lg bg-background border border-border rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[75vh] md:h-[70vh] bottom-0"
        >
          {/* Native Drag Handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-border rounded-full z-50 md:hidden" />

          {/* Header: Slim & Professional */}
          <div className="px-6 pt-8 pb-4 border-b border-border bg-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-foreground">
                <MessageSquare size={14} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-foreground/90">The Discussion</h2>
                <span className="text-xs text-muted-foreground font-medium mt-0.5">Community @ {review.restaurantName}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {/* Comments List */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
          >
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                <Loader2 size={32} className="animate-spin text-orange-500" />
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-foreground">Opening Thread...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                  <MessageSquare size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">No discussions yet</p>
                  <p className="text-xs font-normal text-muted-foreground/70">Be the first to share your thoughts!</p>
                </div>
              </div>
            ) : (
              comments.map((comment, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={comment.id} 
                  className="flex gap-4 group"
                >
                  <img 
                    src={comment.userPhoto || `https://ui-avatars.com/api/?name=${comment.userName}&background=random`} 
                    className="w-8 h-8 rounded-full border border-border shadow-sm object-cover" 
                    alt="" 
                  />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground/90">{comment.userName}</span>
                        <div className="w-1 h-1 bg-border rounded-full" />
                        <span className="text-[10px] font-medium text-muted-foreground">Local Guide</span>
                      </div>
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {comment.createdAt ? formatDistanceToNow(parseFirebaseDate(comment.createdAt), { addSuffix: true }) : "now"}
                      </span>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 md:p-5 relative transition-all hover:bg-muted/50">
                        <p className="text-[13px] text-foreground/80 leading-relaxed font-normal">
                          {comment.content}
                        </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Elite Bottom Dock: Unobstructed & Centered */}
          <div className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-8 bg-transparent border-t border-border">
            <form onSubmit={handlePostComment} className="relative group flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? "Share your thoughts..." : "Sign in to comment"}
                disabled={!currentUser || isPosting}
                className="flex-1 bg-muted border border-border rounded-full px-5 py-3.5 text-sm font-normal focus:outline-none focus:border-muted-foreground transition-all text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isPosting || !currentUser}
                className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center text-background shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isPosting ? <Loader2 size={16} className="animate-spin text-background" /> : <Send size={16} />}
              </button>
            </form>
            {currentUser && (
               <p className="text-[10px] font-medium text-muted-foreground mt-3 text-center">Posting as @{currentUser.displayName || "Critic"}</p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
