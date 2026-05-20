import React from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

export default function MyAttendancePage() {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
          <p className="text-slate-500 text-[14px] mt-2">View your personal biometric check-ins and attendance records.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           <div className="p-6 bg-white border border-slate-200 rounded-[20px] flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Status</p>
                 <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg font-bold text-slate-900">Present (On Time)</span>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clock In</p>
                 <p className="text-lg font-bold text-slate-900">08:00 AM</p>
              </div>
           </div>
           <div className="p-6 bg-white border border-slate-200 rounded-[20px] flex items-center justify-between opacity-50">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Week</p>
                 <p className="text-lg font-bold text-slate-900">100% Attendance</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                 <Calendar className="w-5 h-5" />
              </div>
           </div>
        </div>

        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-center">
           <h3 className="text-sm font-bold text-slate-900">Attendance History</h3>
           <p className="text-[13px] text-slate-500 max-w-[300px] mt-1">Detailed historical attendance data is currently being synced from the biometric system.</p>
        </div>
      </div>
    </div>
  );
}
