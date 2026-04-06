import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Link, useLocation } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

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
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div className="flex items-center gap-2 text-xl font-black tracking-tighter group cursor-pointer justify-center md:justify-start">
              <div className="relative flex items-center justify-center w-6 h-6 bg-gradient-to-br from-orange-500 to-rose-500 rounded-md opacity-80 group-hover:opacity-100 group-hover:-rotate-12 transition-all duration-300">
                <UtensilsCrossed className="text-white w-3 h-3" />
              </div>
              <span className="text-white/80 group-hover:text-white transition-colors uppercase tracking-[0.2em] font-black">
                Eat<span className="serif italic text-[1.4em] text-rose-500 ml-0.5 leading-none">R</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-xs font-medium text-white/40 uppercase tracking-widest">
              <Link to="/" className="hover:text-white transition-colors">About</Link>
              <Link to="/journal" className="hover:text-white transition-colors">Journal</Link>
              <Link to="/critics" className="hover:text-white transition-colors">Critics</Link>
              <Link to="/restaurants" className="hover:text-white transition-colors">Restaurants</Link>
              <Link to="/lists" className="hover:text-white transition-colors">Lists</Link>
            </div>

            <p className="text-xs text-white/20">
              © EatR. Made by food lovers, for food lovers.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
