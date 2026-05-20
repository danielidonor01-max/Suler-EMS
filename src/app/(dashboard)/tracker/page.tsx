import React from 'react';

const mockRequests = [
  {
    id: 'REQ-001',
    type: 'Leave Request',
    date: 'May 20, 2026',
    stage: 'HR Review',
    status: 'Pending',
    approver: 'HR Admin'
  },
  {
    id: 'REQ-002',
    type: 'Payroll Advance',
    date: 'May 18, 2026',
    stage: 'Finance',
    status: 'Approved',
    approver: 'Finance Manager'
  }
];

export default function RequestTrackerPage() {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Request Tracker</h1>
          <p className="text-slate-500 text-[14px] mt-2">Track the status of all your personal requests across the platform.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Request Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Current Stage</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Approver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{req.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-slate-600">{req.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-slate-700">{req.stage}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                        req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-slate-600">{req.approver}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
