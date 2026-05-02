import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

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
                <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-fuchsia-500 via-cyan-400 to-yellow-400 rounded-full group-hover:animate-spin shadow-[0_0_15px_rgba(255,0,255,0.5)] border-2 border-white/20">
                  <Sparkles className="text-black w-6 h-6 fill-white" />
                </div>
                <div className="logo-text flex items-center -rotate-3 group-hover:rotate-2 transition-all duration-300 ml-1">
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 text-4xl tracking-tighter" style={{ WebkitTextStroke: '1px #ff00ff', filter: 'drop-shadow(3px 3px 0px #00ffff)' }}>MAD</span>
                  <span className="font-black text-white text-xl tracking-[0.2em] bg-black px-3 py-1 rounded-full border-2 border-[#ccff00] ml-2 shadow-[3px_3px_0px_#ff00ff] -translate-y-1">EATER</span>
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
