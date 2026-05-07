'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Database, 
  Globe, 
  AlertTriangle,
  RefreshCw,
  Clock,
  Lock,
  Server
} from 'lucide-react';

const SystemHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/system/health');
      const data = await res.json();
      if (data.success) {
        setHealthData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch health:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Operational Observability</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Production Infrastructure Hardening • Suler EMS</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            System Healthy
          </span>
          <button onClick={fetchHealth} className="p-2 text-slate-500 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service SLAs */}
        <div className="md:col-span-2 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Operational SLA Metrics
          </h3>
          <div className="space-y-4">
            {healthData?.services.map((svc: any) => (
              <div key={svc.name} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-200 text-sm">{svc.name}</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-500 uppercase font-bold">Latency</span>
                    <span className="text-xs font-bold text-white">{svc.latency}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-500 uppercase font-bold">SLA</span>
                    <span className="text-xs font-bold text-indigo-400">{svc.sla}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure State */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-500" />
              Core Infrastructure
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">PostgreSQL</span>
                <span className="text-xs font-bold text-emerald-400">{healthData?.infrastructure.database}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Redis Cluster</span>
                <span className="text-xs font-bold text-emerald-400">{healthData?.infrastructure.redis}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Asset Storage</span>
                <span className="text-xs font-bold text-amber-400">{healthData?.infrastructure.storage}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              Security Governance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <span className="block text-[8px] text-slate-500 uppercase font-bold mb-1">Active Sessions</span>
                <span className="text-lg font-bold text-white">{healthData?.security.activeSessions}</span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <span className="block text-[8px] text-slate-500 uppercase font-bold mb-1">Blocked IPs</span>
                <span className="text-lg font-bold text-rose-400">{healthData?.security.blockedIPs}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incidents / Alerts */}
      <AnimatePresence>
        {healthData?.incidents.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4"
          >
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            <div>
              <h4 className="text-sm font-bold text-rose-200">Active Service Incident</h4>
              <p className="text-xs text-rose-300 opacity-70">Degraded mode active for Reporting Module.</p>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
            <p className="text-slate-600 text-sm italic font-medium">No active operational incidents recorded in the last 24 hours.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemHealthDashboard;
