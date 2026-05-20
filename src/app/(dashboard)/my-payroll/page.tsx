import React from 'react';

export default function MyPayrollPage() {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Payslips</h1>
          <p className="text-slate-500 text-[14px] mt-2">View your personal salary history and download payslips.</p>
        </div>
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-slate-400 text-2xl">💸</span>
           </div>
           <h3 className="text-sm font-bold text-slate-900">Payroll Data Unavailable</h3>
           <p className="text-[13px] text-slate-500 max-w-[300px] mt-1">Personal payroll integration is currently being mapped to your employee record.</p>
        </div>
      </div>
    </div>
  );
}
