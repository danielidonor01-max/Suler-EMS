"use client";

import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Key, 
  Globe, 
  Database,
  Lock,
  UserCheck,
  ChevronRight,
  Activity,
  Zap,
  Save
} from 'lucide-react';

const SETTINGS_TABS = [
  { id: 'general', label: 'General Configuration', icon: Settings },
  { id: 'governance', label: 'Governance & Roles', icon: ShieldCheck },
  { id: 'security', label: 'Security & Auth', icon: Lock },
  { id: 'notifications', label: 'Alert Protocols', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      {/* Executive Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                Root Configuration Active
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              System Configuration
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Manage organizational governance policies, security protocols, and core system parameters.
            </p>
          </div>

          <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md">
            <Save className="w-4 h-4" />
            Persist Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-xl transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-white border border-slate-200 shadow-sm text-slate-900' 
                  : 'text-slate-400 hover:bg-white hover:text-slate-600'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-300'}`} />
              <span className="text-[13px] font-black tracking-tight">{tab.label}</span>
              {activeTab === tab.id && <ChevronRight className="ml-auto w-4 h-4 text-slate-300" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'general' && (
             <div className="space-y-6 animate-in">
                <section className="bg-white p-8 rounded-[24px] border border-slate-200/60 shadow-sm space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                         <Globe className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="text-base font-black text-slate-900 tracking-tight">Organization Profile</h3>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Core Identity Parameters</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Organization Name</label>
                         <input type="text" defaultValue="Suler Operational OS" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Domain</label>
                         <input type="text" defaultValue="ops.suler.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all" />
                      </div>
                   </div>
                </section>

                <section className="bg-white p-8 rounded-[24px] border border-slate-200/60 shadow-sm space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                         <Zap className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="text-base font-black text-slate-900 tracking-tight">Operational Hours</h3>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Timeframe Protocols</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-1">
                         <p className="text-[13px] font-black text-slate-900">Standard Business Week</p>
                         <p className="text-[11px] font-bold text-slate-400">Monday - Friday, 08:00 AM - 05:00 PM</p>
                      </div>
                      <button className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Edit Protocol</button>
                   </div>
                </section>
             </div>
          )}

          {activeTab !== 'general' && (
            <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50/50 rounded-[24px] border-2 border-dashed border-slate-200 animate-in">
               <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-300 mb-6">
                  <Activity className="w-8 h-8" />
               </div>
               <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">Protocol Interface Loading</h3>
               <p className="text-sm font-medium text-slate-400">Fetching sub-system configuration surfaces...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
