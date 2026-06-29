"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import MobileDrawer from "@/components/layout/MobileDrawer";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Mobile drawer + overlay */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Topbar onMenuOpen={() => setMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
}
