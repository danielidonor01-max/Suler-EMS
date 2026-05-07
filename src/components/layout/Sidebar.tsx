"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAccess } from "@/context/AccessContext";
import { Permissions, PermissionType } from "@/modules/auth/domain/permission.model";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission?: PermissionType;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/employees", label: "Staff", icon: "group", permission: Permissions.EMPLOYEE_VIEW },
  { href: "/attendance", label: "Attendance", icon: "event_available", permission: Permissions.ATTENDANCE_VIEW },
  { href: "/leave", label: "Leave", icon: "event_busy", permission: Permissions.LEAVE_VIEW },
  { href: "/payroll", label: "Payroll", icon: "payments", permission: Permissions.PAYROLL_VIEW },
  { href: "/settings", label: "Settings", icon: "settings", permission: Permissions.SETTINGS_MANAGE },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { checkPermission, user } = useAccess();

  // Filter items based on permissions
  const filteredNav = NAV_ITEMS.filter(item => {
    if (!item.permission) return true;
    return checkPermission(item.permission).allowed;
  });

  return (
    <aside className="h-screen w-[var(--sidebar-width)] border-r fixed left-0 top-0 bg-[var(--sidebar-bg)] border-[var(--color-border)] z-50 overflow-y-auto transition-transform duration-300">
      <div className="flex flex-col h-full pt-4 pb-8">
        {/* Branding */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white" data-icon="corporate_fare">corporate_fare</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-blue-600 leading-none">Suler EMS</h2>
            <span className="text-label-sm text-secondary">System Portal</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/dashboard" 
                ? "text-sidebar-active-text bg-sidebar-active" 
                : "text-sidebar-text hover:bg-sidebar-hover"
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
          
          {filteredNav.map(item => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "text-sidebar-active-text bg-sidebar-active" 
                  : "text-sidebar-text hover:bg-sidebar-hover"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Footer & User Profile */}
        <div className="px-4 mt-auto border-t border-slate-100 pt-6">
          {user && (
            <div className="mb-6 px-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user.name?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
          )}

          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

