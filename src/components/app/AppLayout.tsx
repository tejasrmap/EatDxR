import { ReactNode, useState, useEffect } from "react";
import { AppHeader } from "./AppHeader";
import { AppNavigationDock } from "./AppNavigationDock";
import { EmailVerificationBanner } from "../EmailVerificationBanner";
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

  const isAppHome = routerLocation.pathname === "/app" || routerLocation.pathname === "/app/";
  const isReelsView = routerLocation.pathname === "/app/cravings" || routerLocation.pathname === "/cravings";

  const getSubPageTitle = (path: string): string | undefined => {
    if (path.startsWith("/app/dishes") || path.startsWith("/app/explore") || path.startsWith("/dishes")) return "Signature Dishes";
    if (path.startsWith("/app/dish") || path.startsWith("/dish/")) return "Dish Graph";
    if (path.startsWith("/app/restaurants") || path.startsWith("/restaurants")) return "Top Restaurants";
    if (path.startsWith("/app/restaurant") || path.startsWith("/restaurant/")) return "Restaurant";
    if (path.startsWith("/app/lists") || path.startsWith("/lists")) return "Food Lists";
    if (path.startsWith("/app/list") || path.startsWith("/list/")) return "Curated Guide";
    if (path.startsWith("/app/profile") || path.startsWith("/profile")) {
      const parts = path.split("/").filter(Boolean);
      const identifier = parts[parts.length - 1];
      if (identifier && identifier !== "profile" && identifier !== "app") {
        return `@${identifier.toLowerCase()}`;
      }
      return "Profile";
    }
    if (path.startsWith("/app/critics") || path.startsWith("/critics")) return "Food Critics";
    if (path.startsWith("/app/map") || path.startsWith("/map")) return "Food Radar";
    if (path.startsWith("/app/journal") || path.startsWith("/journal")) return "Food Diary";
    if (path.startsWith("/app/wrapped") || path.startsWith("/wrapped")) return "My Food Year";
    return undefined;
  };

  const showBack = !isAppHome && !isReelsView;
  const pageTitle = getSubPageTitle(routerLocation.pathname);

  return (
    <div className="min-h-screen bg-black text-white relative z-0 flex flex-col justify-between selection:bg-orange-500 selection:text-black overscroll-contain">
      {/* Background glow */}
      <div className="aurora-wrapper pointer-events-none opacity-20">
        <div className="aurora-gradient" />
      </div>

      {/* App Header (hidden on full-screen reels) */}
      {!isReelsView && (
        <>
          <AppHeader 
            currentCity={currentCity} 
            onCityChange={(city) => setCurrentCity(city)} 
            showBack={showBack}
            title={pageTitle}
          />
          <EmailVerificationBanner />
        </>
      )}

      {/* Main Full-Bleed App Content Area */}
      <main className={`flex-1 w-full max-w-4xl mx-auto ${isReelsView ? 'pt-0 pb-0' : 'pb-28'}`}>
        <div key={routerLocation.pathname} className="page-transition w-full">
          {children}
        </div>
      </main>

      {/* Persistent App Navigation Dock */}
      <AppNavigationDock />
    </div>
  );
}
