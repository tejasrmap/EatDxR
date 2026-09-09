import React from "react";
import { Shield, Lock, Eye, FileText, Smartphone, Mail, CheckCircle2, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function ApecERPPrivacy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-orange-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 size={13} />
            <span>Google Play Compliant</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
            <Shield size={13} />
            <span>Official Legal Document</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            Privacy Policy for ApecERP
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal leading-relaxed">
            This Privacy Policy governs the collection, processing, and protection of user data within the 
            <strong className="text-white"> ApecERP Mobile Application</strong>, developed for institutional and enterprise resource planning.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500 font-medium">
            <span>Last Updated: September 2026</span>
            <span>•</span>
            <span>App ID / Package: com.apec.erp / ApecERP</span>
            <span>•</span>
            <span>Platform: Android & iOS</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-10 text-sm leading-relaxed text-zinc-300">
        
        {/* 1. Overview */}
        <section className="space-y-3 bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye size={18} className="text-orange-400" />
            <span>1. Overview and Scope</span>
          </h2>
          <p>
            The <strong>ApecERP Mobile App</strong> is an Enterprise Resource Planning application designed for educational institutions, corporate staff, faculty, students, and administration. We respect your privacy and are committed to safeguarding your personal data in strict compliance with the Google Play Developer Distribution Agreement and applicable global data protection laws (including GDPR and the Digital Personal Data Protection Act).
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={18} className="text-orange-400" />
            <span>2. Information We Collect</span>
          </h2>
          <p>
            We only collect information necessary to fulfill institutional workflows, verify attendance, process academic records, and enable communication:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-orange-400">
                A. Personal & Academic Data
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Full Name and institutional identification number (Roll No / Employee ID)</li>
                <li>Registered email address and mobile contact number</li>
                <li>Department, course, semester, and academic designation</li>
                <li>Profile photograph (uploaded voluntarily by the user or institution)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-orange-400">
                B. Device & Diagnostic Information
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Device model, manufacturer, and Android/iOS OS version</li>
                <li>Firebase Cloud Messaging (FCM) token for push notifications</li>
                <li>Internet connection status and crash log diagnostics</li>
                <li>App performance and error analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Device Permissions */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone size={18} className="text-orange-400" />
            <span>3. Device Permissions & Usage</span>
          </h2>
          <p>
            The ApecERP mobile application asks for runtime permissions only when an explicit feature requires it:
          </p>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">CAMERA</span>
              <p className="text-xs text-zinc-400">
                Used strictly to scan institutional attendance QR codes, capture assignment receipts, or take a profile picture. We do NOT record or stream video in the background.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">STORAGE / PHOTOS</span>
              <p className="text-xs text-zinc-400">
                Used to upload academic assignments, syllabus PDFs, syllabus files, and download semester report cards.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">NOTIFICATIONS</span>
              <p className="text-xs text-zinc-400">
                Used to deliver important institutional alerts, such as fee deadlines, exam timetables, emergency notices, and attendance warnings.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-white/5 flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">LOCATION (OPTIONAL)</span>
              <p className="text-xs text-zinc-400">
                If enabled by your institution for geofenced attendance check-in, approximate location is checked strictly at the moment of check-in and is never continuously tracked.
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
            To deliver secure notification and cloud services, ApecERP integrates with Google Play Services and trusted infrastructure:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-zinc-400">
            <li><strong>Google Play Services</strong>: For app licensing, updates, and core OS integration.</li>
            <li><strong>Firebase Cloud Messaging (Google LLC)</strong>: For encrypted push notification delivery.</li>
            <li><strong>Firebase Crashlytics / Analytics</strong>: For real-time bug tracking and crash prevention.</li>
          </ul>
          <p className="text-xs text-zinc-500 pt-1">
            These services process data according to Google's Privacy Policy at <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-orange-400 underline">policies.google.com/privacy</a>.
          </p>
        </section>

        {/* 5. Data Security & Storage */}
        <section className="space-y-3 bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield size={18} className="text-orange-400" />
            <span>5. Data Security and Encryption</span>
          </h2>
          <p>
            All network communication between the ApecERP mobile app and institutional ERP servers is encrypted in transit using industry-standard <strong>HTTPS with TLS 1.3 encryption</strong>. User authentication tokens are stored securely on the device using Android Keystore / iOS Keychain, preventing unauthorized token extraction.
          </p>
        </section>

        {/* 6. Account Deletion & Data Retention */}
        <section className="space-y-3 p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 size={18} className="text-orange-400" />
            <span>6. Account Deletion & Data Retention (Google Play Policy Compliance)</span>
          </h2>
          <p>
            Users have the right to request deletion of their account and associated personal data at any time:
          </p>
          <div className="text-xs space-y-2 text-zinc-300">
            <p>
              • <strong>In-App Deletion</strong>: Navigate to <em>Profile / Settings &gt; Account &gt; Request Account Deletion</em>.
            </p>
            <p>
              • <strong>Email Request</strong>: Send an email to <strong className="text-orange-400">admin@apecerp.com</strong> with your registered Roll Number/Employee ID and subject line <em>"Account & Data Deletion Request"</em>. Requests are processed within 7 business days in accordance with institutional regulatory standards.
            </p>
          </div>
        </section>

        {/* 7. Children's Privacy */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Children's Privacy</h2>
          <p>
            ApecERP does not knowingly collect personal data directly from children under 13 without the verifiable consent of the educational institution or parent/guardian. When used in school/college environments, all data is provisioned under institutional supervision for educational administration only.
          </p>
        </section>

        {/* 8. Contact Information */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail size={18} className="text-orange-400" />
            <span>8. Contact & Developer Details</span>
          </h2>
          <p className="text-xs text-zinc-400">
            If you have questions, feedback, or concerns regarding this Privacy Policy or your personal data within ApecERP, please contact our administrative team:
          </p>
          <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-1.5 text-xs">
            <p className="text-white font-bold">ApecERP Support & Privacy Team</p>
            <p className="text-zinc-400">Email: <a href="mailto:admin@apecerp.com" className="text-orange-400 underline">admin@apecerp.com</a></p>
            <p className="text-zinc-400">Developer Contact: <a href="mailto:tejag.vijay@gmail.com" className="text-orange-400 underline">tejag.vijay@gmail.com</a></p>
            <p className="text-zinc-400">Application: ApecERP Mobile ERP Portal</p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} ApecERP. All rights reserved. Compliant with Google Play Developer Policy.</p>
      </footer>
    </div>
  );
}
