import { NotificationCenter } from "../notifications/NotificationCenter";
import { useAccess } from "@/context/AccessContext";
import { LogOut, User as UserIcon, Settings, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Header() {
  const { user } = useAccess();

  return (
    <header className="h-[var(--topbar-height)] bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40 shadow-2xl shrink-0 backdrop-blur-xl">
      {/* LEFT: Page title */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <h2 className="text-lg font-bold text-white tracking-tight m-0 leading-[var(--topbar-height)]">
          Dashboard Control
        </h2>
      </div>

      {/* CENTER: Search */}
      <div className="flex-1 max-w-[400px] mx-8 hidden md:block">
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            type="text"
            placeholder="Search staff, workflows, or logs..."
            className="w-full h-10 bg-zinc-900 border border-white/5 rounded-xl pl-12 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      {/* RIGHT: Notifications + User */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Notifications */}
        <NotificationCenter />

        {/* Divider */}
        <div className="w-[1px] h-6 bg-white/5 mx-2"></div>

        {/* User Account */}
        <div className="flex items-center gap-3 pl-2 group cursor-pointer relative">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
              {user?.name || 'Authorized Personnel'}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              {user?.role?.replace('_', ' ') || 'IDENTITY PENDING'}
            </span>
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
            {user?.name?.split(' ').map(n => n[0]).join('') || '??'}
          </div>

          {/* Action Menu (Partial implementation for UI) */}
          <button 
            onClick={() => signOut()}
            className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-all ml-2"
            title="Secure Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
