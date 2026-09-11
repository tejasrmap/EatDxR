import React from "react";
import { Shield, Lock, Eye, FileText, Smartphone, Mail, CheckCircle2, ChevronLeft, MapPin, Camera, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export function MadeaterPrivacy() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-orange-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Madeater</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 size={13} />
            <span>Google Play Compliant</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-white/10 bg-gradient-to-b from-zinc-900 to-black py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest mb-4">
            <Shield size={13} />
            <span>Official Legal Document</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3 uppercase">
            Privacy Policy for Madeater
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal leading-relaxed">
            This Privacy Policy governs the collection, processing, storage, and protection of personal data in the 
            <strong className="text-white"> Madeater Mobile Application</strong> (the social platform for food critics and lovers).
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500 font-medium">
            <span>Last Updated: September 2026</span>
            <span>•</span>
            <span>App Name: Madeater</span>
            <span>•</span>
            <span>Package ID: com.madeater.app</span>
            <span>•</span>
            <span>Website: <a href="https://madeater.in" target="_blank" rel="noreferrer" className="text-orange-400 underline">madeater.in</a></span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-10 text-sm leading-relaxed text-zinc-300">
        
        {/* 1. Overview */}
        <section className="space-y-3 bg-zinc-950 p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye size={18} className="text-orange-400" />
            <span>1. Overview and Scope</span>
          </h2>
          <p>
            <strong>Madeater</strong> is a social network and culinary diary that enables food critics and gastronomy enthusiasts to log meals, rate dishes, share short-form video cravings, curate ranked food guides, and discover local dining spots.
          </p>
          <p>
            We are committed to maintaining the trust of our users. This policy explains what information we collect, why we collect it, how it is safeguarded, and how you can exercise full control over your personal data in accordance with the <strong>Google Play Developer Distribution Agreement</strong>, GDPR, CCPA, and global privacy standards.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={18} className="text-orange-400" />
            <span>2. Information We Collect</span>
          </h2>
          <p>
            We collect information that you directly provide to us and data automatically generated through your use of Madeater:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <span>A. User Profile & Account Data</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Full Name / Display Name and unique Critic Username</li>
                <li>Email address (for authentication and security verification)</li>
                <li>Profile avatar / photograph</li>
                <li>Bio, flavor preferences, and Taste DNA quiz results</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <span>B. User-Generated Food Content</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Meal diary entries, culinary reviews, and dish ratings</li>
                <li>Uploaded food photos and short-form video cravings (reels)</li>
                <li>Custom curated food lists and recommendations</li>
                <li>Social interactions: likes, comments, and following lists</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <MapPin size={14} className="text-orange-400" />
                <span>C. Location & Radar Data</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Approximate or precise device location (only with your explicit permission)</li>
                <li>Used exclusively to discover nearby restaurants and tag visited dining locations on the Food Radar map</li>
                <li>We do NOT track or store real-time continuous location in the background</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Smartphone size={14} className="text-orange-400" />
                <span>D. Device & Performance Diagnostics</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Device model, manufacturer, and operating system version</li>
                <li>Firebase Cloud Messaging (FCM) token for push notifications</li>
                <li>Crash diagnostics and error logs to maintain app stability</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Device Permissions */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone size={18} className="text-orange-400" />
            <span>3. Device Permissions & Purpose</span>
          </h2>
          <p>
            Madeater requests runtime permissions only when an active feature requires them:
          </p>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">CAMERA</span>
              <p className="text-xs text-zinc-400">
                Allows you to capture photos or short videos of your dishes, dining experiences, or menus directly in the app. The camera is never accessed in the background.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">PHOTOS / MEDIA</span>
              <p className="text-xs text-zinc-400">
                Allows you to select and upload existing food photos or video clips from your gallery when logging meals or publishing cravings.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">LOCATION</span>
              <p className="text-xs text-zinc-400">
                Used to find nearby dining spots, calculate distance to restaurants, and center the Food Radar map around your current city.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">NOTIFICATIONS</span>
              <p className="text-xs text-zinc-400">
                Delivers updates when fellow food critics like your reviews, leave comments on your cravings, or follow your culinary profile.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Third-Party Services */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock size={18} className="text-orange-400" />
            <span>4. Third-Party Service Providers</span>
          </h2>
          <p>
            We partner with industry-leading infrastructure providers to deliver reliable, secure services:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-zinc-400">
            <li><strong>Google Firebase (Google LLC)</strong>: Authentication, Firestore database, Cloud Storage, Cloud Messaging, and Analytics. Governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-orange-400 underline">Google Privacy Policy</a>.</li>
            <li><strong>Supabase</strong>: Secure cloud database sync and media storage.</li>
            <li><strong>Google Maps Platform</strong>: Geocoding and restaurant location verification.</li>
            <li><strong>OpenRouter / Gemini AI</strong>: Processing AI Food Concierge recommendation queries (prompts are anonymous and not used to train models).</li>
          </ul>
        </section>

        {/* 5. Data Security & Encryption */}
        <section className="space-y-3 bg-zinc-950 p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield size={18} className="text-orange-400" />
            <span>5. Data Security and Encryption</span>
          </h2>
          <p>
            All communication between the Madeater application and cloud servers is encrypted in transit using <strong>HTTPS with TLS 1.3 encryption</strong>. User authentication tokens are securely managed using industry-standard token mechanisms, safeguarding your account from unauthorized access.
          </p>
        </section>

        {/* 6. Account & Data Deletion (Google Play Mandate) */}
        <section className="space-y-3 p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trash2 size={18} className="text-orange-400" />
            <span>6. Account Deletion & Data Retention (Google Play Mandate)</span>
          </h2>
          <p>
            We believe you own your culinary data. You have the unconditional right to delete your Madeater account and all associated data at any time:
          </p>
          <div className="text-xs space-y-2.5 text-zinc-300">
            <p>
              • <strong>In-App Deletion</strong>: Open Madeater, go to <em>Profile &gt; Settings &gt; Account &gt; Delete Account</em>. Confirming deletion immediately wipes your profile, logs, and media.
            </p>
            <p>
              • <strong>Direct Email Request</strong>: Send an email to developer <strong className="text-orange-400">tejag.vijay@gmail.com</strong> with the subject line <em>"Delete Madeater Account and Data"</em> and your registered email address. Requests are permanently executed within 7 business days.
            </p>
          </div>
        </section>

        {/* 7. Children's Privacy */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Children's Privacy</h2>
          <p>
            Madeater is intended for a general audience and does not knowingly collect personal data from children under the age of 13. If you believe a child under 13 has provided personal data without parental consent, please contact us immediately, and we will promptly remove such information.
          </p>
        </section>

        {/* 8. Contact Information */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail size={18} className="text-orange-400" />
            <span>8. Contact & Developer Information</span>
          </h2>
          <p className="text-xs text-zinc-400">
            If you have questions, concerns, or privacy requests, please contact our team:
          </p>
          <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 space-y-1.5 text-xs">
            <p className="text-white font-bold">Madeater Developer Team</p>
            <p className="text-zinc-400">Developer Contact: <a href="mailto:tejag.vijay@gmail.com" className="text-orange-400 underline">tejag.vijay@gmail.com</a></p>
            <p className="text-zinc-400">Application: Madeater (Letterboxd for Food)</p>
            <p className="text-zinc-400">Package Name: com.madeater.app</p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} Madeater. All rights reserved. Compliant with Google Play Developer Program Policies.</p>
      </footer>
    </div>
  );
}
