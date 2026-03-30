import React, { useState, useRef } from "react";
import { User } from "../types";
import { X, Loader2, Save, Camera, ChevronRight } from "lucide-react";
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../firebase";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isOnboarding?: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, isOnboarding }) => {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [username, setUsername] = useState(user.username || "");
  const [pronouns, setPronouns] = useState(user.pronouns || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [bio, setBio] = useState(user.bio || "");
  const [cuisines, setCuisines] = useState(user.favoriteCuisines?.join(", ") || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setPhotoURL(base64String);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to read image file.");
      setIsUploading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) return toast.error("Display name is required.");
    if (isOnboarding && !username.trim()) return toast.error("A username is required to continue.");
    
    setIsSaving(true);
    try {
      const favoriteCuisines = cuisines
        .split(",")
        .map(c => c.trim())
        .filter(c => c.length > 0);

      if (username.trim()) {
        const usernameQuery = query(
          collection(db, "users"),
          where("username", "==", username.trim().toLowerCase())
        );
        const usernameSnap = await getDocs(usernameQuery);
        
        if (!usernameSnap.empty && usernameSnap.docs[0].id !== user.uid) {
          toast.error("That username is already taken!");
          setIsSaving(false);
          return;
        }
      }

      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: displayName.trim()
        });
      }

      const userRef = doc(db, "users", user.uid);
      const payload: Partial<User> = {
        displayName: displayName.trim(),
        photoURL: photoURL.trim(),
        username: username.trim().toLowerCase() || undefined,
        pronouns: pronouns.trim() || undefined,
        bio: bio.trim() || undefined,
        favoriteCuisines: favoriteCuisines.length > 0 ? favoriteCuisines : undefined
      };

      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));
      await updateDoc(userRef, cleanPayload);

      // --- Universal Sync Engine ---
      // If photo or name changed, propagate to reviews, comments, and notifications
      if (photoURL !== user.photoURL || displayName !== user.displayName) {
        const batch = writeBatch(db);
        const feedback = [];

        // 1. Sync Reviews
        const reviewsQuery = query(collection(db, "reviews"), where("userId", "==", user.uid));
        const reviewsSnap = await getDocs(reviewsQuery);
        reviewsSnap.forEach((doc) => {
          batch.update(doc.ref, { 
            userPhoto: photoURL,
            userName: displayName.trim()
          });
        });

        // 2. Sync Interactions (Comments/Likes)
        const interactionsQuery = query(collection(db, "interactions"), where("userId", "==", user.uid));
        const interactionsSnap = await getDocs(interactionsQuery);
        interactionsSnap.forEach((doc) => {
          batch.update(doc.ref, { 
            userPhoto: photoURL,
            userName: displayName.trim()
          });
        });

        // 3. Sync Notifications (where user is the actor)
        const notificationsQuery = query(collection(db, "notifications"), where("actorId", "==", user.uid));
        const notificationsSnap = await getDocs(notificationsQuery);
        notificationsSnap.forEach((doc) => {
          batch.update(doc.ref, { 
            actorPhoto: photoURL,
            actorName: displayName.trim()
          });
        });

        await batch.commit();
      }
      
      toast.success(isOnboarding ? "Welcome to EatDxR! Profile set up." : "Profile updated successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl transition-opacity animate-in fade-in"
        onClick={!isOnboarding ? onClose : undefined}
      />
      
      {/* Edit Panel */}
      <div className="relative w-full h-full md:h-[90vh] md:max-w-xl md:rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Instagram-Style Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md px-4 py-4 md:px-6 md:py-6 border-b border-white/5 flex items-center justify-between">
          {!isOnboarding ? (
             <button 
               onClick={onClose} 
               className="text-xs font-bold text-white/60 hover:text-white transition-colors"
             >
                Cancel
             </button>
          ) : <div className="w-12" />}
          
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-white">Edit Profile</h2>
          
          <button 
            onClick={() => handleSave()}
            disabled={isSaving}
            className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Done"}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <form onSubmit={handleSave} className="pb-20">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center py-8 bg-white/5 border-b border-white/5">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img 
                        src={photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`} 
                        alt="Avatar"
                        className="w-24 h-24 rounded-full border-2 border-white/10 shadow-2xl object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="text-white" />
                    </div>
                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10">
                            <Loader2 className="animate-spin text-white w-5 h-5" />
                        </div>
                    )}
                </div>
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 text-xs font-black text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors"
                >
                    {isUploading ? "Uploading..." : "Change profile photo"}
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                />
            </div>

            {/* Fields List */}
            <div className="px-6 py-6 space-y-8">
                
                {/* Display Name */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 group-focus-within:text-orange-500/60 transition-colors">Name</label>
                    <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-transparent border-b border-white/5 py-2 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-all"
                        placeholder="e.g. John Doe"
                    />
                </div>

                {/* Username */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 group-focus-within:text-orange-500/60 transition-colors">Username</label>
                    <div className="relative">
                        <span className="absolute left-0 top-2 text-white/40 font-bold">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            className="w-full bg-transparent border-b border-white/5 pl-5 py-2 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-orange-500 transition-all"
                            placeholder="username"
                        />
                    </div>
                </div>

                {/* Pronouns */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 group-focus-within:text-orange-500/60 transition-colors">Pronouns</label>
                    <input
                        type="text"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        className="w-full bg-transparent border-b border-white/5 py-2 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-orange-500 transition-all"
                        placeholder="e.g. she/her"
                    />
                </div>

                {/* Bio */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 group-focus-within:text-orange-500/60 transition-colors">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm font-serif italic text-white/80 placeholder:text-white/10 focus:outline-none focus:border-orange-500 transition-all resize-none mt-2"
                        placeholder="Tell your story..."
                    />
                </div>

                {/* Favorite Cuisines */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-white/20 group-focus-within:text-orange-500/60 transition-colors">Favorite Cuisines</label>
                    <input
                        type="text"
                        value={cuisines}
                        onChange={(e) => setCuisines(e.target.value)}
                        className="w-full bg-transparent border-b border-white/5 py-2 text-sm font-bold text-white/60 placeholder:text-white/10 focus:outline-none focus:border-orange-500 transition-all"
                        placeholder="e.g. Italian, Sushi, Mexican"
                    />
                    <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest mt-2">Separate with commas</p>
                </div>
            </div>

            {/* Meta Section */}
            <div className="px-6 py-8 border-t border-white/5 bg-white/[0.01]">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Professional Information</h3>
                <button 
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all text-left group active:scale-95"
                >
                    <div>
                        <p className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors tracking-tight">Switch to Professional Account</p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Get tools to grow your kitchen audience</p>
                    </div>
                    <ChevronRight size={16} className="text-white/10" />
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
