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
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const result = await res.json();
        if (result.success) setActivities(result.data);
      } catch (err) {
        console.error('Failed to fetch activity');
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (['WORKFLOW', 'SECURITY'].includes(latest.category)) {
        setActivities(prev => [latest, ...prev.slice(0, 19)]);
      }
    }
  }, [notifications]);

  const getActivityColors = (type: string) => {
    switch (type) {
      case 'SECURITY': return 'bg-rose-50 text-rose-600';
      case 'SUCCESS':  return 'bg-emerald-50 text-emerald-600';
      default:         return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Operational Activity</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Real-time Audit Log</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-medium">No recent activity detected.</p>
          </div>
        ) : (
          activities.map((activity, idx) => (
            <div key={activity.id || idx} className="px-5 py-4 hover:bg-slate-50 transition-colors group">
              <div className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActivityColors(activity.type)}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  {idx !== activities.length - 1 && (
                    <div className="w-px flex-1 bg-slate-100 my-2" />
                  )}
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                      {activity.category || 'SYSTEM'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.createdAt || activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 font-medium mb-1">
                    {activity.title || activity.description || 'System Event'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <User className="w-3 h-3" />
                    <span>{activity.actorName || 'System'}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <span className="truncate">{activity.message || activity.type}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 text-center">
        <button className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          View Full Audit Trail
        </button>
      </div>
    </div>
  );
}
