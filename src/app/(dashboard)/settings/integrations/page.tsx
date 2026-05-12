"use client";

import React, { useState } from 'react';
import {
  Plug, CheckCircle2, XCircle, RefreshCw, Key, Copy,
  Webhook, Zap, Mail, MessageSquare, BarChart3, Database,
  Plus, Trash2, Activity, Globe, Eye, EyeOff
} from 'lucide-react';
import { RouteGuard } from '@/components/common/RouteGuard';

const INTEGRATIONS = [
  { id: 'slack', name: 'Slack', description: 'Send payroll alerts, leave approvals, and governance notifications to Slack channels.', icon: MessageSquare, category: 'Communication', connected: true, lastSync: '2 min ago' },
  { id: 'email', name: 'SMTP Email', description: 'Configure outbound email for system notifications, payslips, and audit alerts.', icon: Mail, category: 'Communication', connected: true, lastSync: '5 min ago' },
  { id: 'analytics', name: 'Google Analytics', description: 'Track platform usage patterns and report generation metrics.', icon: BarChart3, category: 'Analytics', connected: false, lastSync: null },
  { id: 'zapier', name: 'Zapier', description: 'Connect Suler EMS to 5,000+ external apps through automated workflow triggers.', icon: Zap, category: 'Automation', connected: false, lastSync: null },
  { id: 'hrms', name: 'HRMS Export', description: 'Bi-directional sync with external HR management systems via REST API.', icon: Database, category: 'Data', connected: true, lastSync: '1 hour ago' },
  { id: 'webhook', name: 'Custom Webhooks', description: 'Define HTTP endpoints to receive real-time event payloads from Suler EMS.', icon: Webhook, category: 'Developer', connected: false, lastSync: null },
];

const MOCK_API_KEYS = [
  { id: 'KEY-001', name: 'Production API Key', prefix: 'suler_prod_', created: '2026-01-15', lastUsed: '2 min ago', scopes: ['read', 'write'] },
  { id: 'KEY-002', name: 'Analytics Read Key', prefix: 'suler_read_', created: '2026-03-20', lastUsed: '1 day ago', scopes: ['read'] },
];

const MOCK_EVENTS = [
  { event: 'Payroll Cycle Completed', integration: 'Slack', status: 'SUCCESS', time: '2026-05-11T14:00:00Z' },
  { event: 'Leave Request Submitted', integration: 'SMTP Email', status: 'SUCCESS', time: '2026-05-11T13:30:00Z' },
  { event: 'HRMS Sync Failed', integration: 'HRMS Export', status: 'FAILED', time: '2026-05-11T12:00:00Z' },
  { event: 'Employee Onboarded', integration: 'Slack', status: 'SUCCESS', time: '2026-05-11T11:15:00Z' },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [apiKeys, setApiKeys] = useState(MOCK_API_KEYS);
  const [showKey, setShowKey] = useState<string | null>(null);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected, lastSync: i.connected ? null : 'Just now' } : i));
  };

  const categoryColors: Record<string, string> = {
    Communication: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Analytics: 'bg-amber-50 text-amber-600 border-amber-100',
    Automation: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Data: 'bg-slate-50 text-slate-600 border-slate-100',
    Developer: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="section-breathing max-w-[1200px] mx-auto animate-in space-y-8">
        {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 w-fit">
            <Plug className="w-3 h-3" />Integration Hub
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Integrations</h1>
          <p className="text-[13px] font-medium text-slate-400 max-w-[500px] leading-relaxed">
            Connect Suler EMS to external platforms. Manage API keys, webhooks, and data sync protocols.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700">{integrations.filter(i => i.connected).length} Connected</span>
          </div>
          <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md">
            <Plus className="w-4 h-4" />Add Integration
          </button>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map(integration => (
          <div key={integration.id} className={`bg-white rounded-[24px] border p-6 shadow-sm space-y-4 transition-all ${integration.connected ? 'border-slate-200' : 'border-slate-100'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${integration.connected ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <integration.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900">{integration.name}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 ${categoryColors[integration.category] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {integration.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleIntegration(integration.id)}
                className={`relative w-12 h-6 rounded-full transition-all shrink-0 ${integration.connected ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${integration.connected ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-[12px] font-medium text-slate-400 leading-relaxed">{integration.description}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {integration.connected ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600">Connected · {integration.lastSync}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-[11px] font-bold text-slate-400">Not Connected</span>
                </div>
              )}
              {integration.connected && (
                <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700">Configure</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* API Key Management */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Key className="w-5 h-5 text-slate-400" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-900">API Key Management</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Programmatic Access Tokens</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 h-9 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-all">
            <Plus className="w-3.5 h-3.5" />Generate Key
          </button>
        </div>
        {apiKeys.map(key => (
          <div key={key.id} className="p-5 bg-slate-50 rounded-[20px] border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13px] font-bold text-slate-900">{key.name}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Created {key.created} · Last used {key.lastUsed}</p>
              </div>
              <div className="flex items-center gap-2">
                {key.scopes.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-bold uppercase rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="text-[13px] font-mono text-slate-600 flex-1">
                {showKey === key.id ? `${key.prefix}••••••••••••••••••••••••••••` : `${key.prefix}${'•'.repeat(28)}`}
              </span>
              <button onClick={() => setShowKey(showKey === key.id ? null : key.id)} className="text-slate-300 hover:text-slate-600 transition-colors">
                {showKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button className="text-slate-300 hover:text-slate-600 transition-colors"><Copy className="w-4 h-4" /></button>
              <button className="text-slate-300 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Event Log */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Activity className="w-5 h-5 text-slate-400" /></div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Integration Activity Log</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Recent Event Dispatches</p>
          </div>
        </div>
        {MOCK_EVENTS.map((entry, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${entry.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <div>
                <span className="text-[13px] font-bold text-slate-900">{entry.event}</span>
                <span className="text-[11px] text-slate-400 ml-2">→ {entry.integration}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-300">{new Date(entry.time).toLocaleTimeString()}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${entry.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{entry.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </RouteGuard>
  );
}
