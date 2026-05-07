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

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[var(--sidebar-width)]">
        <Header />
        <main className="flex-1 overflow-y-auto bg-bg">
          {!accessResult.allowed ? (
            <div className="p-8">
              <AccessDenied reason={accessResult.reason} />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
