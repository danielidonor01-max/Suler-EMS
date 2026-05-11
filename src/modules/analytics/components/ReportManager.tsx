"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle2, AlertCircle, Loader2, RefreshCcw, History, Sparkles } from 'lucide-react';
import { ReportType, ReportJobModel } from '../domain/analytics.model';

interface ReportManagerProps {
  userId: string;
}

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
      if (result.success) setJobs(result.data);
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
      if (result.success) fetchJobs();
    } catch (err) {
      console.error('Failed to request report');
    } finally {
      setRequesting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
      case 'FAILED':    return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'PROCESSING': return <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />;
      default:          return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Report Request Buttons */}
      <div className="space-y-3 mb-8">
        {reports.map((report) => (
          <button
            key={report.type}
            disabled={requesting === report.type}
            onClick={() => requestReport(report.type)}
            className="w-full p-5 flex items-center justify-between rounded-[24px] bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group disabled:opacity-50 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-indigo-700 transition-colors tracking-tight">
                {report.name}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                {requesting === report.type ? 'Initiating Pipeline...' : 'Ready for Sync'}
              </span>
            </div>
            {requesting === report.type ? (
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 flex items-center justify-center transition-all">
                <Download className="w-4 h-4" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Execution History */}
      <div className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <History className="w-4 h-4" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Execution History</h4>
          </div>
          <button
            onClick={fetchJobs}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCcw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {jobs.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-slate-200 rounded-[24px] bg-slate-50">
              <FileText className="w-8 h-8 text-slate-300 mb-3" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">No recent activity</p>
            </div>
          )}
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {getStatusIcon(job.status)}
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-700 truncate max-w-[140px] tracking-tight">
                    {job.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              {job.status === 'COMPLETED' && job.downloadUrl && (
                <a
                  href={job.downloadUrl}
                  download
                  className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all border border-indigo-100"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Retention Policy */}
      <div className="mt-8 p-5 rounded-[24px] bg-indigo-50 border border-indigo-100">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Retention Policy</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
          On-demand datasets are retained for 168 operational hours. Large-scale aggregates are processed in background threads.
        </p>
      </div>
    </div>
  );
};
