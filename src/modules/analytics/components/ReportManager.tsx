"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle2, AlertCircle, Loader2, RefreshCcw, History } from 'lucide-react';
import { ReportType, ReportJobModel } from '../domain/analytics.model';

interface ReportManagerProps {
  userId: string;
}

/**
 * Report Manager Component
 * Unified interface for triggering and monitoring enterprise reports.
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
    const interval = setInterval(fetchJobs, 5000); // Poll every 5s for updates
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
        // Triggered successfully
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
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'PROCESSING': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="relative group overflow-hidden p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
      
      <div className="relative flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">On-Demand Reports</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Enterprise Export Infrastructure</p>
          </div>
        </div>
        <button onClick={fetchJobs} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <RefreshCcw className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Report Options */}
      <div className="space-y-3 mb-8">
        {reports.map((report) => (
          <button 
            key={report.type}
            disabled={requesting === report.type}
            onClick={() => requestReport(report.type)}
            className="w-full p-4 flex items-center justify-between rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-blue-500/30 hover:bg-zinc-900 transition-all text-left group/btn disabled:opacity-50"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-400 group-hover/btn:text-white transition-colors">{report.name}</span>
              <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                {requesting === report.type ? 'Initiating...' : 'Ready for export'}
              </span>
            </div>
            {requesting === report.type ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-zinc-700 group-hover/btn:text-blue-400 transition-all" />
            )}
          </button>
        ))}
      </div>

      {/* Recent Jobs History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <History className="w-3.5 h-3.5" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest">Recent Activity</h4>
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {jobs.length === 0 && !loading && (
            <p className="text-[10px] text-zinc-600 italic py-4">No recent exports found.</p>
          )}
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5">
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status)}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[120px]">
                    {job.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[8px] text-zinc-600 font-medium">
                    {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {job.status === 'COMPLETED' && job.downloadUrl && (
                <a 
                  href={job.downloadUrl}
                  download
                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                  title="Download Report"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
              {job.status === 'FAILED' && (
                <div className="p-1.5 text-red-500/50" title={job.error}>
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
          * Reports are retained for 7 days. Large exports are processed in the background.
        </p>
      </div>
    </div>
  );
};
