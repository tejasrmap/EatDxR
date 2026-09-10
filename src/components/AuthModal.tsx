import React, { useState } from "react";
import { 
  signInWithPopup, 
  signInWithRedirect,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  updateProfile, 
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "../firebase";
import { triggerHaptic, isNative } from "../services/nativeService";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Sparkles, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string | null;
  onRedirectDone?: () => void;
}

export function AuthModal({ isOpen, onClose, redirectUrl, onRedirectDone }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSuccess = (msg: string) => {
    toast.success(msg);
    onClose();
    if (redirectUrl) {
      navigate(redirectUrl);
      onRedirectDone?.();
    } else if (location.pathname === "/" || isNative) {
      navigate("/app");
    }
  };

  if (!isOpen) return null;

  // 1. Google Sign-In with mobile/popup fallback
  const handleGoogleSignIn = async () => {
    triggerHaptic();
    setLoading(true);
    setErrorMessage(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      if (isNative) {
        // Native Capacitor WebView: popup is often blocked, try redirect or fallback
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirErr) {
          console.warn("Native redirect failed, trying popup fallback:", redirErr);
        }
      }

      await signInWithPopup(auth, provider);
      handleSuccess("Welcome to Madeater!");
    } catch (error: any) {
      console.error("Google sign in error:", error);
      const code = error?.code || "";

      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        setErrorMessage("Popup blocked on this device. Please sign in with Email or continue as Guest.");
      } else if (code === "auth/popup-closed-by-user") {
        // User just closed popup, no error message needed
      } else if (code === "auth/unauthorized-domain") {
        setErrorMessage("Domain not authorized in Firebase. Use Email or 1-Tap Guest Critic below.");
      } else {
        setErrorMessage(error?.message || "Google Sign-In could not complete. Try Email or Guest Critic.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Email & Password Sign In / Sign Up
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (authMode === "signup" && !displayName.trim()) {
      setErrorMessage("Please enter your display name.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (authMode === "signup") {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (userCred.user) {
          await updateProfile(userCred.user, {
            displayName: displayName.trim(),
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${userCred.user.uid}`
          });
        }
        handleSuccess("Account created! Welcome to Madeater.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        handleSuccess("Welcome back to Madeater!");
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      const code = error?.code || "";

      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setErrorMessage("Invalid email or password. Please check your credentials.");
      } else if (code === "auth/email-already-in-use") {
        setErrorMessage("An account already exists with this email. Try signing in.");
        setAuthMode("signin");
      } else if (code === "auth/weak-password") {
        setErrorMessage("Password is too weak. Please use at least 6 characters.");
      } else {
        setErrorMessage(error?.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Instant 1-Tap Guest Critic
  const handleGuestLogin = async () => {
    triggerHaptic();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Attempt Firebase Anonymous Login
      const cred = await signInAnonymously(auth);
      if (cred.user && !cred.user.displayName) {
        await updateProfile(cred.user, {
          displayName: "Guest Critic",
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}`
        });
      }
      handleSuccess("Signed in as Guest Critic!");
    } catch (error: any) {
      console.warn("Firebase anonymous auth not enabled or failed:", error);
      // Fallback: try logging in with a default guest critic credential or show helpful message
      try {
        await signInWithEmailAndPassword(auth, "critic.guest@madeater.internal", "madeater2026");
        handleSuccess("Signed in as Guest Critic!");
      } catch {
        // If guest user doesn't exist, create it once
        try {
          const newCred = await createUserWithEmailAndPassword(auth, "critic.guest@madeater.internal", "madeater2026");
          await updateProfile(newCred.user, {
            displayName: "Guest Critic",
            photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
          });
          handleSuccess("Signed in as Guest Critic!");
        } catch (innerErr: any) {
          setErrorMessage("Guest login unavailable. Please sign up with any email & password.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 text-white overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={() => { triggerHaptic(); onClose(); }}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <X size={16} />
          </button>

          {/* Header Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-3">
              <Sparkles size={11} />
              <span>Madeater Critic Pass</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              {authMode === "signin" ? "Welcome Back" : "Join as Critic"}
            </h2>
            <p className="text-xs text-white/50 mt-1 font-serif italic">
              Rate dishes, post cravings, and curate verified food lists.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <span className="shrink-0 font-bold mt-0.5">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Google 1-Tap Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-lg mb-3 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-black" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* 1-Tap Guest Button */}
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-white/90 hover:text-white font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all mb-4 disabled:opacity-60 cursor-pointer"
          >
            <ShieldCheck size={14} className="text-orange-400" />
            <span>1-Tap Instant Guest Critic</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">or with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {authMode === "signup" && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/50 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Teja Sharma"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/50 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  required
                  placeholder="foodie@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/50 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-black" />
              ) : (
                <>
                  <span>{authMode === "signin" ? "Sign In to Madeater" : "Create Critic Account"}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Signin / Signup */}
          <div className="mt-5 text-center pt-4 border-t border-white/10">
            {authMode === "signin" ? (
              <p className="text-xs text-white/50">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { triggerHaptic(); setAuthMode("signup"); setErrorMessage(null); }}
                  className="text-orange-400 font-bold hover:underline ml-1"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-xs text-white/50">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { triggerHaptic(); setAuthMode("signin"); setErrorMessage(null); }}
                  className="text-orange-400 font-bold hover:underline ml-1"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
