"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle2, AlertCircle, Loader2, RefreshCcw, History, Sparkles } from 'lucide-react';
import { ReportType, ReportJobModel } from '../domain/analytics.model';

interface ReportManagerProps {
  userId: string;
}

/**
 * Report Manager Component
 * Refined for "Premium Operational Workspace" - high contrast, executive feel.
 */
export const ReportManager: React.FC<ReportManagerProps> = ({ userId }) => {
  const [jobs, setJobs] = useState<ReportJobModel[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reports: { name: string; type: ReportType }[] = [
    { name: 'Workforce Composition', type: 'WORKFORCE_COMPOSITION' },
    { name: 'Attendance Compliance', type: 'ATTENDANCE_COMPLIANCE' },
    { name: 'Leave Utilization', type: 'LEAVE_UTILIZATION' },
    { name: 'Workflow Performance', type: 'WORKFLOW_EFFICIENCY' }
  ];

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/analytics/reports?userId=${userId}`);
      const result = await res.json();
      if (result.success) {
        setJobs(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch report jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); 
    return () => clearInterval(interval);
  }, [userId]);

  const requestReport = async (type: ReportType) => {
    setRequesting(type);
    try {
      const res = await fetch('/api/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, format: 'CSV' })
      });
      
      const result = await res.json();
      if (result.success) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to request report');
    } finally {
      setRequesting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-indigo-400" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'PROCESSING': return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full text-slate-300">
      <div className="space-y-4 mb-10">
        {reports.map((report) => (
          <button 
            key={report.type}
            disabled={requesting === report.type}
            onClick={() => requestReport(report.type)}
            className="w-full p-6 flex items-center justify-between rounded-[24px] bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.08] transition-all text-left group/btn disabled:opacity-50"
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-slate-400 group-hover/btn:text-white transition-colors tracking-tight">{report.name}</span>
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1.5">
                {requesting === report.type ? 'Initiating Pipeline...' : 'Ready for Sync'}
              </span>
            </div>
            {requesting === report.type ? (
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-all group-hover/btn:bg-indigo-600 group-hover/btn:text-white">
                <Download className="w-4 h-4" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Recent Jobs History */}
      <div className="space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-500">
            <History className="w-4 h-4" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Execution History</h4>
          </div>
          <button onClick={fetchJobs} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <RefreshCcw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {jobs.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-white/10 rounded-[24px]">
              <FileText className="w-8 h-8 text-white/5 mb-3" />
              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest text-center">No recent activity detected</p>
            </div>
          )}
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  {getStatusIcon(job.status)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-200 truncate max-w-[140px] tracking-tight">
                    {job.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                    {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {job.status === 'COMPLETED' && job.downloadUrl && (
                <a 
                  href={job.downloadUrl}
                  download
                  className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-900/20"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 p-6 rounded-[24px] bg-indigo-500/5 border border-indigo-500/10">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Retention Policy</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
          On-demand datasets are retained for 168 operational hours. Large-scale aggregates are processed in background threads.
        </p>
      </div>
    </div>
  );
};
