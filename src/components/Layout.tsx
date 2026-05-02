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
    <div className="min-h-screen bg-black text-white selection:bg-[#ccff00] selection:text-black">
      {!isReelsMode && <Navbar />}
      <main className={`${isReelsMode ? 'pt-0' : 'pt-16'} pb-28 md:pb-40 lg:pb-52`}>
        {children}
      </main>

      {!isReelsMode && (
        <footer className="border-t-4 border-[#333333] py-16 mt-20 bg-[#111111]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-6">
              <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                <div className="relative flex items-center justify-center w-10 h-10 bg-[#ccff00] border-2 border-black shadow-[4px_4px_0px_#ff00ff] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0px_#ff00ff] transition-all duration-100">
                  <Flame className="text-black w-5 h-5 fill-black" />
                </div>
                <div className="logo-text flex items-baseline tracking-tighter ml-2">
                  <span className="font-black text-white text-3xl tracking-tight uppercase" style={{ textShadow: '3px 3px 0px #00ffff' }}>MAD</span>
                  <span className="font-black bg-[#ff00ff] text-black px-1.5 py-0.5 text-2xl uppercase ml-1 border-2 border-black shadow-[3px_3px_0px_#00ffff]">EATER</span>
                </div>
              </Link>
              <p className="max-w-xs text-sm text-white/60 font-bold uppercase tracking-widest">
                The social network for food critics and lovers.
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-6">
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
                  className="font-black text-white/40 uppercase tracking-widest text-xs hover:text-[#ccff00] hover:-translate-y-1 transition-transform"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t-2 border-[#333333] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-black text-[10px] tracking-widest uppercase text-white/40">© {new Date().getFullYear()} Madeater Global</p>
            <p className="font-black text-[10px] tracking-widest uppercase text-[#ff00ff]">Made with passion by food lovers</p>
          </div>
        </footer>
      )}
    </div>
  );
}
