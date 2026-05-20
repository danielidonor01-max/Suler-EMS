import React from 'react';
import { Target, CheckCircle2, Clock } from 'lucide-react';

export default function MyTasksPage() {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-slate-500 text-[14px] mt-2">Manage your assigned duties and approvals.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="p-4 bg-white border border-slate-200 rounded-[16px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <Target className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</p>
                 <p className="text-lg font-bold text-slate-900">0</p>
              </div>
           </div>
           <div className="p-4 bg-white border border-slate-200 rounded-[16px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
                 <p className="text-lg font-bold text-slate-900">0</p>
              </div>
           </div>
           <div className="p-4 bg-white border border-slate-200 rounded-[16px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                 <Clock className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Review</p>
                 <p className="text-lg font-bold text-slate-900">0</p>
              </div>
           </div>
        </div>

        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-center">
           <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
           <p className="text-[13px] text-slate-500 max-w-[300px] mt-1">You have no pending tasks or approvals at the moment.</p>
        </div>
      </div>
    </div>
  );
}
