"use client";

import React, { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Activity, Clock, User, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Audit-Aware Activity Feed
 * Displays real-time system events and workflow transitions.
 */
export function ActivityFeed() {
  const { notifications } = useRealtime();
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch of system events (audit log)
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const result = await res.json();
        if (result.success) {
          setActivities(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch activity');
      }
    };
    fetchEvents();
  }, []);

  // Update feed with new notifications that are of category 'WORKFLOW' or 'SECURITY'
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (['WORKFLOW', 'SECURITY'].includes(latest.category)) {
        setActivities(prev => [latest, ...prev.slice(0, 19)]);
      }
    }
  }, [notifications]);

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Operational Activity</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Real-time Audit Log</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
            <p className="text-sm text-zinc-500">No recent activity detected.</p>
          </div>
        ) : (
          activities.map((activity, idx) => (
            <div key={activity.id || idx} className="p-4 hover:bg-white/[0.02] transition-colors group">
              <div className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                    activity.type === 'SECURITY' ? 'bg-red-500/20 text-red-400' : 
                    activity.type === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  {idx !== activities.length - 1 && (
                    <div className="w-[1px] flex-1 bg-white/5 my-2" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">
                      {activity.category || 'SYSTEM'}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.createdAt || activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-zinc-300 font-medium mb-1">
                    {activity.title || activity.description || 'System Event'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <User className="w-3 h-3" />
                    <span>{activity.actorName || 'System'}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-700" />
                    <span className="truncate">{activity.message || activity.type}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-zinc-950/30 border-t border-white/5 text-center">
        <button className="text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-400 transition-colors">
          View Full Audit Trail
        </button>
      </div>
    </div>
  );
}
