import { ReactNode, useState, useEffect } from "react";
import { AppHeader } from "./AppHeader";
import { AppNavigationDock } from "./AppNavigationDock";
import { useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "../../hooks/useLocation";
import { getCurrentCity } from "../../services/mapsService";
import { initializeNativeApp } from "../../services/nativeService";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [currentCity, setCurrentCity] = useState("Hyderabad");
  const { location } = useLocation();
  const routerLocation = useRouterLocation();

  useEffect(() => {
    initializeNativeApp();
  }, []);

  useEffect(() => {
    if (location) {
      getCurrentCity(location.latitude, location.longitude).then((city) => {
        if (city) setCurrentCity(city);
      });
    }
  }, [location]);

  const isReelsView = routerLocation.pathname === "/app/cravings";

  return (
    <div className="min-h-screen bg-black text-white relative z-0 flex flex-col justify-between selection:bg-orange-500 selection:text-black overscroll-contain">
      {/* Background glow */}
      <div className="aurora-wrapper pointer-events-none opacity-20">
        <div className="aurora-gradient" />
      </div>

      {/* App Header (hidden on full-screen reels) */}
      {!isReelsView && (
        <AppHeader 
          currentCity={currentCity} 
          onCityChange={(city) => setCurrentCity(city)} 
        />
      )}

      {/* Main Full-Bleed App Content Area */}
      <main className={`flex-1 w-full max-w-4xl mx-auto ${isReelsView ? 'pt-0 pb-0' : 'pb-28'}`}>
        {children}
      </main>

      {/* Persistent App Navigation Dock */}
      <AppNavigationDock />
    </div>
  );
}
