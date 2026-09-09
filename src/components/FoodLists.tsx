import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, onSnapshot, orderBy, limit, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FoodList } from "../types";
import { MOCK_LISTS } from "../data/mockData";
import { ListOrdered, Heart, Plus, Search, Sparkles, CheckCircle2, Bookmark, Share2, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../App";
import { toast } from "sonner";

export function FoodLists() {
  const { user, dishdUser, login } = useAuth();
  const [lists, setLists] = useState<FoodList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New list form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCover, setNewCover] = useState("");
  const [isRanked, setIsRanked] = useState(true);
  const [itemInput, setItemInput] = useState("");
  const [listItems, setListItems] = useState<{ id: string; name: string; type: "restaurant" | "dish"; note?: string }[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "lists"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as FoodList[];

      const existingIds = new Set(fetched.map(l => l.id));
      const combined = [...fetched, ...MOCK_LISTS.filter(m => !existingIds.has(m.id))];
      setLists(combined);
      setLoading(false);
    }, (err) => {
      setLists(MOCK_LISTS);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const tags = ["All", "Biryani", "Under ₹500", "Date Night", "Coffee", "Street Food", "Hyderabad"];

  const filteredLists = lists.filter(list => {
    if (selectedTag === "All") return true;
    return list.tags?.includes(selectedTag) || list.title.toLowerCase().includes(selectedTag.toLowerCase());
  });

  const handleAddItem = () => {
    if (!itemInput.trim()) return;
    setListItems(prev => [...prev, {
      id: `item_${Date.now()}`,
      name: itemInput.trim(),
      type: "restaurant"
    }]);
    setItemInput("");
  };

  const handleCreateList = async () => {
    if (!user) {
      login();
      return;
    }
    if (!newTitle.trim()) {
      toast.error("Please provide a title for your list.");
      return;
    }

    try {
      const listRef = doc(collection(db, "lists"));
      const newList: FoodList = {
        id: listRef.id,
        userId: user.uid,
        userName: dishdUser?.displayName || user.displayName || "Critic",
        userPhoto: dishdUser?.photoURL || user.photoURL || "",
        title: newTitle.trim(),
        description: newDesc.trim(),
        coverImage: newCover.trim() || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        isRanked,
        isPublic: true,
        items: listItems.length > 0 ? listItems : [
          { id: "1", name: "Featured Experience", type: "restaurant", note: "Top recommendation" }
        ],
        likes: 1,
        tags: ["Community", "Curated"],
        createdAt: serverTimestamp()
      };

      await setDoc(listRef, newList);
      toast.success("Curated list published!");
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewDesc("");
      setListItems([]);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create list.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-36 px-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">
          <ListOrdered size={14} />
          <span>Community Curation</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
          Food Lists
        </h1>
        <p className="text-white/50 text-sm md:text-base font-serif italic max-w-xl">
          Like Letterboxd's canonical lists, but for food. Explore ranked local guides, budget roundups, and secret culinary circuits.
        </p>

        {/* Action button */}
        <button
          onClick={() => (user ? setIsCreateModalOpen(true) : login())}
          className="mt-6 flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-black uppercase tracking-wider text-xs hover:bg-orange-400 transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          <Plus size={16} />
          <span>Curate a List</span>
        </button>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedTag === tag
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-white/60 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredLists.map((list) => (
          <Link
            key={list.id}
            to={`/list/${list.id}`}
            className="group rounded-3xl bg-zinc-900/40 hover:bg-zinc-900/90 border border-white/10 hover:border-white/25 p-6 transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Cover Banner */}
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-5 border border-white/10">
                <img 
                  src={list.coverImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"} 
                  alt={list.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {list.isRanked && (
                    <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Ranked List
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/80 font-bold">
                  <div className="flex items-center gap-2">
                    <img 
                      src={list.userPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                      className="w-6 h-6 rounded-full border border-white/30 object-cover" 
                      alt="" 
                    />
                    <span>{list.userName || "Critic"}</span>
                  </div>
                  <span>{(list.items?.length || 4)} Entries</span>
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                {list.title}
              </h2>
              <p className="text-xs text-white/60 line-clamp-2 mt-2 font-serif italic leading-relaxed">
                {list.description}
              </p>

              {/* Sample Items Preview */}
              {list.items && list.items.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-white/5 pt-3">
                  {list.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-[10px] font-black text-orange-400 w-4">#{idx + 1}</span>
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
              <div className="flex items-center gap-1.5">
                <Heart size={14} className="text-rose-500 fill-rose-500" />
                <span>{list.likes} likes</span>
              </div>
              <span className="flex items-center gap-1 text-white font-bold group-hover:text-orange-400 group-hover:translate-x-1 transition-all">
                Explore List <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Create List Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl z-10 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black uppercase tracking-tight">Curate a Food List</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-full hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                  List Title *
                </label>
                <input 
                  type="text"
                  placeholder="e.g., Best Biryani in Hyderabad, Top 10 Cafes..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                  Editorial Description
                </label>
                <textarea 
                  rows={2}
                  placeholder="Why did you compile these places? What makes them special?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-zinc-900/60 rounded-2xl border border-white/10">
                <div>
                  <p className="text-xs font-bold text-white">Ranked List</p>
                  <p className="text-[10px] text-white/40">Numbered #1, #2, #3 based on preference</p>
                </div>
                <input 
                  type="checkbox"
                  checked={isRanked}
                  onChange={(e) => setIsRanked(e.target.checked)}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              {/* Add Items */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                  Add Places / Dishes
                </label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text"
                    placeholder="e.g., Bawarchi, Trishna, Ram Ki Bandi..."
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddItem())}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500"
                  />
                  <button 
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                {listItems.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {listItems.map((it, idx) => (
                      <div key={it.id} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl text-xs">
                        <span className="font-bold text-orange-400">#{idx + 1}</span>
                        <span className="flex-1 px-2 truncate">{it.name}</span>
                        <button 
                          onClick={() => setListItems(prev => prev.filter(x => x.id !== it.id))}
                          className="text-white/40 hover:text-rose-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateList}
                className="w-full py-3.5 rounded-full bg-orange-500 text-black font-black uppercase tracking-wider text-xs hover:bg-orange-400 transition-colors shadow-lg"
              >
                Publish List
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
