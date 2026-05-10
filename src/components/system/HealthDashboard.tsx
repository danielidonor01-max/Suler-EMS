'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ShieldCheck,
  Zap,
  Server,
  AlertTriangle,
  RefreshCw,
  Lock
} from 'lucide-react';

const SystemHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/system/health');
      const data = await res.json();
      if (data.success) setHealthData(data.data);
    } catch (err) {
      console.error('Failed to fetch health:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-[24px] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Operational Observability</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Production Infrastructure Hardening • Suler EMS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">
            <ShieldCheck className="w-3 h-3" />
            System Healthy
          </span>
          <button
            onClick={fetchHealth}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service SLAs */}
        <div className="md:col-span-2 bg-white border border-slate-200 p-6 rounded-[24px] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Operational SLA Metrics
          </h3>
          <div className="space-y-3">
            {healthData?.services.map((svc: any) => (
              <div key={svc.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-700 text-sm">{svc.name}</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-400 uppercase font-bold">Latency</span>
                    <span className="text-xs font-bold text-slate-900">{svc.latency}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-400 uppercase font-bold">SLA</span>
                    <span className="text-xs font-bold text-indigo-600">{svc.sla}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure State */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-6 rounded-[24px] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-500" />
              Core Infrastructure
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">PostgreSQL</span>
                <span className="text-xs font-bold text-emerald-600">{healthData?.infrastructure.database}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Redis Cluster</span>
                <span className="text-xs font-bold text-emerald-600">{healthData?.infrastructure.redis}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Asset Storage</span>
                <span className="text-xs font-bold text-amber-600">{healthData?.infrastructure.storage}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-[24px] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              Security Governance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Active Sessions</span>
                <span className="text-lg font-bold text-slate-900">{healthData?.security.activeSessions}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Blocked IPs</span>
                <span className="text-lg font-bold text-rose-600">{healthData?.security.blockedIPs}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incidents / Alerts */}
      <AnimatePresence>
        {healthData?.incidents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-50 border border-rose-200 rounded-[24px] flex items-center gap-4"
          >
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-700">Active Service Incident</h4>
              <p className="text-xs text-rose-500">Degraded mode active for Reporting Module.</p>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm italic font-medium">
              No active operational incidents recorded in the last 24 hours.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemHealthDashboard;
