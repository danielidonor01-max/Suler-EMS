'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  Activity, 
  RefreshCw,
  Clock,
  Settings
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  trustLevel: string;
  lastSeenAt: string;
  clockDriftSeconds: number;
  healthMetrics?: {
    latency: number;
    uptime: number;
  };
}

const DeviceHealthPanel: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/attendance/devices');
      const data = await res.json();
      if (data.success) {
        setDevices(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrustIcon = (level: string) => {
    switch (level) {
      case 'TRUSTED': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'DEGRADED': return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'COMPROMISED': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default: return <ShieldCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Hardware Ingestion Status
        </h3>
        <button onClick={fetchDevices} className="p-2 text-slate-500 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-slate-800 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          devices.map((device) => (
            <div 
              key={device.id} 
              className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {device.status === 'ONLINE' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{device.name}</h4>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{device.serialNumber}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1.5 ${
                    device.trustLevel === 'TRUSTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {getTrustIcon(device.trustLevel)}
                    {device.trustLevel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-700/30">
                  <span className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Latency</span>
                  <span className="text-xs font-bold text-white">{device.healthMetrics?.latency || '--'}ms</span>
                </div>
                <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-700/30">
                  <span className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Uptime</span>
                  <span className="text-xs font-bold text-white">{device.healthMetrics?.uptime || '--'}%</span>
                </div>
                <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-700/30">
                  <span className="block text-[8px] text-slate-500 uppercase font-bold mb-0.5">Drift</span>
                  <span className={`text-xs font-bold ${Math.abs(device.clockDriftSeconds) > 60 ? 'text-rose-400' : 'text-white'}`}>
                    {device.clockDriftSeconds}s
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-bold uppercase flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Last Seen: {new Date(device.lastSeenAt).toLocaleTimeString()}
                </span>
                <button className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
                  <Settings className="w-3 h-3" />
                  Manage
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeviceHealthPanel;
