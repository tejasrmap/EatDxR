import { ReactNode } from "react";
import { WebNavbar } from "./WebNavbar";
import { WebFooter } from "./WebFooter";

interface WebsiteLayoutProps {
  children: ReactNode;
}

export function WebsiteLayout({ children }: WebsiteLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white relative z-0 flex flex-col justify-between selection:bg-orange-500 selection:text-black">
      {/* Aurora glow effect */}
      <div className="aurora-wrapper pointer-events-none">
        <div className="aurora-gradient opacity-30" />
      </div>

      {/* Public Marketing Header */}
      <WebNavbar />

      {/* Main Website Content */}
      <main className="pt-16 flex-grow">
        {children}
      </main>

      {/* Public Marketing Footer */}
      <WebFooter />
    </div>
  );
}
