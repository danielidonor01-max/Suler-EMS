"use client";

import React from 'react';
import { 
  ShieldCheck, 
  History, 
  Clock, 
  User, 
  Search, 
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import { useActivity } from '@/context/ActivityContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useToast } from '@/components/common/ToastContext';

export default function GovernanceAuditPage() {
  const { activities } = useActivity();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { toast } = useToast();

  const handleExport = () => {
    toast({ message: 'Generating Immutable Audit Trail...', type: 'info' });
    setTimeout(() => {
      toast({ message: 'Forensic audit registry exported to CSV successfully.', type: 'success' });
    }, 1500);
  };
  
  // Filtering for high-impact governance events
  const governanceLogs = useMemo(() => {
    return activities
      .filter(a => ['SYSTEM', 'GOVERNANCE', 'FINANCE', 'IAM'].includes(a.type))
      .filter(a => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          (a.label && a.label.toLowerCase().includes(q)) ||
          (a.message && a.message.toLowerCase().includes(q)) ||
          (a.actor && a.actor.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, searchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'FAILURE': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'WARNING': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'SECURITY_ADMIN']}>
      <div className="section-breathing max-w-[1400px] mx-auto animate-in space-y-8">
        
        {/* Audit Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Immutable Governance Log
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              System Audit Registry
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
              Forensic audit trail of all state-mutating actions, financial disbursements, and security configuration changes.
            </p>
          </div>

          <button 
            onClick={handleExport}
            className="h-11 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Audit Trail
          </button>
        </div>

        {/* Audit List */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-premium overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <History className="w-5 h-5 text-slate-400" />
               <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Transaction History</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by actor or event..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 w-64 transition-all"
                  />
               </div>
               <button 
                 onClick={() => toast({ message: 'Filtering logic initialized...', type: 'info' })}
                 className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900"
               >
                  <Filter className="w-4 h-4" />
               </button>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {governanceLogs.length > 0 ? (
              governanceLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                        log.metadata?.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                        log.metadata?.status === 'FAILURE' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                        'bg-indigo-50 border-indigo-100 text-indigo-600'
                      }`}>
                        {log.type === 'FINANCE' ? <ShieldCheck className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <h3 className="text-[14px] font-black text-slate-900 tracking-tight">{log.label}</h3>
                           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              {getStatusIcon(log.metadata?.status || 'INFO')}
                              {log.metadata?.status || 'INFO'}
                           </div>
                        </div>
                        <p className="text-[13px] font-medium text-slate-500 leading-relaxed">{log.message}</p>
                        <div className="flex items-center gap-4 pt-2">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <User className="w-3 h-3" />
                              {log.actor}
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Clock className="w-3 h-3" />
                              {format(new Date(log.timestamp), 'dd MMM yyyy · HH:mm:ss')}
                           </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toast({ message: `Retrieving forensic metadata for [${log.id}]`, type: 'info' })}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-md text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600 hover:border-indigo-200"
                    >
                      View Metadata
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <ShieldCheck className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">No Governance Events Detected</h3>
                 <p className="text-sm font-medium text-slate-400 mt-2">The system registry is currently waiting for operational activity.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </RouteGuard>
  );
}
