import React, { useState, useEffect, useRef, memo } from "react";
import { Star, Heart, MessageSquare, MapPin, MoreVertical } from "lucide-react";
import { Review, Interaction } from "../types";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CommentModal } from "./CommentModal";
import { optimizeImage } from "../lib/imageOptimization";

interface PostCardProps {
  review: Review;
}

export const PostCard: React.FC<PostCardProps> = memo(({ review }) => {
  const { dishdUser: currentUser } = useAuth();
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Extract all images from dishes for the Instagram-style carousel
  const allImages = review.dishes?.filter(d => d.image).map(d => d.image) || [];

  // Intersection Observer to only load live data when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Use global follow state from AuthContext instead of separate listener
  useEffect(() => {
    if (currentUser?.stats?.followingList) {
        setIsFollowing(currentUser.stats.followingList.includes(review.userId));
    }
  }, [currentUser?.stats?.followingList, review.userId]);
  
  // Only subscribe to interactions when the card is actually visible on screen
  useEffect(() => {
    if (!review.id || !isVisible) return;
    
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
      // Quiet fail to prevent console spam
    });

    return unsubscribe;
  }, [review.id, isVisible]);

  const hasLiked = currentUser ? likes.some(l => l.userId === currentUser.uid) : false;
  const totalLikes = (review.likes || 0) + likes.length;
  
  const firstImage = review.dishes?.find(d => d.image)?.image;

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Sign in to like this post");
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

  return (
    <motion.div 
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="bg-[#111111] border-4 border-[#333333] rounded-none shadow-[8px_8px_0px_#ccff00] mb-12 group"
    >
      {/* User Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${review.userId}`} className="flex items-center gap-3">
          <img 
            src={review.userPhoto} 
            alt="" 
            className="w-8 h-8 rounded-none border-2 border-white shadow-[2px_2px_0px_#ff00ff]"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-white/90">{review.userName}</span>
                <div className="w-0.5 h-0.5 bg-white/20 rounded-full" />
                <button 
                  onClick={(e) => {
                      e.preventDefault();
                      handleToggleFollow();
                  }}
                  disabled={isUpdatingFollow || currentUser?.uid === review.userId}
                  className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${isFollowing ? 'text-white/20' : 'text-[#00ffff] hover:text-white active:translate-y-0.5'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
            </div>
            <span className="text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {formatDistanceToNow(parseFirebaseDate(review.createdAt), { addSuffix: true })}
            </span>
          </div>
        </Link>
        <button className="text-white/20 hover:text-white transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="relative group/carousel">
        <div 
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-square md:aspect-video bg-[#000000] border-y-4 border-[#333333]"
          onScroll={(e) => {
            const target = e.currentTarget;
            const index = Math.round(target.scrollLeft / target.clientWidth);
            setCurrentSlide(index);
          }}
        >
          {allImages.length > 0 ? (
            allImages.map((img, i) => (
              <div key={i} className="min-w-full h-full snap-center relative">
                <img 
                  src={optimizeImage(img, { width: 800, quality: 75 })} 
                  alt={`${review.restaurantName} - Dish ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                
                {/* Individual Dish Name overlay on image (Subtle) */}
                {review.dishes?.[i]?.name && (
                   <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                      <span className="bg-black border-2 border-black shadow-[2px_2px_0px_#ccff00] px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest text-[#ccff00]">
                          {review.dishes[i].name}
                      </span>
                   </div>
                )}
              </div>
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 italic serif">
               <span className="text-6xl opacity-5">NO PHOTO</span>
               <p className="text-xs uppercase tracking-[0.3em]">Moment Witnessed</p>
            </div>
          )}
        </div>

        {/* 1/N Badge Layer */}
        {allImages.length > 1 && (
          <div className="absolute top-4 right-14 bg-black border-2 border-[#333333] px-2.5 py-1 rounded-none shadow-[2px_2px_0px_#ff00ff] pointer-events-none">
              <span className="text-[10px] font-black text-white">{currentSlide + 1} / {allImages.length}</span>
          </div>
        )}
        
        {/* Restaurant Badge Layer */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Link to={`/restaurant/${review.restaurantId}`} className="bg-[#ccff00] border-2 border-black shadow-[4px_4px_0px_#ff00ff] px-4 py-2 rounded-none inline-flex items-center gap-2 group/rest hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#ff00ff] transition-all">
                <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-black transition-colors">{review.restaurantName}</span>
            </Link>
        </div>

        {/* Global Rating Overlay */}
        <div className="absolute top-4 right-4 bg-[#000000] border-2 border-[#333333] shadow-[2px_2px_0px_#00ffff] p-2 rounded-none">
            <div className="flex items-center gap-0.5 text-[#00ffff]">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={10} 
                        fill={i < review.rating ? "currentColor" : "none"}
                        className={i < review.rating ? "" : "text-white/20"}
                    />
                ))}
            </div>
        </div>

        {/* Carousel Dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5 pointer-events-none pb-2">
            {allImages.map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-none transition-all duration-300 ${
                  i === currentSlide ? "bg-[#ccff00] w-3 border border-black shadow-[1px_1px_0px_#ff00ff]" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Layer */}
      <div className="p-6">
        <div className="flex items-center gap-6 mb-4">
           <button 
             onClick={handleLike}
             className={`flex items-center gap-2 transition-all ${hasLiked ? 'text-[#ff00ff]' : 'text-white/40 hover:text-[#ff00ff]'}`}
           >
             <Heart size={22} className={hasLiked ? "fill-[#ff00ff]" : ""} />
             <span className="text-xs font-black">{totalLikes}</span>
           </button>
           <button 
             onClick={() => setIsCommentModalOpen(true)}
             className="flex items-center gap-2 text-white/40 hover:text-white transition-all"
           >
             <MessageSquare size={22} className={comments.length > 0 ? "text-white/80" : ""} />
             <span className="text-xs font-black">{comments.length}</span>
             <span className="text-[10px] font-black uppercase tracking-widest ml-1 hidden md:inline">Discuss</span>
           </button>
        </div>

        <div className="space-y-2">
            <div className="flex items-baseline gap-2">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white shrink-0 hover:text-[#00ffff] transition-colors cursor-pointer">{review.userName}</span>
                <p className="text-sm md:text-base font-bold text-white/80 leading-relaxed max-w-lg">
                   {review.content}
                </p>
            </div>
            
            {review.dishes && review.dishes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {review.dishes.map((dish, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-[#000000] border-2 border-[#333333] shadow-[2px_2px_0px_#00ffff] px-3 py-1 rounded-none hover:-translate-y-0.5 hover:border-[#00ffff] transition-all">
                            <span className="text-[10px] md:text-xs uppercase font-black tracking-widest text-[#00ffff]">
                                {dish.name}
                            </span>
                            <div className="flex items-center gap-0.5 ml-1 border-l-2 border-[#333333] pl-1.5">
                                {[...Array(5)].map((_, si) => (
                                    <Star 
                                        key={si} 
                                        size={8} 
                                        fill={si < (dish.rating || 0) ? "#ccff00" : "none"}
                                        className={si < (dish.rating || 0) ? "text-[#ccff00]" : "text-white/20"}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-[#333333] flex items-center gap-2 text-[#00ffff]">
            <MapPin size={12} />
            <span className="text-[9px] uppercase font-black tracking-widest text-white/40">{review.city || review.restaurantLocation || "Nearby Spot"}</span>
        </div>
      </div>

      <CommentModal 
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        review={review}
      />
    </motion.div>
  );
});
