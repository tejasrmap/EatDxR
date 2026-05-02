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
      className="bg-muted/30 border border-border rounded-3xl shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:border-muted-foreground transition-all mb-12 group overflow-hidden"
    >
      {/* User Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${review.userId}`} className="flex items-center gap-3">
          <img 
            src={review.userPhoto} 
            alt="" 
            className="w-10 h-10 rounded-full border border-border shadow-sm"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground/90">{review.userName}</span>
                <div className="w-1 h-1 bg-border rounded-full" />
                <button 
                  onClick={(e) => {
                      e.preventDefault();
                      handleToggleFollow();
                  }}
                  disabled={isUpdatingFollow || currentUser?.uid === review.userId}
                  className={`text-[11px] font-medium transition-colors ${isFollowing ? 'text-muted-foreground' : 'text-foreground hover:text-foreground/80 active:scale-95'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
                {formatDistanceToNow(parseFirebaseDate(review.createdAt), { addSuffix: true })}
            </span>
          </div>
        </Link>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="relative group/carousel px-4">
        <div 
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-square md:aspect-[4/5] bg-background/50 rounded-2xl border border-border"
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
                   <div className="absolute bottom-6 left-4 right-4 text-center pointer-events-none">
                      <span className="bg-background/50 backdrop-blur-md border border-border px-4 py-1.5 rounded-full text-xs font-medium text-foreground">
                          {review.dishes[i].name}
                      </span>
                   </div>
                )}
              </div>
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/30 italic serif">
               <span className="text-6xl opacity-20">NO PHOTO</span>
               <p className="text-xs uppercase tracking-[0.3em]">Moment Witnessed</p>
            </div>
          )}
        </div>

        {/* 1/N Badge Layer */}
        {allImages.length > 1 && (
          <div className="absolute top-6 right-20 bg-background/50 backdrop-blur-md border border-border px-3 py-1 rounded-full pointer-events-none">
              <span className="text-xs font-medium text-foreground">{currentSlide + 1} / {allImages.length}</span>
          </div>
        )}
        
        {/* Restaurant Badge Layer */}
        <div className="absolute top-6 left-8 flex flex-col gap-2">
            <Link to={`/restaurant/${review.restaurantId}`} className="bg-background/40 backdrop-blur-md border border-border px-4 py-2 rounded-full inline-flex items-center gap-2 group/rest hover:bg-background/60 transition-all shadow-lg">
                <span className="text-sm font-medium text-foreground transition-colors">{review.restaurantName}</span>
            </Link>
        </div>

        {/* Global Rating Overlay */}
        <div className="absolute top-6 right-8 bg-background/50 backdrop-blur-md border border-border px-3 py-2 rounded-full shadow-lg">
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={12} 
                        fill={i < review.rating ? "currentColor" : "none"}
                        className={i < review.rating ? "text-foreground" : "text-muted-foreground"}
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
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "bg-foreground w-4" : "bg-muted-foreground"
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
             className={`flex items-center gap-2 transition-all ${hasLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
           >
             <Heart size={20} className={hasLiked ? "fill-rose-500" : ""} />
             <span className="text-xs font-medium">{totalLikes}</span>
           </button>
           <button 
             onClick={() => setIsCommentModalOpen(true)}
             className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
           >
             <MessageSquare size={20} className={comments.length > 0 ? "text-foreground/80" : ""} />
             <span className="text-xs font-medium">{comments.length}</span>
             <span className="text-[11px] font-medium tracking-wide ml-1 hidden md:inline">Discuss</span>
           </button>
        </div>

        <div className="space-y-3">
            <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-foreground shrink-0 hover:text-foreground/80 transition-colors cursor-pointer">{review.userName}</span>
                <p className="text-sm text-foreground/80 font-normal leading-relaxed max-w-xl">
                   {review.content}
                </p>
            </div>
            
            {review.dishes && review.dishes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {review.dishes.map((dish, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-muted border border-border px-4 py-1.5 rounded-full hover:bg-muted/80 transition-all">
                            <span className="text-xs font-medium text-foreground tracking-wide">
                                {dish.name}
                            </span>
                            <div className="flex items-center gap-0.5 ml-2 border-l border-border pl-2">
                                {[...Array(5)].map((_, si) => (
                                    <Star 
                                        key={si} 
                                        size={10} 
                                        fill={si < (dish.rating || 0) ? "currentColor" : "none"}
                                        className={si < (dish.rating || 0) ? "text-foreground" : "text-muted-foreground"}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-muted-foreground">
            <MapPin size={12} />
            <span className="text-[11px] font-medium tracking-wide">{review.city || review.restaurantLocation || "Nearby Spot"}</span>
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
