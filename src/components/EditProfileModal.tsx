import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { User } from "../types";
import { X, Loader2, Save, Camera, ChevronRight } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth, storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { upsertProfile, uploadMedia, getProfile, syncUserAuthorInfo } from "../services/supabaseService";
import { toast } from "sonner";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isOnboarding?: boolean;
  onSuccess?: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, isOnboarding, onSuccess }) => {
  const { updateDishdUser } = useAuth();
  const navigate = useNavigate();
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

  React.useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || "");
      setUsername(user.username || "");
      setPronouns(user.pronouns || "");
      setPhotoURL(user.photoURL || "");
      setBio(user.bio || "");
      setCuisines(user.favoriteCuisines?.join(", ") || "");
    }
  }, [isOpen, user]);

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
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
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

      const cleanUser = username.replace(/^@+/, '').trim().toLowerCase();

      if (cleanUser && cleanUser !== (user.username || '').toLowerCase()) {
        const existingSupa = await getProfile(cleanUser);
        if (existingSupa && existingSupa.uid !== user.uid) {
          toast.error("That username is already taken!");
          setIsSaving(false);
          return;
        }
      }

      const targetUsername = cleanUser || user.username || `critic_${user.uid.slice(0, 6)}`;
      const updatedUserObj: User = {
        ...user,
        displayName: displayName.trim(),
        photoURL: finalPhotoURL.trim(),
        username: targetUsername,
        pronouns: pronouns.trim() || user.pronouns,
        bio: bio.trim() || user.bio,
        favoriteCuisines: favoriteCuisines.length > 0 ? favoriteCuisines : user.favoriteCuisines
      };

      // 1. Primary: Save to Supabase (Profiles table)
      await upsertProfile(updatedUserObj);

      // 2. Immediately sync in-memory App Context and local storage
      updateDishdUser(updatedUserObj);
      try {
        localStorage.setItem("madeater_dishd_user", JSON.stringify(updatedUserObj));
      } catch (e) {}

      // 3. Update author info across reviews and cravings in Supabase
      if (finalPhotoURL !== user.photoURL || displayName.trim() !== user.displayName) {
        syncUserAuthorInfo(user.uid, displayName.trim(), finalPhotoURL.trim());
      }

      // 4. Fire onSuccess callback
      onSuccess?.(updatedUserObj);

      toast.success(isOnboarding ? "Welcome to Madeater! Profile set up." : "Profile updated successfully!");
      onClose();

      // 5. If user changed their username/critic ID, navigate to their new profile URL
      if (targetUsername && targetUsername.toLowerCase() !== (user.username || '').toLowerCase()) {
        const isAppRoute = window.location.pathname.startsWith('/app');
        const newProfilePath = isAppRoute ? `/app/profile/${targetUsername}` : `/profile/${targetUsername}`;
        navigate(newProfilePath, { replace: true });
      }

      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          updateProfile(currentUser, { displayName: displayName.trim() }).catch(() => {});
        }
      } catch {}
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-0 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-2xl transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Edit Panel */}
      <div className="relative w-full h-full md:h-[90vh] md:max-w-xl md:rounded-3xl bg-background border-0 md:border md:border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300 z-10">
        
        {/* Instagram-Style Header with Safe Area Inset Support */}
        <div className="shrink-0 z-20 bg-background/95 backdrop-blur-xl px-4 py-3 sm:px-6 sm:py-4 border-b border-border flex items-center justify-between pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:pt-4">
          <button 
            type="button"
            onClick={onClose} 
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-lg active:bg-muted"
          >
            {isOnboarding ? "Skip for now" : "Cancel"}
          </button>
          
          <h2 className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-foreground">
            {isOnboarding ? "Critic Profile" : "Edit Profile"}
          </h2>
          
          <button 
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="py-1.5 px-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{isSaving ? "Saving..." : "Done"}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
          <form onSubmit={handleSave} className="pb-8">
            
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

        {/* Floating Bottom Action Bar for Guaranteed Visibility on Mobile */}
        <div className="shrink-0 p-3 sm:p-4 bg-background/95 backdrop-blur-xl border-t border-border flex items-center gap-3 z-20 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] md:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-bold text-muted-foreground transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
