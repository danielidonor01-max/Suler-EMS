import React from 'react';
import { Activity, Plus } from 'lucide-react';

export default function MyLeavePage() {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Leave Requests</h1>
            <p className="text-slate-500 text-[14px] mt-2">Manage your time off, view balances, and submit new requests.</p>
          </div>
          <button className="bg-slate-900 hover:bg-black text-white px-5 h-[44px] rounded-[12px] text-[11px] font-bold uppercase tracking-widest shadow-premium flex items-center justify-center gap-2">
            <Plus className="w-4 h-4 stroke-[2px]" />
            New Request
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-[20px]">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Annual Leave Balance</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">18 <span className="text-lg font-medium text-slate-500">days</span></p>
           </div>
           <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sick Leave Available</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">10 <span className="text-lg font-medium text-slate-500">days</span></p>
           </div>
           <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Approvals</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
           </div>
        </div>

        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-center mt-6">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Activity className="w-6 h-6" />
           </div>
           <h3 className="text-sm font-bold text-slate-900">No Recent Requests</h3>
           <p className="text-[13px] text-slate-500 max-w-[300px] mt-1">You haven't submitted any leave requests recently. Click "New Request" to apply for time off.</p>
        </div>
      </div>
    </div>
  );
}
