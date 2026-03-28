import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      
      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <span className="bg-white text-black px-2 py-0.5 rounded">D</span>
            <span>Dishd</span>
          </div>
          
          <div className="flex gap-8 text-xs font-medium text-white/40 uppercase tracking-widest">
            <Link to="/" className="hover:text-white transition-colors">About</Link>
            <Link to="/journal" className="hover:text-white transition-colors">Journal</Link>
            <Link to="/critics" className="hover:text-white transition-colors">Critics</Link>
            <Link to="/restaurants" className="hover:text-white transition-colors">Restaurants</Link>
            <Link to="/lists" className="hover:text-white transition-colors">Lists</Link>
          </div>
          
          <p className="text-xs text-white/20">
            © Dishd. Made by food lovers, for food lovers.
          </p>
        </div>
      </footer>
    </div>
  );
}
