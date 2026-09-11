import { Link } from "react-router-dom";
import { Smartphone, Download, Compass, Utensils, Map, ListOrdered, Award, Heart, Shield, Terminal } from "lucide-react";

export function WebFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/90 backdrop-blur-xl text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Top Banner: App Download Showcase */}
        <div className="rounded-3xl p-8 md:p-10 mb-16 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-xl text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-wider mb-3">
              <Smartphone size={13} />
              <span>Available for Mobile & Web App</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-2">
              Experience Madeater Everywhere
            </h3>
            <p className="text-sm text-white/60">
              Log dining experiences with haptic ratings, watch full-screen food cravings, map your culinary discoveries, and tap into Chef AI recommendations on your mobile device.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <Link
              to="/app"
              className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)]"
            >
              <Smartphone size={18} />
              <div className="text-left">
                <span className="block text-[9px] font-bold opacity-80 uppercase leading-none">Instant Access</span>
                <span className="text-xs font-black leading-tight">Launch App View</span>
              </div>
            </Link>

            <a
              href="#android-download"
              onClick={(e) => {
                e.preventDefault();
                alert("The Android App is packaged with Capacitor (com.madeater.app). To install or compile the debug APK, run: npm run cap:sync");
              }}
              className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-xs uppercase tracking-wider transition-all"
            >
              <Download size={18} />
              <div className="text-left">
                <span className="block text-[9px] font-bold opacity-80 uppercase leading-none">Android Package</span>
                <span className="text-xs font-black leading-tight">Google Play Ready</span>
              </div>
            </a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="logo-text flex items-baseline tracking-tighter mb-3">
              <span className="font-black text-white text-xl uppercase">MAD</span>
              <span className="font-black text-orange-500 text-xl uppercase">EATER</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-4">
              The streetwear-inspired, high-energy social network for food critics and culinary obsessives.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Shield size={12} className="text-orange-400" />
              <span>Verified Critic Engine</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Discover</h4>
            <ul className="space-y-2 text-xs font-medium text-white/70">
              <li><Link to="/dishes" className="hover:text-orange-400 transition-colors">Signature Dishes Index</Link></li>
              <li><Link to="/restaurants" className="hover:text-orange-400 transition-colors">Top Restaurants Directory</Link></li>
              <li><Link to="/map" className="hover:text-orange-400 transition-colors">Culinary Radar Map</Link></li>
              <li><Link to="/critics" className="hover:text-orange-400 transition-colors">Verified Critics Leaderboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Ecosystem</h4>
            <ul className="space-y-2 text-xs font-medium text-white/70">
              <li><Link to="/lists" className="hover:text-orange-400 transition-colors">Community Food Lists</Link></li>
              <li><Link to="/journal" className="hover:text-orange-400 transition-colors">Editorial Food Journal</Link></li>
              <li><Link to="/app/cravings" className="hover:text-orange-400 transition-colors">Trending Cravings Reels</Link></li>
              <li><Link to="/wrapped" className="hover:text-orange-400 transition-colors">Year in Food Wrapped</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Platform</h4>
            <ul className="space-y-2 text-xs font-medium text-white/70">
              <li><Link to="/app" className="text-orange-400 font-bold hover:underline">Custom Mobile App Shell</Link></li>
              <li><span className="text-white/40">Native Android (Capacitor)</span></li>
              <li><span className="text-white/40">Firebase Live Real-Time DB</span></li>
              <li><span className="text-white/40">Chef AI Assistant (Gemini)</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
          <p>© {new Date().getFullYear()} Madeater Global. Built for true food obsessives.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/admin/seed" className="hover:text-white transition-colors flex items-center gap-1">
              <Terminal size={12} />
              <span>Admin Seed</span>
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
