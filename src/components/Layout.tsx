import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Link, useLocation } from "react-router-dom";
import { Flame } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isReelsMode = new URLSearchParams(location.search).get('mode') === 'reels';

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-[#00e054] selection:text-black">
      {!isReelsMode && <Navbar />}
      <main className={`${isReelsMode ? 'pt-0' : 'pt-16'} pb-28 md:pb-40 lg:pb-52`}>
        {children}
      </main>

      {!isReelsMode && (
        <footer className="border-t border-white/10 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                <div className="relative flex items-center justify-center w-8 h-8 bg-black border border-white/10 rounded-lg group-hover:border-orange-500/50 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Flame className="text-orange-500 w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="logo-text flex items-baseline tracking-tighter transition-all duration-500">
                  <span className="font-black text-white text-2xl tracking-tight">MAD</span>
                  <span className="font-black bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent text-2xl">EATER</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-1 mb-1 animate-pulse" />
                </div>
              </Link>
              <p className="max-w-xs text-xs text-white/40 leading-relaxed font-serif italic">
                The social network for food critics and lovers. Track every meal you've ever eaten.
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-x-10 gap-y-6">
              {[
                { label: "About", to: "/" },
                { label: "Journal", to: "/journal" },
                { label: "Critics", to: "/critics" },
                { label: "Restaurants", to: "/restaurants" },
                { label: "Lists", to: "/lists" }
              ].map((link, i) => (
                <Link 
                  key={i} 
                  to={link.to} 
                  className="small-caps text-white/20 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="small-caps text-[9px]">© {new Date().getFullYear()} Madeater Global</p>
            <p className="small-caps text-[9px] lowercase italic font-serif tracking-normal">Made with passion by food lovers</p>
          </div>
        </footer>
      )}
    </div>
  );
}
