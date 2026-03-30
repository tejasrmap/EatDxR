import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, MessageSquare, Loader2, User as UserIcon } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Interaction, Review } from "../types";
import { useAuth } from "../App";
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Interaction[];
      setComments(fetchedComments);
      setLoading(false);
      
      // Auto-scroll to bottom on new comments
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error("Comments error:", error);
      setLoading(false);
    });

    return () => {
        unsubscribe();
        window.dispatchEvent(new CustomEvent('MODAL_OPEN_STATE_CHANGE', { detail: { isOpen: false, type: 'COMMENT' } }));
    };
  }, [isOpen, review.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Sign in to comment");
    if (!newComment.trim()) return;

    setIsPosting(true);
    const commentId = `comment_${currentUser.uid}_${Date.now()}`;
    const commentRef = doc(db, "interactions", commentId);

    try {
      await setDoc(commentRef, {
        id: commentId,
        reviewId: review.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Critic",
        userPhoto: currentUser.photoURL || "",
        type: "COMMENT",
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });

      // Notification logic: Notify the review owner if someone else comments
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

      setNewComment("");
    } catch (error) {
      console.error("Post error:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#14181c] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] md:h-[70vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <MessageSquare size={20} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">Discussion</h2>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">@ {review.restaurantName}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
            >
              <X size={20} />
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
                <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Opening Thread...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                  <MessageSquare size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white/60">No discussions yet</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/20">Be the first to share your thoughts!</p>
                </div>
              </div>
            ) : (
              comments.map((comment) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={comment.id} 
                  className="flex gap-4 group"
                >
                  <img 
                    src={comment.userPhoto || `https://ui-avatars.com/api/?name=${comment.userName}&background=random`} 
                    className="w-8 h-8 rounded-full border border-white/10 bg-zinc-900" 
                    alt="" 
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/90">{comment.userName}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">
                        {comment.createdAt ? formatDistanceToNow(parseFirebaseDate(comment.createdAt), { addSuffix: true }) : "now"}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed font-medium">
                      {comment.content}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input Area: Increased Padding for Mobile to clear the Navigation Pill */}
          <div className="p-4 md:p-6 bg-black/40 border-t border-white/5 pb-32 md:pb-6">
            <form onSubmit={handlePostComment} className="relative group">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? "Share your culinary thoughts..." : "Sign in to join the discussion"}
                disabled={!currentUser || isPosting}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-sm font-medium focus:outline-none focus:ring-2 ring-orange-500/50 transition-all text-white placeholder:text-white/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isPosting || !currentUser}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                {isPosting ? <Loader2 size={18} className="animate-spin text-black" /> : <Send size={18} />}
              </button>
            </form>
            {currentUser && (
               <p className="text-[8px] uppercase tracking-[0.2em] font-black text-white/10 mt-3 text-center">Posting as @ {currentUser.displayName || "Critic"}</p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
