'use client';

import React, { useState, useEffect } from 'react';
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
      if (data.success) setDevices(data.data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrustIcon = (level: string) => {
    switch (level) {
      case 'TRUSTED':    return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'DEGRADED':   return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'COMPROMISED': return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:           return <ShieldCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          Hardware Ingestion Status
        </h3>
        <button onClick={fetchDevices} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}
          </div>
        ) : devices.length === 0 ? (
          <div className="py-10 text-center">
            <Wifi className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No hardware devices registered.</p>
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    device.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {device.status === 'ONLINE' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{device.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{device.serialNumber}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1.5 ${
                    device.trustLevel === 'TRUSTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {getTrustIcon(device.trustLevel)}
                    {device.trustLevel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="block text-[8px] text-slate-400 uppercase font-bold mb-0.5">Latency</span>
                  <span className="text-xs font-bold text-slate-900">{device.healthMetrics?.latency || '--'}ms</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="block text-[8px] text-slate-400 uppercase font-bold mb-0.5">Uptime</span>
                  <span className="text-xs font-bold text-slate-900">{device.healthMetrics?.uptime || '--'}%</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="block text-[8px] text-slate-400 uppercase font-bold mb-0.5">Drift</span>
                  <span className={`text-xs font-bold ${Math.abs(device.clockDriftSeconds) > 60 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {device.clockDriftSeconds}s
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Last Seen: {new Date(device.lastSeenAt).toLocaleTimeString()}
                </span>
                <button className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
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
