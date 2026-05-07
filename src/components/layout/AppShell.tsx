"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useAccess } from "@/context/AccessContext";
import { getRequiredPermissionForPath } from "@/config/access-rules";
import { AccessDenied } from "@/components/auth/Governance";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { checkPermission } = useAccess();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Route Protection Logic
  const requiredPermission = getRequiredPermissionForPath(pathname);
  const accessResult = requiredPermission ? checkPermission(requiredPermission) : { allowed: true };

  // Skip shell for login page
  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="flex w-full h-screen bg-[#f8fafc] overflow-hidden p-6 gap-6">
      {/* 
          SPATIAL SAFETY SYSTEM (24px padding via parent container 'p-6')
          Using 'p-6' (24px) on the root wrapper to create the floating workspace feel.
      */}

      {/* Primary Navigation Rail (Floating Sidebar) */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      {/* Main Execution Surface */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Operational Command Layer (Floating Navbar) */}
        <Header />
        
        {/* Workspace Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-[32px] border border-slate-100 shadow-premium relative">
          {!accessResult.allowed ? (
            <div className="section-breathing">
              <div className="max-w-[1200px] mx-auto">
                <AccessDenied reason={accessResult.reason} />
              </div>
            </div>
          ) : (
            <div className="animate-in">
              {children}
            </div>
          )}
        </main>

        {/* Global Operational Signals (Floating Footer) */}
        <footer className="px-10 py-5 bg-white rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Suler EMS v2.4.0</span>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">End-to-End Encryption Active</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
