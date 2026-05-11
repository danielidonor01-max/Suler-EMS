"use client";

import React, { useState } from 'react';
import {
  Lock, Shield, Eye, Smartphone, Monitor, Globe,
  Plus, Trash2, CheckCircle2, XCircle, AlertTriangle, LogOut, Key
} from 'lucide-react';

const MOCK_SESSIONS = [
  { id: 'S-001', device: 'Chrome on Windows', location: 'Lagos, Nigeria', ip: '197.210.66.12', lastActive: '2026-05-11T14:00:00Z', current: true },
  { id: 'S-002', device: 'Safari on iPhone 15', location: 'Abuja, Nigeria', ip: '197.210.78.44', lastActive: '2026-05-11T10:22:00Z', current: false },
  { id: 'S-003', device: 'Firefox on macOS', location: 'Port Harcourt, Nigeria', ip: '196.220.33.11', lastActive: '2026-05-10T18:45:00Z', current: false },
];

const MOCK_AUDIT = [
  { action: 'Successful Login', user: 'Chinedu Okoro', ip: '197.210.66.12', time: '2026-05-11T14:00:00Z', status: 'SUCCESS' },
  { action: 'Failed Login Attempt', user: 'unknown@test.com', ip: '45.22.101.88', time: '2026-05-11T13:45:00Z', status: 'FAILED' },
  { action: '2FA Verified', user: 'Sarah Williams', ip: '197.210.78.44', time: '2026-05-11T10:22:00Z', status: 'SUCCESS' },
  { action: 'Password Changed', user: 'David Okafor', ip: '196.220.33.11', time: '2026-05-10T18:45:00Z', status: 'SUCCESS' },
];

export default function SecurityPage() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [ipAllowlist, setIpAllowlist] = useState(['197.210.0.0/16', '196.220.0.0/16']);
  const [newIp, setNewIp] = useState('');
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    expiryDays: 90,
  });

  const revokeSession = (id: string) => setSessions(prev => prev.filter(s => s.id !== id));
  const addIp = () => {
    if (newIp.trim()) { setIpAllowlist(prev => [...prev, newIp.trim()]); setNewIp(''); }
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`relative w-12 h-6 rounded-full transition-all ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? 'left-6' : 'left-0.5'}`} />
    </button>
  );

  return (
    <div className="section-breathing max-w-[1200px] mx-auto animate-in space-y-8">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Shield className="w-3 h-3" />Zero Trust Architecture
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Systems Secure</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Security & Authentication</h1>
          <p className="text-[13px] font-medium text-slate-400 max-w-[500px] leading-relaxed">
            Manage access controls, authentication protocols, and session governance.
          </p>
        </div>
        <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md">
          <Lock className="w-4 h-4" />Save Security Policy
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Security Score', value: '94/100', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Shield },
          { label: 'Active Sessions', value: `${sessions.length}`, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: Monitor },
          { label: 'Failed Logins (24h)', value: '1', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: AlertTriangle },
          { label: '2FA Coverage', value: '87%', color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-100', icon: Smartphone },
        ].map(card => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-[20px] p-5 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${card.color} shadow-sm border ${card.border}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              <p className={`text-xl font-black tracking-tighter ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Password Policy */}
        <div className="bg-white rounded-[24px] border border-slate-200 p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Key className="w-5 h-5 text-slate-400" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Password Policy</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Authentication Standards</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[13px] font-bold text-slate-900">Minimum Length</p>
              <p className="text-[11px] text-slate-400">Characters required</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPasswordPolicy(p => ({ ...p, minLength: Math.max(8, p.minLength - 1) }))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-lg flex items-center justify-center hover:bg-slate-100">−</button>
              <span className="text-lg font-black text-slate-900 w-8 text-center">{passwordPolicy.minLength}</span>
              <button onClick={() => setPasswordPolicy(p => ({ ...p, minLength: Math.min(32, p.minLength + 1) }))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-lg flex items-center justify-center hover:bg-slate-100">+</button>
            </div>
          </div>
          {[
            { key: 'requireUppercase', label: 'Require Uppercase Letters', desc: 'At least one A–Z' },
            { key: 'requireNumbers', label: 'Require Numbers', desc: 'At least one 0–9' },
            { key: 'requireSymbols', label: 'Require Special Symbols', desc: 'At least one !@#$%' },
          ].map(rule => (
            <div key={rule.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-[13px] font-bold text-slate-900">{rule.label}</p>
                <p className="text-[11px] text-slate-400">{rule.desc}</p>
              </div>
              <ToggleSwitch checked={!!passwordPolicy[rule.key as keyof typeof passwordPolicy]} onChange={() => setPasswordPolicy(p => ({ ...p, [rule.key]: !p[rule.key as keyof typeof p] }))} />
            </div>
          ))}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[13px] font-bold text-slate-900">Password Expiry</p>
              <p className="text-[11px] text-slate-400">Days until mandatory reset</p>
            </div>
            <select value={passwordPolicy.expiryDays} onChange={(e) => setPasswordPolicy(p => ({ ...p, expiryDays: parseInt(e.target.value) }))} className="bg-white border border-slate-200 rounded-xl px-3 h-10 text-[13px] font-bold text-slate-900 outline-none">
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {/* 2FA */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Smartphone className="w-5 h-5 text-slate-400" /></div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Two-Factor Authentication</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">MFA Protocol</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-slate-900">Enforce 2FA Organization-Wide</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All users must complete MFA on login</p>
              </div>
              <ToggleSwitch checked={twoFAEnabled} onChange={() => setTwoFAEnabled(!twoFAEnabled)} />
            </div>
            {twoFAEnabled && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[12px] font-bold text-emerald-700">2FA enforced. All logins require MFA.</p>
              </div>
            )}
          </div>

          {/* IP Allowlist */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Globe className="w-5 h-5 text-slate-400" /></div>
              <div>
                <h2 className="text-base font-bold text-slate-900">IP Access Control</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Network Allowlist</p>
              </div>
            </div>
            {ipAllowlist.map((ip, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[13px] font-bold text-slate-700 font-mono">{ip}</span>
                <button onClick={() => setIpAllowlist(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="e.g. 197.210.0.0/16" className="flex-1 h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[13px] font-bold font-mono outline-none" onKeyDown={(e) => e.key === 'Enter' && addIp()} />
              <button onClick={addIp} className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Monitor className="w-5 h-5 text-slate-400" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Sessions</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Live Auth Tokens</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-[11px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest">
            <LogOut className="w-4 h-4" />Revoke All Others
          </button>
        </div>
        {sessions.map(session => (
          <div key={session.id} className={`flex items-center justify-between p-4 rounded-[20px] border ${session.current ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.current ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-400'}`}>
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-slate-900">{session.device}</span>
                  {session.current && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full uppercase">Current</span>}
                </div>
                <p className="text-[11px] text-slate-400 font-medium">{session.location} · {session.ip}</p>
              </div>
            </div>
            {!session.current && (
              <button onClick={() => revokeSession(session.id)} className="px-4 h-9 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl text-[11px] font-bold uppercase tracking-wide flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5" />Revoke
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Login Audit */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Eye className="w-5 h-5 text-slate-400" /></div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Login Audit Trail</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Authentication Events (Last 24h)</p>
          </div>
        </div>
        {MOCK_AUDIT.map((entry, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${entry.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="text-[13px] font-bold text-slate-900">{entry.action}</span>
              <span className="text-[11px] text-slate-400">— {entry.user}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-400 font-mono">{entry.ip}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${entry.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{entry.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
