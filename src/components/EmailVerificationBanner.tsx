import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Mail, CheckCircle2, RefreshCw, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { triggerHaptic } from "../services/nativeService";
import { getCurrentSupabaseUser, resetUserPassword } from "../services/supabaseService";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Check if user is signed in and unverified
  const isUnverified = user && !user.emailVerified;

  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  if (!isUnverified || isDismissed) return null;

  const handleResend = async () => {
    if (!user?.email || cooldown > 0 || isSending) return;
    triggerHaptic();
    setIsSending(true);
    try {
      await resetUserPassword(user.email);
      toast.success(`Verification email sent to ${user.email}!`);
      setCooldown(60);
    } catch (err: any) {
      console.error("Resend verification error:", err);
      toast.error(err?.message || "Failed to send verification email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (isChecking) return;
    triggerHaptic();
    setIsChecking(true);
    try {
      const supaUser = await getCurrentSupabaseUser();
      if (supaUser?.email_confirmed_at) {
        toast.success("🎉 Email successfully verified! Welcome Verified Critic.");
        setIsDismissed(true);
      } else {
        toast.info("Email is not verified yet. Please check your inbox or spam folder.");
      }
    } catch (err) {
      console.error("Check status error:", err);
      toast.error("Could not check verification status.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-950/80 via-zinc-900/90 to-orange-950/80 border-b border-orange-500/30 px-3.5 py-2 sm:py-2.5 text-xs text-white flex items-center justify-between gap-3 shadow-md backdrop-blur-md relative z-30">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
          <Mail size={12} />
        </div>
        <div className="truncate">
          <span className="font-semibold text-white/90">Verify your email </span>
          <span className="text-orange-400 font-bold">({user?.email})</span>
          <span className="hidden sm:inline text-white/60"> to unlock verified critic status.</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleCheckStatus}
          disabled={isChecking}
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition-all flex items-center gap-1 active:scale-95 cursor-pointer disabled:opacity-50"
          title="Refresh verification status"
        >
          {isChecking ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          <span>Check</span>
        </button>

        <button
          onClick={handleResend}
          disabled={cooldown > 0 || isSending}
          className="px-2.5 py-1 rounded-lg bg-orange-500 text-black text-[11px] font-black uppercase tracking-wider hover:bg-orange-400 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 size={11} className="animate-spin" />
          ) : cooldown > 0 ? (
            `Resend (${cooldown}s)`
          ) : (
            "Resend Link"
          )}
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-white/40 hover:text-white rounded-full transition-colors cursor-pointer ml-0.5"
          title="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
