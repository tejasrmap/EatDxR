import React, { useState, useRef } from "react";
import { User } from "../types";
import { X, Loader2, Save, Camera, ChevronRight } from "lucide-react";
import { doc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth, storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { upsertProfile, uploadMedia } from "../services/supabaseService";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isOnboarding?: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, isOnboarding }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [pronouns, setPronouns] = useState(user?.pronouns || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [cuisines, setCuisines] = useState(user?.favoriteCuisines?.join(", ") || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const uploadFileWithProgress = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      // --- Resilience Engine: 15-second Timeout ---
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error("Upload timed out after 15s. Please check your CORS configuration."));
      }, 15000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error: any) => {
           clearTimeout(timeout);
           console.error("Upload failed", error);
           toast.error(`Upload Failed: ${error.code || error.message}`);
           setIsUploading(false);
           setUploadProgress(0);
           reject(error);
        }, 
        async () => {
          clearTimeout(timeout);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo too large. Please select an image under 2MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) return toast.error("Display name is required.");
    if (isOnboarding && !username.trim()) return toast.error("A username is required to continue.");
    
    setIsSaving(true);
    try {
      let finalPhotoURL = photoURL;
      // Storage Upload: Supabase Storage -> Firebase Storage -> Base64 Fallback
      if (photoFile) {
        setIsUploading(true);
        try {
          const fileName = `profiles/${user.uid}_${Date.now()}.jpg`;
          
          // 1. Primary: Supabase Storage bucket 'profiles'
          const supabaseUrl = await uploadMedia(photoFile, 'profiles', fileName);
          if (supabaseUrl) {
            finalPhotoURL = supabaseUrl;
            setUploadProgress(100);
          } else {
            // 2. Secondary: Firebase Storage
            finalPhotoURL = await uploadFileWithProgress(photoFile, fileName);
          }
        } catch (storageErr) {
          console.warn("Storage upload failed, falling back to base64:", storageErr);
          finalPhotoURL = photoURL; // Fallback to base64
        } finally {
          setIsUploading(false);
        }
      }

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
        photoURL: finalPhotoURL.trim(),
        username: username.trim().toLowerCase() || undefined,
        pronouns: pronouns.trim() || undefined,
        bio: bio.trim() || undefined,
        favoriteCuisines: favoriteCuisines.length > 0 ? favoriteCuisines : undefined
      };

      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));
      await setDoc(userRef, cleanPayload, { merge: true });

      // --- Universal Sync to Supabase & LocalStorage ---
      const updatedUserObj: User = {
        ...user,
        displayName: displayName.trim(),
        photoURL: finalPhotoURL.trim(),
        username: username.trim().toLowerCase() || user.username || `critic_${user.uid.slice(0, 6)}`,
        pronouns: pronouns.trim() || user.pronouns,
        bio: bio.trim() || user.bio,
        favoriteCuisines: favoriteCuisines.length > 0 ? favoriteCuisines : user.favoriteCuisines
      };
      await upsertProfile(updatedUserObj);
      try {
        localStorage.setItem("madeater_dishd_user", JSON.stringify(updatedUserObj));
      } catch (e) {}

      // --- Universal Sync Engine (Infinite-Batch Capacity) ---
      if (finalPhotoURL !== user.photoURL || displayName !== user.displayName) {
        const updateTasks: { ref: any, data: any }[] = [];
        
        // 1. Prepare Reviews Sync
        const reviewsQuery = query(collection(db, "reviews"), where("userId", "==", user.uid));
        const reviewsSnap = await getDocs(reviewsQuery);
        reviewsSnap.forEach((doc) => {
          updateTasks.push({ 
            ref: doc.ref, 
            data: { userPhoto: finalPhotoURL, userName: displayName.trim() } 
          });
        });

        // 2. Prepare Interactions Sync
        const interactionsQuery = query(collection(db, "interactions"), where("userId", "==", user.uid));
        const interactionsSnap = await getDocs(interactionsQuery);
        interactionsSnap.forEach((doc) => {
          updateTasks.push({ 
            ref: doc.ref, 
            data: { userPhoto: finalPhotoURL, userName: displayName.trim() } 
          });
        });

        // 3. Prepare Notifications Sync
        const notificationsQuery = query(collection(db, "notifications"), where("actorId", "==", user.uid));
        const notificationsSnap = await getDocs(notificationsQuery);
        notificationsSnap.forEach((doc) => {
          updateTasks.push({ 
            ref: doc.ref, 
            data: { actorPhoto: finalPhotoURL, actorName: displayName.trim() } 
          });
        });

        // Execute in 500-doc chunks (Firestore limit)
        for (let i = 0; i < updateTasks.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = updateTasks.slice(i, i + 500);
          chunk.forEach(task => batch.update(task.ref, task.data));
          await batch.commit();
        }
      }
      
      toast.success(isOnboarding ? "Welcome to Madeater! Profile set up." : "Profile updated successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-2xl transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Edit Panel */}
      <div className="relative w-full h-full md:h-[90vh] md:max-w-xl md:rounded-3xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Instagram-Style Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-4 md:px-6 md:py-6 border-b border-border flex items-center justify-between">
          <button 
            type="button"
            onClick={onClose} 
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {isOnboarding ? "Skip for now" : "Cancel"}
          </button>
          
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-foreground">
            {isOnboarding ? "Critic Profile" : "Edit Profile"}
          </h2>
          
          <button 
            type="button"
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
            <div className="flex flex-col items-center py-8 bg-muted border-b border-border">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img 
                        src={photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`} 
                        alt="Avatar"
                        className="w-24 h-24 rounded-full border-2 border-border shadow-2xl object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="text-foreground" />
                    </div>
                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full z-10">
                            <Loader2 className="animate-spin text-foreground w-5 h-5" />
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
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-focus-within:text-orange-500/60 transition-colors">Name</label>
                    <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-transparent border-b border-border py-2 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-all"
                        placeholder="e.g. John Doe"
                    />
                </div>

                {/* Username */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-focus-within:text-orange-500/60 transition-colors">Username</label>
                    <div className="relative">
                        <span className="absolute left-0 top-2 text-muted-foreground font-bold">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            className="w-full bg-transparent border-b border-border pl-5 py-2 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-all"
                            placeholder="username"
                        />
                    </div>
                </div>

                {/* Pronouns */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-focus-within:text-orange-500/60 transition-colors">Pronouns</label>
                    <input
                        type="text"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        className="w-full bg-transparent border-b border-border py-2 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-all"
                        placeholder="e.g. she/her"
                    />
                </div>

                {/* Bio */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-focus-within:text-orange-500/60 transition-colors">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-serif italic text-foreground/80 placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-all resize-none mt-2"
                        placeholder="Tell your story..."
                    />
                </div>

                {/* Favorite Cuisines */}
                <div className="space-y-1 group">
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-focus-within:text-orange-500/60 transition-colors">Favorite Cuisines</label>
                    <input
                        type="text"
                        value={cuisines}
                        onChange={(e) => setCuisines(e.target.value)}
                        className="w-full bg-transparent border-b border-border py-2 text-sm font-bold text-foreground/60 placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-all"
                        placeholder="e.g. Italian, Sushi, Mexican"
                    />
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-2">Separate with commas</p>
                </div>
            </div>

            {/* Meta Section */}
            <div className="px-6 py-8 border-t border-border bg-muted/30">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Professional Information</h3>
                <button 
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50 border border-border hover:border-muted-foreground/50 transition-all text-left group active:scale-95"
                >
                    <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-orange-500 transition-colors tracking-tight">Switch to Professional Account</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Get tools to grow your kitchen audience</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
