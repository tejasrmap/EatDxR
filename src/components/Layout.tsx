import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isReelsMode = new URLSearchParams(location.search).get('mode') === 'reels';

  return (
    <div className="min-h-screen bg-transparent text-foreground relative z-0">
      <div className="aurora-wrapper">
        <div className="aurora-gradient" />
      </div>
      {!isReelsMode && <Navbar />}
      <main className={`${isReelsMode ? 'pt-0' : 'pt-16'} pb-28 md:pb-40 lg:pb-52`}>
        {children}
      </main>

      {!isReelsMode && (
        <footer className="border-t border-border py-16 mt-20 bg-background/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-6">
              <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                <div className="logo-text flex items-baseline tracking-tighter">
                  <span className="font-bold text-foreground text-2xl tracking-tight uppercase">MAD</span>
                  <span className="font-bold text-muted-foreground text-2xl tracking-tight uppercase">EATER</span>
                </div>
              </Link>
              <p className="max-w-xs text-sm text-muted-foreground font-medium">
                The network for food critics and lovers.
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
                  className="font-medium text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-medium text-xs text-muted-foreground">© {new Date().getFullYear()} Madeater Global</p>
            <p className="font-medium text-xs text-muted-foreground">Made with passion by food lovers</p>
          </div>
        </footer>
      )}
    </div>
  );
}
