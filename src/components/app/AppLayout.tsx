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
  const isMapView = routerLocation.pathname.startsWith("/app/map") || routerLocation.pathname.startsWith("/map");
  const isFullBleedView = isReelsView || isMapView;

  // Check if current page is a deep detail sub-page (e.g. restaurant detail, dish graph, list detail)
  const isDetailPage = 
    routerLocation.pathname.startsWith("/app/dish/") ||
    routerLocation.pathname.startsWith("/dish/") ||
    routerLocation.pathname.startsWith("/app/restaurant/") ||
    routerLocation.pathname.startsWith("/restaurant/") ||
    routerLocation.pathname.startsWith("/app/list/") ||
    routerLocation.pathname.startsWith("/list/") ||
    (routerLocation.pathname.startsWith("/app/profile/") && routerLocation.pathname !== "/app/profile") ||
    (routerLocation.pathname.startsWith("/profile/") && routerLocation.pathname !== "/profile");

  const getSubPageTitle = (path: string): string | undefined => {
    if (path.startsWith("/app/dish") || path.startsWith("/dish/")) return "Dish Graph";
    if (path.startsWith("/app/restaurant") || path.startsWith("/restaurant/")) return "Restaurant";
    if (path.startsWith("/app/list") || path.startsWith("/list/")) return "Curated Guide";
    if (path.startsWith("/app/profile/") || path.startsWith("/profile/")) {
      const parts = path.split("/").filter(Boolean);
      const identifier = parts[parts.length - 1];
      if (identifier && identifier !== "profile" && identifier !== "app") {
        return `@${identifier.toLowerCase()}`;
      }
      return "Profile";
    }
    if (path.startsWith("/app/journal") || path.startsWith("/journal")) return "Food Diary";
    if (path.startsWith("/app/wrapped") || path.startsWith("/wrapped")) return "My Food Year";
    return undefined;
  };

  // Only show back button on deep detail pages; ALL root tabs have clean brand header
  const showBack = isDetailPage;
  const pageTitle = isDetailPage ? getSubPageTitle(routerLocation.pathname) : undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white relative z-0 flex flex-col justify-between selection:bg-orange-500 selection:text-black overscroll-contain">
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

      {/* Main App Content Area */}
      <main className={`flex-1 w-full ${isFullBleedView ? 'p-0 m-0 max-w-none' : 'max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] lg:pb-12'}`}>
        <div key={routerLocation.pathname} className={`page-transition w-full ${isFullBleedView ? 'h-full' : ''}`}>
          {children}
        </div>
      </main>

      {/* Persistent App Navigation Dock */}
      <AppNavigationDock />
    </div>
  );
}
