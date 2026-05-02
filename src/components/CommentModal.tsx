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
          className="absolute inset-0 bg-black/90"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
          className="relative w-full max-w-lg bg-[#111111] border-4 border-[#333333] rounded-none shadow-[8px_8px_0px_#ccff00] overflow-hidden flex flex-col h-[75vh] md:h-[70vh] bottom-0"
        >
          {/* Native Drag Handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50 md:hidden" />

          {/* Header: Slim & Professional */}
          <div className="px-6 pt-10 pb-4 border-b-4 border-[#333333] bg-[#000000] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none bg-[#ccff00] border-2 border-black shadow-[2px_2px_0px_#ff00ff] flex items-center justify-center text-black">
                <MessageSquare size={16} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90">The Discussion</h2>
                <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest leading-none mt-0.5">Community @ {review.restaurantName}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-[#ff00ff] rounded-none transition-colors text-white/40 hover:text-black border-2 border-transparent hover:border-black"
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
                <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Opening Thread...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-none bg-black border-4 border-[#333333] flex items-center justify-center text-[#ff00ff] shadow-[4px_4px_0px_#ccff00]">
                  <MessageSquare size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest text-white/60">No discussions yet</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/20">Be the first to share your thoughts!</p>
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
                    className="w-8 h-8 rounded-none border-2 border-white shadow-[2px_2px_0px_#ff00ff] bg-black object-cover" 
                    alt="" 
                  />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/90">{comment.userName}</span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#00ffff]">Local Guide</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">
                        {comment.createdAt ? formatDistanceToNow(parseFirebaseDate(comment.createdAt), { addSuffix: true }) : "now"}
                      </span>
                    </div>
                    <div className="bg-[#000000] border-2 border-[#333333] rounded-none p-4 md:p-5 relative transition-all shadow-[2px_2px_0px_#00ffff] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#00ffff]">
                        <p className="text-[13px] text-white/70 leading-relaxed font-bold">
                          {comment.content}
                        </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Elite Bottom Dock: Unobstructed & Centered */}
          <div className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-8 bg-[#111111] border-t-4 border-[#333333]">
            <form onSubmit={handlePostComment} className="relative group flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? "Share your thoughts..." : "Sign in to comment"}
                disabled={!currentUser || isPosting}
                className="flex-1 bg-black border-4 border-[#333333] rounded-none px-4 py-4 text-[12px] font-black uppercase tracking-widest focus:outline-none focus:border-[#00ffff] transition-all text-white placeholder:text-white/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isPosting || !currentUser}
                className="w-14 h-14 bg-[#ccff00] rounded-none flex items-center justify-center text-black border-4 border-[#333333] shadow-[4px_4px_0px_#ff00ff] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50"
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
