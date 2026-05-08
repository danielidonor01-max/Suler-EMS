"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Responsive default state: collapse on small screens
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar: Anchored Operational Rail */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Header: Anchored Command Layer */}
        <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

        {/* Main Workspace: Anchored Content Canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
          <div className="workspace-safe-zone min-h-full flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            
            {/* Infrastructure Footer: Anchored to Workspace Floor */}
            <footer className="py-10 mt-10 border-t border-slate-200/40">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suler Operational OS</span>
                  <div className="flex gap-4">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-500 transition-colors">Registry</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-500 transition-colors">Protocols</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-500 transition-colors">Governance</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/50 rounded-full border border-emerald-100/50">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Systems Nominal</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">v4.2.0-STABLE</span>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
