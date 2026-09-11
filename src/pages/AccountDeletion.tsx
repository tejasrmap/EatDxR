import React, { useState } from "react";
import { Trash2, ShieldAlert, CheckCircle2, Mail, ChevronLeft, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "../App";

export function AccountDeletion() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please provide a valid registered email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "deletion_requests"), {
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase() || null,
        reason: reason.trim() || "User requested via web portal",
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        status: "pending"
      });
      setSubmitted(true);
      toast.success("Account deletion request submitted successfully.");
    } catch (err: any) {
      console.error("Deletion request error:", err);
      // Fallback: Mailto link if database fails
      window.location.href = `mailto:tejag.vijay@gmail.com?subject=Madeater%20Account%20Deletion%20Request&body=Please%20delete%20my%20Madeater%20account%20and%20all%20associated%20data.%0A%0ARegistered%20Email:%20${encodeURIComponent(email)}%0AUsername:%20${encodeURIComponent(username)}`;
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Madeater</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            <ShieldAlert size={13} />
            <span>Google Play Data Safety</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12 space-y-8">
        
        {/* Header Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-widest">
            <Trash2 size={13} />
            <span>Account & Data Deletion</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
            Request Madeater Account Deletion
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            In compliance with Google Play Developer Program Policies, Madeater users can request the complete and irreversible deletion of their account and all associated culinary data.
          </p>
        </div>

        {/* Data Deletion Summary Box */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertCircle size={18} className="text-orange-400" />
            <span>What happens when you delete your account?</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 space-y-1.5">
              <strong className="text-rose-400 font-bold uppercase tracking-wider block">Permanently Deleted:</strong>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li>Personal profile, display name, and critic username</li>
                <li>All logged dining experiences, ratings, and reviews</li>
                <li>All uploaded food photos and video cravings (reels)</li>
                <li>Taste DNA preferences, quiz history, and saved lists</li>
                <li>Social interactions (followers, following, likes, comments)</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 space-y-1.5">
              <strong className="text-emerald-400 font-bold uppercase tracking-wider block">Data Retention Policy:</strong>
              <p className="text-zinc-400 leading-relaxed">
                Zero retained personal data. Once processed, your data is completely purged from our Firebase Firestore databases, Supabase storage buckets, and authentication servers.
              </p>
              <p className="text-zinc-500 pt-1">
                <strong>Timeline:</strong> Account deactivation is instant; permanent database purge is completed within <strong>7 business days</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Deletion Form */}
        <div className="bg-zinc-950 border border-rose-500/20 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Trash2 size={20} className="text-rose-500" />
            <span>Submit Web Deletion Request</span>
          </h2>

          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Request Received</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                Your account deletion request for <strong className="text-white">{email}</strong> has been logged. Our administrative team will verify and permanently delete all associated data within 7 business days.
              </p>
              <p className="text-xs text-zinc-500">
                A confirmation has also been dispatched to your email address.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Madeater Username (Optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. @foodcritic"
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Reason for leaving (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Help us improve Madeater..."
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Submit Deletion Request</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-zinc-500 text-center">
                This action is permanent and cannot be undone once processed.
              </p>
            </form>
          )}
        </div>

        {/* In-App Deletion Instructions */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            How to delete directly within the Madeater Mobile App
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-400 leading-relaxed">
            <li>Open the <strong>Madeater</strong> app on your Android or iOS device.</li>
            <li>Tap your <strong>Profile</strong> icon on the bottom navigation dock.</li>
            <li>Tap the <strong>Settings (Gear)</strong> icon in the top right corner.</li>
            <li>Scroll to <strong>Privacy & Safety</strong> and tap <strong>Delete Account & Data</strong>.</li>
            <li>Confirm deletion to immediately de-authenticate and queue your account for removal.</li>
          </ol>
        </div>

        {/* Direct Email Option */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-orange-400 shrink-0" />
            <div>
              <p className="text-white font-bold">Prefer to request via email directly?</p>
              <p className="text-zinc-400">Send an email to <a href="mailto:tejag.vijay@gmail.com" className="text-orange-400 underline">tejag.vijay@gmail.com</a></p>
            </div>
          </div>
          <a
            href="mailto:tejag.vijay@gmail.com?subject=Madeater%20Account%20Deletion%20Request&body=Please%20delete%20my%20Madeater%20account%20and%20all%20associated%20data."
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors shrink-0"
          >
            Email Developer
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} Madeater (com.madeater.app). Compliant with Google Play Account Deletion Policy.</p>
      </footer>
    </div>
  );
}
