"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Download, RefreshCcw, BrainCircuit, TrendingUp, Activity,
  ShieldCheck, Target, Users, Zap, AlertTriangle,
} from 'lucide-react';
// Recharts is ~150KB gzipped. OperationalTrends is the only consumer on
// this page, and it sits below the fold — dynamic-importing keeps the
// chart library off the initial page bundle and out of first paint.
// ssr: false because the chart's ResponsiveContainer measures the DOM
// on mount; server-rendering it wastes bytes for a placeholder we'd
// replace anyway.
import { TrendsPoint } from '@/components/analytics/OperationalTrends';
const OperationalTrends = dynamic<{ data: TrendsPoint[] }>(
  () => import('@/components/analytics/OperationalTrends').then(m => m.OperationalTrends),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] w-full flex items-center justify-center text-[12px] text-slate-400">
        Loading chart…
      </div>
    ),
  },
);
import { WorkflowBottlenecks } from '@/components/analytics/WorkflowBottlenecks';
import { OperationalInsights } from '@/components/analytics/OperationalInsights';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useApi } from '@/lib/api/use-api';
import type { WorkflowBottleneck, OperationalInsight, KPIMetric } from '@/modules/analytics/domain/analytics.model';

interface KPIAchievementRow {
  id: string;
  title: string;
  achievementPct: number;
  target: number;
  unit: string | null;
  latestValue: number | null;
}

interface DashboardSnapshot {
  workforce:       Record<string, KPIMetric>;
  attendance:      { compliance: KPIMetric };
  bottlenecks:     WorkflowBottleneck[];
  trends:          TrendsPoint[];
  kpiAchievement:  KPIAchievementRow[];
  insights:        OperationalInsight[];
  computedAt:      string;
  userId:          string;
}

export default function AnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const { data, refresh } = useApi<DashboardSnapshot>(
    '/api/analytics/dashboard',
    { pollMs: 5 * 60_000 }, // 5 min — snapshot itself is cached for 1h server-side
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // ?refresh=true bypasses the 1h snapshot cache. Useful when an
      // executive wants live numbers (e.g. immediately after a big
      // attendance fix).
      await fetch('/api/analytics/dashboard?refresh=true');
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const workforce       = data?.workforce       ?? {};
  const compliance      = data?.attendance.compliance;
  const bottlenecks     = data?.bottlenecks     ?? [];
  const trends          = data?.trends          ?? [];
  const kpiAchievement  = data?.kpiAchievement  ?? [];
  const insights        = data?.insights        ?? [];

  const headcount       = workforce.headcount?.value ?? '—';
  const utilization     = workforce.utilization?.value ?? '—';
  const utilizationUnit = workforce.utilization?.unit ?? '';
  const complianceValue = compliance?.value ?? '—';
  const complianceUnit  = compliance?.unit ?? '';

  // "Process velocity" — the org-wide mean approval lead time. Pull it
  // from the bottlenecks payload (already per-department), weighted by
  // pending count. Falls back to a flat mean when no pending rows exist.
  const processVelocityHours = (() => {
    if (bottlenecks.length === 0) return null;
    const weightedTotal = bottlenecks.reduce((s, b) => s + b.averageApprovalHours * Math.max(b.pendingCount, 1), 0);
    const weights = bottlenecks.reduce((s, b) => s + Math.max(b.pendingCount, 1), 0);
    return weights > 0 ? parseFloat((weightedTotal / weights).toFixed(1)) : null;
  })();

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-premium relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <BrainCircuit className="w-3 h-3" />
                Operational Intelligence
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Analytics
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
              Workforce, attendance, and approval workflow signals — derived from live transactional data, snapshot-cached hourly.
            </p>
            {data?.computedAt && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                Last computed: {new Intl.DateTimeFormat('en-NG', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                }).format(new Date(data.computedAt))}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 flex items-center gap-2 px-5 py-3 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-60"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link
              href="/reports"
              className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-5 py-3 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              Generate Report
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          label="Active Headcount"
          value={`${headcount}`}
          icon={Users}
          variant="tonal-info"
        />
        <MetricCard
          label="7-Day Attendance"
          value={`${utilization}${utilizationUnit}`}
          icon={ShieldCheck}
          variant={typeof utilization === 'number' && utilization < 70 ? 'tonal-warning' : 'tonal-success'}
        />
        <MetricCard
          label="Today's Compliance"
          value={`${complianceValue}${complianceUnit}`}
          icon={Activity}
          variant={
            compliance?.status === 'CRITICAL' ? 'tonal-warning'
            : compliance?.status === 'WARNING' ? 'tonal-warning'
            : 'tonal-success'
          }
        />
        <MetricCard
          label="Avg Approval Time"
          value={processVelocityHours != null ? `${processVelocityHours}h` : '—'}
          icon={Zap}
          variant={
            processVelocityHours == null ? 'tonal-info'
            : processVelocityHours >= 24 ? 'tonal-warning'
            : processVelocityHours >= 12 ? 'tonal-warning'
            : 'tonal-success'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">

          <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-premium">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Operational Trends — 7 Days</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                    Attendance & leave-approval throughput
                  </p>
                </div>
              </div>
            </div>
            <OperationalTrends data={trends} />
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-premium">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">KPI Achievement</h3>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                  Latest measurement vs target across active KPIs
                </p>
              </div>
            </div>

            {kpiAchievement.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-slate-400">
                No active KPIs yet. Create some on /performance/kpis.
              </div>
            ) : (
              <div className="space-y-5">
                {kpiAchievement.map(k => {
                  const onTrack = k.achievementPct >= 100;
                  const atRisk  = k.achievementPct < 70;
                  return (
                    <div key={k.id} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[12px] font-bold text-slate-700 truncate pr-3">{k.title}</span>
                        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                          {k.latestValue != null ? `${k.latestValue}${k.unit ? ` ${k.unit}` : ''}` : '—'}
                          {' / '}
                          {k.target}{k.unit ? ` ${k.unit}` : ''}
                          {' · '}
                          <span className={onTrack ? 'text-emerald-600' : atRisk ? 'text-rose-600' : 'text-amber-600'}>
                            {k.achievementPct}%
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            onTrack ? 'bg-emerald-500' : atRisk ? 'bg-rose-500' : 'bg-indigo-600'
                          }`}
                          ref={(el) => { if (el) el.style.width = `${Math.min(100, k.achievementPct)}%`; }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-premium">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Workflow Bottlenecks</h3>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                  Department approval performance — last 30 days
                </p>
              </div>
            </div>
            {bottlenecks.length > 0 ? (
              <WorkflowBottlenecks bottlenecks={bottlenecks} />
            ) : (
              <div className="text-center py-8 text-[12px] text-slate-400">
                No workflow activity in the last 30 days.
              </div>
            )}
          </div>

        </div>

        <div className="space-y-10">
          <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-premium">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-slate-400" />
              <h2 className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.2em]">Operational Insights</h2>
            </div>
            <OperationalInsights insights={insights} />
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-premium space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Audit Registry</h2>
            </div>
            <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
              Immutable trail of state-mutating actions, security configuration changes, and workflow transitions.
            </p>
            <Link
              href="/governance"
              className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-[12px] inline-flex items-center justify-center gap-2 hover:bg-black"
            >
              View Audit Registry
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
