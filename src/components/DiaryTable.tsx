import React, { useState, useRef, useEffect } from "react";
import { Review } from "../types";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { parseFirebaseDate } from "../lib/utils";
import { MapPin, Star, Heart, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "../App";
import { LogMealModal } from "./LogMealModal";
import { db } from "../firebase";
import { deleteDoc, doc, updateDoc, increment, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { DiaryEntryModal } from "./DiaryEntryModal";

interface DiaryTableProps {
  reviews: Review[];
  showUser?: boolean;
}

export const DiaryTable: React.FC<DiaryTableProps> = ({ reviews, showUser = true }) => {
  const { dishdUser: currentUser, login } = useAuth();
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [optionsVisibleId, setOptionsVisibleId] = useState<string | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setOptionsVisibleId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (review: Review) => {
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

  return (
    <div className="bg-muted/30 border border-border shadow-xl rounded-3xl overflow-hidden mb-10 mr-2 md:mr-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
              <th className="py-4 px-6">Month</th>
              <th className="py-4 px-6">Day</th>
              <th className="py-4 px-6">Location</th>
              <th className="py-4 px-6">Restaurant</th>
              <th className="py-4 px-6">Dish</th>
              {showUser && <th className="py-4 px-6">Critic</th>}
              <th className="py-4 px-6 text-center">Rating</th>
              <th className="py-4 px-6 text-center">Like</th>
              <th className="py-4 px-6"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {reviews.map((review, i) => {
              const date = parseFirebaseDate(review.createdAt);
              const month = format(date, "MMM");
              const day = format(date, "dd");
              
              return (
                <tr 
                  key={review.id} 
                  id={`review-${review.id}`}
                  onClick={() => setSelectedReview(review)}
                  className="border-b border-border hover:bg-muted transition-colors group cursor-pointer bg-transparent"
                >
                  <td className="py-4 px-6 font-medium uppercase tracking-wider text-muted-foreground text-xs">{month}</td>
                  <td className="py-4 px-6 font-semibold text-foreground text-lg">{day}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                      <MapPin size={12} className="text-muted-foreground/50" />
                      <span className="truncate max-w-[100px]">{review.city || "Nearby"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Link 
                      to={`/restaurant/${review.restaurantId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-foreground hover:text-foreground/80 focus:outline-none transition-colors line-clamp-1 text-sm"
                    >
                      {review.restaurantName}
                    </Link>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {review.dishes?.[0]?.image && (
                        <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden border border-border shadow-sm">
                          <img loading="lazy" src={review.dishes[0].image} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-foreground/80 font-medium line-clamp-1 text-sm">
                        {review.dishes?.[0]?.name}
                        {review.dishes && review.dishes.length > 1 && ` & ${review.dishes.length - 1} more`}
                      </span>
                    </div>
                  </td>
                  {showUser && (
                    <td className="py-4 px-6">
                      <Link 
                        to={`/profile/${review.userId}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 group/user"
                      >
                        <img 
                          src={review.userPhoto}
                          className="w-6 h-6 rounded-full border border-border transition-all shadow-sm group-hover/user:border-muted-foreground"
                          loading="lazy"
                        />
                        <span className="text-[11px] font-medium text-muted-foreground group-hover/user:text-foreground transition-colors truncate max-w-[120px]">
                          {review.userName}
                        </span>
                      </Link>
                    </td>
                  )}
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-0.5 text-foreground">
                      {[...Array(5)].map((_, j) => (
                        <Star 
                          key={j} 
                          size={12} 
                          fill={j < review.rating ? "currentColor" : "none"} 
                          className={j < review.rating ? "text-foreground" : "text-muted-foreground/50"} 
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) login();
                      }}
                      className="text-muted-foreground hover:text-rose-500 transition-colors group/btn inline-flex"
                    >
                      <Heart size={16} className={`group-hover/btn:fill-rose-500 ${review.likes > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {currentUser && currentUser.uid === review.userId && (
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditingReview(review);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDelete(review);
                          }}
                          className="text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {reviews.length === 0 && (
              <tr>
                <td colSpan={showUser ? 8 : 7} className="py-20 text-center border border-dashed border-border">
                  <p className="text-muted-foreground font-medium text-sm">No logs found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LogMealModal 
        isOpen={editingReview !== null}
        onClose={() => setEditingReview(null)}
        existingReview={editingReview || undefined}
      />

      <DiaryEntryModal 
        isOpen={selectedReview !== null}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
      />
    </div>
  );
};
