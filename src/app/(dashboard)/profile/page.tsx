import React from 'react';

export default function ProfilePage() {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[20px] flex items-center justify-center text-white text-xl font-bold shadow-premium">
            DI
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daniel Idonor</h1>
            <p className="text-slate-500 text-[14px]">Super Administrator • Suler Global</p>
          </div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-[20px] shadow-sm">
           <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">Personal Details</h2>
           <p className="text-sm text-slate-500">Profile management features are currently being migrated to the unified dashboard.</p>
        </div>
      </div>
    </div>
  );
}
