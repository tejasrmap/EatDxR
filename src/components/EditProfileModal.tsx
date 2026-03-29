import React, { useState } from "react";
import { User } from "../types";
import { X, Loader2, Save } from "lucide-react";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
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

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return toast.error("Display name is required.");
    if (isOnboarding && !username.trim()) return toast.error("A username is required to continue.");
    
    setIsSaving(true);
    // ... same saving logic ...
    try {
      // 1. Process array payloads
      const favoriteCuisines = cuisines
        .split(",")
        .map(c => c.trim())
        .filter(c => c.length > 0);

      // 2. Enforce Username Uniqueness
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

      // 2. Safely structure Firebase Auth update parallel to Firestore update
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Update Firebase Auth natively
        await updateProfile(currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL.trim() || undefined
        });
      }

      // 3. Update Firestore Global User Record
      const userRef = doc(db, "users", user.uid);
      
      const payload: Partial<User> = {
        displayName: displayName.trim(),
        photoURL: photoURL.trim(),
        username: username.trim().toLowerCase() || undefined,
        pronouns: pronouns.trim() || undefined,
        bio: bio.trim() || undefined,
        favoriteCuisines: favoriteCuisines.length > 0 ? favoriteCuisines : undefined
      };

      // Strip 'undefined' values cleanly for Firestore since it rejects explicit undefined writes
      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));

      await updateDoc(userRef, cleanPayload);
      
      toast.success(isOnboarding ? "Welcome to EatDxR! Profile set up." : "Profile updated successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if(error.message?.includes("Missing or insufficient permissions")) {
        toast.error("Database denied. Did you deploy your new firestore.rules?");
      } else {
        toast.error("Failed to update profile.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div 
        className="w-full max-w-lg bg-[#1a202c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#00e054]">
              {isOnboarding ? "Welcome to EatDxR" : "Edit Profile"}
            </h2>
            {isOnboarding && <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">First, let's claim your unique username</p>}
          </div>
          {!isOnboarding && (
            <button 
              onClick={onClose}
              disabled={isSaving}
              className="p-1 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <form id="editProfileForm" onSubmit={handleSave} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} // Auto strip spaces/caps
                  className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-colors"
                  placeholder="foodie_lover (No spaces)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">Pronouns</label>
              <input
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-colors text-sm"
                placeholder="e.g. she/her, they/them"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">Avatar Photo URL</label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-colors text-sm"
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell us about your culinary journey..."
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-colors resize-none font-serif italic text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">Favorite Cuisines</label>
              <input
                type="text"
                value={cuisines}
                onChange={(e) => setCuisines(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-colors text-sm"
                placeholder="e.g. Italian, Sushi, Mexican"
              />
              <p className="text-[10px] text-white/30 tracking-wide mt-1">Separate multiple cuisines with commas.</p>
            </div>

          </form>
        </div>

        <div className="p-5 border-t border-white/10 bg-black/20 flex justify-end">
          <button
            type="submit"
            form="editProfileForm"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#00e054] hover:bg-[#00c044] text-black px-6 py-2.5 rounded textxs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isSaving ? "Saving..." : "Save Profile"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
