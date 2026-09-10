import { ReactNode } from "react";
import { WebNavbar } from "./WebNavbar";
import { WebFooter } from "./WebFooter";
import { EmailVerificationBanner } from "../EmailVerificationBanner";

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
      <div className="pt-16">
        <EmailVerificationBanner />
      </div>

      {/* Main Website Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Public Marketing Footer */}
      <WebFooter />
    </div>
  );
}
