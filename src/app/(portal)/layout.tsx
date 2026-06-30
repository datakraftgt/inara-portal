"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#E4DCD4]">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Mobile drawer + overlay */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content column — pb-16 reserves space for the fixed bottom nav on mobile */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 pb-16 md:pb-0">
        <Topbar onMenuOpen={() => setMobileOpen(true)} />
        {children}
      </div>

      {/* Fixed bottom nav — mobile only */}
      <MobileBottomNav />
    </div>
  );
}
