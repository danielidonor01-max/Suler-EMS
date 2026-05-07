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
    <div className="flex w-full h-screen bg-[#f8fafc] overflow-hidden p-5 gap-5">
      {/* 
          REFINED SPATIAL SYSTEM
          Reduced 'p-5' (20px) for a more mature, tighter executive-grade feel.
          The components are now more integrated while maintaining the floating premium feel.
      */}

      {/* Mature Operational Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      {/* Main Execution Surface */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        
        {/* Operational Command Layer */}
        <Header />
        
        {/* Workspace Content Area - THE MAIN OPERATIONAL HUB */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-[24px] border border-slate-200/60 shadow-sm relative">
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

        {/* Global Operational Signals - Mature Footer */}
        <footer className="px-8 py-4 bg-white rounded-[16px] border border-slate-200/60 shadow-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Suler EMS v2.4.0</span>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Health</span>
               <div className="flex gap-0.5">
                  {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 bg-emerald-400/30 rounded-full" />)}
                  <div className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
               </div>
             </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Security Active</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
