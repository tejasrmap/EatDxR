import React, { useState, useEffect } from "react";
import { User } from "../types";
import { X, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "followers" | "following";
  userId: string;
  followingListIds?: string[]; // passed for 'following' specifically to bypass missing nested query structures
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, type, userId, followingListIds }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setUsers([]);

    const resolveUsers = async () => {
      try {
        if (type === "followers") {
          // Query users where this profile's userId is in THEIR followingList
          const q = query(
            collection(db, "users"),
            where("stats.followingList", "array-contains", userId)
          );
          const snap = await getDocs(q);
          const list = snap.docs.map(doc => doc.data() as User);
          setUsers(list);
        } else if (type === "following") {
          // Resolve exact list of UIDs the profile is following
          if (!followingListIds || followingListIds.length === 0) {
            setUsers([]);
            return;
          }

          // Firestore 'in' query has a strict 30 item limit per batch
          // We chunk the array to safely fetch larger lists
          const chunks: string[][] = [];
          for (let i = 0; i < followingListIds.length; i += 30) {
            chunks.push(followingListIds.slice(i, i + 30));
          }

          let aggregatedUsers: User[] = [];
          for (const chunk of chunks) {
            const q = query(collection(db, "users"), where("uid", "in", chunk));
            const snap = await getDocs(q);
            aggregatedUsers = [...aggregatedUsers, ...snap.docs.map(doc => doc.data() as User)];
          }
          setUsers(aggregatedUsers);
        }
      } catch (error) {
        console.error("Error fetching follow list:", error);
      } finally {
        setLoading(false);
      }
    };

    resolveUsers();
  }, [isOpen, type, userId, followingListIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm bg-[#1a202c] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            {type === "followers" ? "Followers" : "Following"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm font-serif italic">
              Nobody here yet.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map(u => (
                <div key={u.uid} className="flex items-center gap-3">
                  <Link 
                    to={`/profile/${u.uid}`} 
                    onClick={onClose} // Auto-close modal when navigating away
                    className="w-10 h-10 rounded-full border-2 border-transparent hover:border-orange-500 transition-colors shrink-0 overflow-hidden"
                  >
                    <img 
                      src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}&background=random`} 
                      alt={u.displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/profile/${u.uid}`}
                      onClick={onClose}
                      className="text-sm font-bold text-white hover:text-orange-500 transition-colors truncate block"
                    >
                      {u.displayName}
                    </Link>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">
                      {u.stats?.followingList?.length || 0} Following
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
