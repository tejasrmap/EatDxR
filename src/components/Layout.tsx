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
              <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                <div className="relative flex items-center justify-center w-10 h-10 bg-[#ccff00] rounded-xl group-hover:rotate-180 transition-transform duration-700 shadow-[0_0_20px_rgba(204,255,0,0.3)]">
                  <Flame className="text-black w-6 h-6 fill-black" />
                </div>
                <div className="logo-text flex items-center gap-1 italic transition-all duration-500">
                  <span className="font-black text-white text-3xl tracking-tighter uppercase">Mad</span>
                  <div className="bg-[#ccff00] text-black px-2 py-0.5 rounded-md font-black text-xl tracking-widest -skew-x-12 uppercase group-hover:scale-110 transition-transform">Eater</div>
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
