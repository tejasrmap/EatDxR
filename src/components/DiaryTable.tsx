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

interface DiaryTableProps {
  reviews: Review[];
  showUser?: boolean;
}

export const DiaryTable: React.FC<DiaryTableProps> = ({ reviews, showUser = true }) => {
  const { dishdUser: currentUser, login } = useAuth();
  const [editingReview, setEditingReview] = useState<Review | null>(null);
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
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              <th className="py-4 px-6 font-bold">Month</th>
              <th className="py-4 px-6 font-bold">Day</th>
              <th className="py-4 px-6 font-bold">Location</th>
              <th className="py-4 px-6 font-bold">Restaurant</th>
              <th className="py-4 px-6 font-bold">Dish</th>
              {showUser && <th className="py-4 px-6 font-bold">Critic</th>}
              <th className="py-4 px-6 font-bold text-center">Rating</th>
              <th className="py-4 px-6 font-bold text-center">Like</th>
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
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${i % 2 === 0 ? 'bg-black/10' : ''}`}
                >
                  <td className="py-4 px-6 font-bold text-white/60 tracking-wider text-xs">{month}</td>
                  <td className="py-4 px-6 font-bold text-white text-lg serif italic">{day}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] uppercase tracking-widest">
                      <MapPin size={12} className="text-orange-500" />
                      <span className="truncate max-w-[100px]">{review.city || "Nearby"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Link 
                      to={`/restaurant/${review.restaurantId}`}
                      className="font-bold text-white hover:text-orange-400 focus:outline-none focus:text-orange-400 transition-colors tracking-tight line-clamp-1"
                    >
                      {review.restaurantName}
                    </Link>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {review.dishes?.[0]?.image && (
                        <div className="w-8 h-8 rounded shrink-0 overflow-hidden border border-white/10">
                          <img src={review.dishes[0].image} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-white/60 italic font-serif line-clamp-1 text-xs">
                        {review.dishes?.[0]?.name}
                        {review.dishes && review.dishes.length > 1 && ` & ${review.dishes.length - 1} more`}
                      </span>
                    </div>
                  </td>
                  {showUser && (
                    <td className="py-4 px-6">
                      <Link 
                        to={`/profile/${review.userId}`} 
                        className="flex items-center gap-2 group/user"
                      >
                        <img 
                          src={review.userPhoto}
                          className="w-6 h-6 rounded-full border border-white/10 grayscale group-hover/user:grayscale-0 transition-all"
                        />
                        <span className="text-xs font-bold text-white/40 group-hover/user:text-white transition-colors truncate max-w-[120px]">
                          {review.userName}
                        </span>
                      </Link>
                    </td>
                  )}
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-0.5 text-orange-500">
                      {[...Array(5)].map((_, j) => (
                        <Star 
                          key={j} 
                          size={12} 
                          fill={j < review.rating ? "currentColor" : "none"} 
                          className={j < review.rating ? "text-orange-500" : "text-white/10"} 
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={() => {
                        if (!currentUser) login();
                      }}
                      className="text-white/20 hover:text-orange-500 transition-colors group/btn inline-flex"
                    >
                      <Heart size={16} className={`group-hover/btn:fill-orange-500 ${review.likes > 0 ? "fill-orange-500 text-orange-500" : ""}`} />
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {currentUser && currentUser.uid === review.userId && (
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingReview(review);
                          }}
                          className="text-white/20 hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(review);
                          }}
                          className="text-white/20 hover:text-red-500 transition-colors cursor-pointer"
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
                <td colSpan={showUser ? 8 : 7} className="py-20 text-center border-dashed border-white/10">
                  <p className="text-white/40 italic serif">No logs found.</p>
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
    </div>
  );
};
