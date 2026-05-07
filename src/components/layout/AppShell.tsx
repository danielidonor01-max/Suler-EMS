"use client";

import { usePathname } from "next/navigation";
import { useAccess } from "@/context/AccessContext";
import { getRequiredPermissionForPath } from "@/config/access-rules";
import { AccessDenied } from "@/components/auth/Governance";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { checkPermission } = useAccess();

  // Route Protection Logic
  const requiredPermission = getRequiredPermissionForPath(pathname);
  const accessResult = requiredPermission ? checkPermission(requiredPermission) : { allowed: true };

  // Skip shell for login page
  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="flex w-full min-h-screen bg-[#f9fafb]">
      {/* Sidebar Rail */}
      <Sidebar />
      
      {/* Main Execution Surface */}
      <div className="flex-1 flex flex-col ml-[280px]">
        {/* Executive Header */}
        <Header />
        
        {/* Workspace Content */}
        <main className="flex-1 overflow-y-auto">
          {!accessResult.allowed ? (
            <div className="space-breathing">
              <div className="max-w-[1200px] mx-auto">
                <AccessDenied reason={accessResult.reason} />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {children}
            </div>
          )}
        </main>

        {/* Global Footer Signals (Optional Refinement) */}
        <footer className="px-8 py-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suler EMS v2.4.0</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">End-to-End Encryption Active</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
