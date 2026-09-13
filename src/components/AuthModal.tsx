import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogleOAuth, 
  resetUserPassword, 
  upsertProfile,
  getCurrentSession
} from "../services/supabaseService";
import { User as DishdUser } from "../types";
import { triggerHaptic, isNative } from "../services/nativeService";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  Eye, 
  EyeOff, 
  Utensils, 
  Bookmark, 
  CheckCircle2,
  RefreshCw,
  Inbox
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string | null;
  onRedirectDone?: () => void;
}

export function AuthModal({ isOpen, onClose, redirectUrl, onRedirectDone }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "verify-email" | "forgot-password">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  // Handle countdown for resend verification email
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSuccess = (msg: string) => {
    toast.success(msg);
    onClose();
    if (redirectUrl) {
      navigate(redirectUrl);
      onRedirectDone?.();
    } else {
      navigate("/app/profile");
    }
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  // Google Sign-In via Supabase OAuth
  const handleGoogleSignIn = async () => {
    triggerHaptic();
    setErrorMessage(null);

    if (isNative) {
      setErrorMessage("Please use your Email and Password below to sign in inside the app.");
      return;
    }

    setLoading(true);
    try {
      await signInWithGoogleOAuth();
      // Browser will redirect to Google OAuth URL
    } catch (error: any) {
      console.error("Google sign in error:", error);
      setErrorMessage(error?.message || "Google Sign-In could not complete. Please use your email.");
      setLoading(false);
    }
  };

  // Email & Password Auth via Supabase
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (authMode === "signup" && !displayName.trim()) {
      setErrorMessage("Please enter your full name.");
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
        // 1. Sign up with Supabase
        const data = await signUpWithEmail(email.trim(), password, displayName.trim());
        
        if (data.user) {
          const fallbackPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`;
          const cleanName = displayName.trim() || "Food Lover";
          const defaultUsername = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) || `critic_${data.user.id.slice(0, 6)}`;

          const newUser: DishdUser = {
            uid: data.user.id,
            displayName: cleanName,
            email: email.trim(),
            photoURL: fallbackPhoto,
            username: defaultUsername,
            bio: "Food critic on Madeater",
            tasteDNA: {
              spice: 60,
              indian: 75,
              nonVeg: 50,
              asian: 40,
              desserts: 50,
              coffee: 70,
              personaTitle: "The Flavor Explorer"
            },
            stats: {
              mealsLogged: 0,
              reviewsWritten: 0,
              followers: 0,
              following: 0,
              followingList: []
            },
            createdAt: new Date().toISOString()
          };

          await upsertProfile(newUser);
          localStorage.setItem("madeater_dishd_user", JSON.stringify(newUser));

          // Also mirror to Firebase in background if configured
          try {
            await createUserWithEmailAndPassword(auth, email.trim(), password).catch(() => {});
          } catch {}

          if (data.session) {
            handleSuccess("Welcome to Madeater!");
          } else {
            setRegisteredEmail(email.trim());
            setResendCooldown(60);
            setAuthMode("verify-email");
            toast.success(`Verification email sent to ${email.trim()}`);
          }
        }
      } else {
        // Sign in with Supabase Auth
        try {
          await signInWithEmail(email.trim(), password);
          handleSuccess("Welcome back to Madeater!");
        } catch (supaErr: any) {
          // If user exists in Firebase but not yet Supabase, try Firebase fallback & auto-migrate!
          try {
            const fbCred = await signInWithEmailAndPassword(auth, email.trim(), password);
            if (fbCred.user) {
              await signUpWithEmail(email.trim(), password, fbCred.user.displayName || "Critic").catch(() => {});
              handleSuccess("Welcome back to Madeater!");
              return;
            }
          } catch {}

          const msg = supaErr?.message || "";
          if (msg.toLowerCase().includes("invalid login") || msg.toLowerCase().includes("invalid_grant")) {
            setErrorMessage("Invalid email or password. Please check your credentials or click 'Forgot password?'.");
          } else if (msg.toLowerCase().includes("email not confirmed")) {
            setErrorMessage("Please confirm your email address before signing in. Check your inbox.");
          } else {
            setErrorMessage(msg || "Authentication failed. Please try again.");
          }
        }
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      setErrorMessage(error?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Verification link
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending) return;
    triggerHaptic();
    setIsResending(true);
    try {
      await resetUserPassword(registeredEmail || email.trim());
      toast.success(`New link sent to ${registeredEmail || email.trim()}!`);
      setResendCooldown(60);
    } catch (err: any) {
      console.error("Resend error:", err);
      toast.error(err?.message || "Failed to resend email.");
    } finally {
      setIsResending(false);
    }
  };

  // Check if User Verified Email Live
  const handleCheckEmailVerified = async () => {
    if (isCheckingVerification) return;
    triggerHaptic();
    setIsCheckingVerification(true);
    try {
      const session = await getCurrentSession();
      if (session?.user) {
        handleSuccess("🎉 Logged in! Welcome to Madeater.");
      } else {
        toast.info("Please check your email and click the confirmation link, then sign in.");
      }
    } catch (err) {
      console.error("Check status error:", err);
      toast.error("Could not check verification status.");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email address to receive a password reset link.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await resetUserPassword(email.trim());
      setResetEmailSent(true);
      toast.success("Password reset link sent! Check your email inbox.");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setErrorMessage(err?.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4 pointer-events-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal / Bottom Sheet Window */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          transition={{ type: "spring", damping: 30, stiffness: 380 }}
          className="relative w-full max-w-md bg-[#0f0f13] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-3xl px-6 pt-3 pb-8 sm:p-8 shadow-2xl z-10 text-white overflow-hidden max-h-[92vh] overflow-y-auto scrollbar-hide pointer-events-auto"
        >
          {/* Subtle ambient top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 bg-gradient-to-b from-orange-500/15 via-orange-500/5 to-transparent blur-2xl pointer-events-none" />

          {/* Drag handle for mobile sheet */}
          <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-1 mb-5 sm:hidden" />

          {/* Top Bar with Badge & Close Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={11} />
              <span>Madeater Critic Pass</span>
            </div>

            <button
              onClick={() => { triggerHaptic(); onClose(); }}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* 1. Verification Screen Step */}
          {authMode === "verify-email" ? (
            <div className="py-2 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4 shadow-xl shadow-orange-500/10">
                <Inbox size={30} className="animate-bounce" />
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Verify Your Email
              </h2>

              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                We've sent a verification link to your email address:
              </p>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 font-bold text-xs mb-6 max-w-full truncate">
                <Mail size={13} className="shrink-0" />
                <span className="truncate">{registeredEmail || email}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-white/70 text-left mb-6 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Click the verification link sent to your inbox to earn the <strong>Verified Critic</strong> badge.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">💡</span>
                  <span>Can't find it? Make sure to check your spam or promotions folder.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCheckEmailVerified}
                  disabled={isCheckingVerification}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCheckingVerification ? (
                    <Loader2 size={16} className="animate-spin text-black" />
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>I've Verified My Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0 || isResending}
                  className="w-full h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : resendCooldown > 0 ? (
                    `Resend Email (${resendCooldown}s)`
                  ) : (
                    "Resend Verification Link"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSuccess("Welcome to Madeater! You can verify your email anytime from your profile.")}
                  className="w-full py-2.5 text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  Continue to App now →
                </button>
              </div>
            </div>
          ) : authMode === "forgot-password" ? (
            /* 2. Forgot / Reset Password Screen */
            <div className="py-2 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4 shadow-xl shadow-orange-500/10">
                <Lock size={30} />
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Reset Password
              </h2>

              <p className="text-xs text-white/60 mb-5 leading-relaxed">
                Enter your registered email address and we'll send you a password reset link.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left leading-relaxed">
                  <span>⚠️ {errorMessage}</span>
                </div>
              )}

              {resetEmailSent ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 size={15} />
                      <span>Password Reset Email Sent!</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      We've dispatched a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setAuthMode("signin"); setResetEmailSent(false); }}
                    className="w-full h-12 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative flex items-center h-13 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                      <Mail size={18} className="absolute left-4 text-white/40 pointer-events-none z-10" />
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        placeholder="yourname@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-full bg-zinc-900/90 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none font-medium z-0"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin text-black" />
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { triggerHaptic(); setAuthMode("signin"); setErrorMessage(null); }}
                      className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Header Typography */}
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  {authMode === "signin" ? "Welcome Back" : "Join the Critics"}
                </h2>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  {authMode === "signin" 
                    ? "Sign in to access your gastronomic profile, reviews, and taste DNA." 
                    : "Create your personal critic account to review dishes, curate lists, and verify your profile."}
                </p>
              </div>

              {/* Exclusive Value Strip (Useful Critic Perks) */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 my-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] text-white/70 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Utensils size={14} className="text-orange-400" />
                  <span className="font-semibold text-[10px]">Dish Reviews</span>
                </div>
                <div className="flex flex-col items-center gap-1 border-x border-white/5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="font-semibold text-[10px]">Taste DNA</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Bookmark size={14} className="text-orange-400" />
                  <span className="font-semibold text-[10px]">Wishlists</span>
                </div>
              </div>

              {/* Modern Segmented Tab Switcher */}
              <div className="grid grid-cols-2 p-1.5 bg-zinc-900/90 rounded-2xl border border-white/10 mb-5">
                <button
                  type="button"
                  onClick={() => { triggerHaptic(); setAuthMode("signin"); setErrorMessage(null); }}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    authMode === "signin"
                      ? "bg-white text-black shadow-md"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { triggerHaptic(); setAuthMode("signup"); setErrorMessage(null); }}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    authMode === "signup"
                      ? "bg-white text-black shadow-md"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 leading-relaxed">
                  <span className="shrink-0 font-bold mt-0.5">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Auth Form with Generous Touch Targets */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative flex items-center h-13 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                      <User size={18} className="absolute left-4 text-white/40 pointer-events-none z-10" />
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        spellCheck={false}
                        required
                        placeholder="e.g. Teja Sharma"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full h-full bg-zinc-900/90 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none font-medium z-0"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center h-13 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                    <Mail size={18} className="absolute left-4 text-white/40 pointer-events-none z-10" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-full bg-zinc-900/90 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none font-medium z-0"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                      Password
                    </label>
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => { 
                          triggerHaptic(); 
                          setAuthMode("forgot-password"); 
                          setErrorMessage(null); 
                          setResetEmailSent(false); 
                        }}
                        className="text-xs text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center h-13 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden">
                    <Lock size={18} className="absolute left-4 text-white/40 pointer-events-none z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-full bg-zinc-900/90 rounded-2xl pl-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none font-medium z-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-4 text-white/40 hover:text-white transition-colors p-1 cursor-pointer z-10"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-black" />
                  ) : (
                    <>
                      <span>{authMode === "signin" ? "Sign In to Madeater" : "Create Critic Account"}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Web Browser Google Sign-In */}
              {!isNative && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">or continue with</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full h-12 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin text-white" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>Google</span>
                  </button>
                </>
              )}

              {/* Footer Prompt */}
              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                {authMode === "signin" ? (
                  <p className="text-xs text-white/50">
                    New to Madeater?{" "}
                    <button
                      type="button"
                      onClick={() => { triggerHaptic(); setAuthMode("signup"); setErrorMessage(null); }}
                      className="text-orange-400 font-bold hover:underline ml-1 cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-white/50">
                    Already a critic?{" "}
                    <button
                      type="button"
                      onClick={() => { triggerHaptic(); setAuthMode("signin"); setErrorMessage(null); }}
                      className="text-orange-400 font-bold hover:underline ml-1 cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

