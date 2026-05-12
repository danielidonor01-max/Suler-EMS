"use client";

import React, { useState } from 'react';
import {
  Award, Target, TrendingUp, Star, ChevronRight, Plus,
  UserCheck, BarChart3, Zap, CheckCircle2, Clock, ArrowUpRight,
  Medal, Brain, Users, Filter
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const EMPLOYEES = [
  {
    id: 'e001', name: 'Alex Okereke', role: 'Senior Engineer', hub: 'Lagos HQ',
    department: 'Engineering', kpiScore: 94, reviewScore: 4.7, selfScore: 4.5,
    competency: 92, promotionReady: true, status: 'EXCEEDS',
    kpis: [
      { label: 'Delivery Rate', score: 97, target: 90 },
      { label: 'Code Quality', score: 95, target: 85 },
      { label: 'Team Collaboration', score: 90, target: 80 },
      { label: 'Innovation Index', score: 94, target: 75 },
    ]
  },
  {
    id: 'e002', name: 'Sarah Williams', role: 'Product Manager', hub: 'Lagos HQ',
    department: 'Product', kpiScore: 88, reviewScore: 4.3, selfScore: 4.1,
    competency: 85, promotionReady: false, status: 'MEETS',
    kpis: [
      { label: 'Feature Launch Rate', score: 90, target: 85 },
      { label: 'Stakeholder Satisfaction', score: 88, target: 80 },
      { label: 'Backlog Health', score: 82, target: 75 },
      { label: 'Cross-Team Alignment', score: 92, target: 80 },
    ]
  },
  {
    id: 'e003', name: 'David Okafor', role: 'Finance Analyst', hub: 'Abuja Regional',
    department: 'Finance', kpiScore: 76, reviewScore: 3.8, selfScore: 3.9,
    competency: 74, promotionReady: false, status: 'DEVELOPING',
    kpis: [
      { label: 'Report Accuracy', score: 82, target: 90 },
      { label: 'Audit Compliance', score: 79, target: 85 },
      { label: 'Deadline Adherence', score: 68, target: 80 },
      { label: 'Process Efficiency', score: 75, target: 70 },
    ]
  },
  {
    id: 'e004', name: 'Blessing Adeyemi', role: 'HR Specialist', hub: 'Port Harcourt',
    department: 'Human Resources', kpiScore: 91, reviewScore: 4.5, selfScore: 4.6,
    competency: 89, promotionReady: true, status: 'EXCEEDS',
    kpis: [
      { label: 'Onboarding Rate', score: 95, target: 88 },
      { label: 'Retention Score', score: 90, target: 85 },
      { label: 'Policy Compliance', score: 93, target: 90 },
      { label: 'Employee Satisfaction', score: 87, target: 80 },
    ]
  },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  EXCEEDS:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Exceeds' },
  MEETS:      { bg: 'bg-indigo-50',  text: 'text-indigo-700',  label: 'Meets' },
  DEVELOPING: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Developing' },
  BELOW:      { bg: 'bg-rose-50',    text: 'text-rose-700',    label: 'Below Target' },
};

const TABS = ['KPI Scorecards', 'Manager Reviews', 'Competency Matrix', 'Promotion Pipeline'];

// ─── Sub-Components ────────────────────────────────────────────────────────────
const KpiBar = ({ label, score, target }: { label: string; score: number; target: number }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[11px] font-bold">
      <span className="text-slate-500 uppercase tracking-widest">{label}</span>
      <span className={score >= target ? 'text-emerald-600' : 'text-amber-600'}>{score}%</span>
    </div>
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
      {/* Target line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10" style={{ left: `${target}%` }} />
      <div
        className={`h-full rounded-full transition-all duration-700 ${score >= target ? 'bg-emerald-500' : 'bg-amber-400'}`}
        style={{ width: `${score}%` }}
      />
    </div>
    <div className="flex justify-between text-[9px] font-medium text-slate-300 uppercase tracking-widest">
      <span>0</span>
      <span>Target: {target}%</span>
      <span>100</span>
    </div>
  </div>
);

const ScoreRing = ({ score, max = 5, size = 64 }: { score: number; max?: number; size?: number }) => {
  const pct = (score / max) * 100;
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#4f46e5" strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        className="fill-slate-900" style={{ fontSize: 12, fontWeight: 800 }}
      >
        {score.toFixed(1)}
      </text>
    </svg>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<typeof EMPLOYEES[0] | null>(null);
  const [filterHub, setFilterHub] = useState('All');

  const filtered = filterHub === 'All' ? EMPLOYEES : EMPLOYEES.filter(e => e.hub === filterHub);
  const avgKpi = Math.round(EMPLOYEES.reduce((s, e) => s + e.kpiScore, 0) / EMPLOYEES.length);
  const promotionReady = EMPLOYEES.filter(e => e.promotionReady).length;
  const exceeds = EMPLOYEES.filter(e => e.status === 'EXCEEDS').length;

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Award className="w-3 h-3" />
                Performance Intelligence
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Performance Management
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[500px]">
              KPI scorecards, competency ratings, manager reviews, and promotion pipeline intelligence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterHub}
              onChange={e => setFilterHub(e.target.value)}
              className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[12px] font-bold text-slate-700 outline-none"
            >
              <option value="All">All Hubs</option>
              <option value="Lagos HQ">Lagos HQ</option>
              <option value="Abuja Regional">Abuja Regional</option>
              <option value="Port Harcourt">Port Harcourt</option>
            </select>
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md">
              <Plus className="w-4 h-4" />
              New Review Cycle
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Org KPI Average" value={`${avgKpi}%`} trend={{ direction: 'up', value: '3.2%' }} variant="tonal-success" icon={TrendingUp} />
        <MetricCard label="Exceeds Expectations" value={`${exceeds}`} variant="tonal-success" icon={Star} />
        <MetricCard label="Promotion Ready" value={`${promotionReady}`} variant="tonal-info" icon={Medal} />
        <MetricCard label="Review Cycles Open" value="2" variant="tonal-warning" icon={Clock} />
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
              tab === i ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}

      {/* TAB 0: KPI Scorecards */}
      {tab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(emp => {
            const cfg = STATUS_CONFIG[emp.status];
            return (
              <div
                key={emp.id}
                className="bg-white rounded-[24px] border border-slate-200 p-6 space-y-5 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelected(emp)}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{emp.role}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    {emp.promotionReady && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-bold uppercase">
                        Promotion Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-center">
                    <div className="text-3xl font-black text-slate-900 tracking-tighter">{emp.kpiScore}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">KPI Score</div>
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                  <div className="text-center">
                    <div className="text-xl font-black text-indigo-600">{emp.reviewScore}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manager</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-slate-700">{emp.selfScore}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Self</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-emerald-600">{emp.competency}%</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Competency</div>
                  </div>
                </div>

                {/* KPI bars */}
                <div className="space-y-3">
                  {emp.kpis.map(k => <KpiBar key={k.label} {...k} />)}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  View Full Review <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 1: Manager Reviews */}
      {tab === 1 && (
        <div className="space-y-4">
          {filtered.map(emp => {
            const cfg = STATUS_CONFIG[emp.status];
            return (
              <div key={emp.id} className="bg-white rounded-[20px] border border-slate-200 p-6 flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400 shrink-0">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-slate-900 mb-0.5">{emp.name}</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{emp.role} · {emp.hub}</div>
                </div>
                <div className="text-center px-6">
                  <ScoreRing score={emp.reviewScore} />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manager</div>
                </div>
                <div className="text-center px-6">
                  <ScoreRing score={emp.selfScore} />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Self</div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
                <button className="px-5 h-10 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-wide">
                  Review
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Competency Matrix */}
      {tab === 2 && (
        <div className="bg-white rounded-[24px] border border-slate-200 p-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pr-6">Employee</th>
                <th className="text-center pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Technical</th>
                <th className="text-center pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Leadership</th>
                <th className="text-center pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Communication</th>
                <th className="text-center pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Innovation</th>
                <th className="text-center pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(emp => {
                const scores = [
                  Math.round(emp.competency * 1.02),
                  Math.round(emp.competency * 0.92),
                  Math.round(emp.competency * 0.98),
                  Math.round(emp.competency * 0.95),
                ];
                const getColor = (v: number) =>
                  v >= 90 ? 'text-emerald-600 bg-emerald-50' :
                  v >= 75 ? 'text-indigo-600 bg-indigo-50' :
                  'text-amber-600 bg-amber-50';
                return (
                  <tr key={emp.id}>
                    <td className="py-4 pr-6">
                      <div className="text-[13px] font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.department}</div>
                    </td>
                    {scores.map((s, i) => (
                      <td key={i} className="py-4 px-3 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-[12px] font-black ${getColor(Math.min(s, 100))}`}>
                          {Math.min(s, 100)}%
                        </span>
                      </td>
                    ))}
                    <td className="py-4 px-3 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[13px] font-black ${getColor(emp.competency)}`}>
                        {emp.competency}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Promotion Pipeline */}
      {tab === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-6 mb-6">
            {[
              { label: 'Nominated', count: 4, color: 'border-l-indigo-500' },
              { label: 'Under Review', count: 2, color: 'border-l-amber-400' },
              { label: 'Approved', count: 1, color: 'border-l-emerald-500' },
            ].map(col => (
              <div key={col.label} className={`bg-white rounded-[20px] border border-slate-200 border-l-4 ${col.color} p-6`}>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{col.count}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{col.label}</div>
              </div>
            ))}
          </div>

          {filtered.filter(e => e.promotionReady).map(emp => (
            <div key={emp.id} className="bg-white rounded-[20px] border border-slate-200 p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Medal className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-slate-900">{emp.name}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{emp.role} → Senior {emp.role}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-black text-slate-900">{emp.kpiScore}%</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">KPI</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-indigo-600">{emp.reviewScore}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rating</div>
                </div>
              </div>
              <button className="px-5 h-10 bg-amber-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-amber-600 transition-all">
                Approve
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
