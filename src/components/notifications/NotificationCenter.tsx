"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, Shield, Clock } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';
import { NotificationModel } from '@/modules/notifications/domain/notification.model';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, setNotifications, connectionStatus } = useRealtime();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const result = await res.json();
        if (result.success) {
          setNotifications(result.data);
          setUnreadCount(result.data.filter((n: any) => n.status !== 'READ').length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications');
      }
    };
    fetchNotifications();
  }, [setNotifications]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => n.status !== 'READ').length);
  }, [notifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' as any } : n));
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' as any })));
    } catch (err) {
      console.error('Failed to mark all as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <Check className="w-4 h-4 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'ACTION': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 transition-all group"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-400 animate-pulse' : 'text-zinc-400 group-hover:text-white'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-zinc-900" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <button 
                onClick={markAllAsRead}
                className="text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-400 transition-colors"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Bell className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500">No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 relative group ${n.status !== 'READ' ? 'bg-blue-500/[0.02]' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.status !== 'READ' ? 'bg-blue-500/10' : 'bg-zinc-800'}`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-xs font-semibold truncate ${n.status !== 'READ' ? 'text-white' : 'text-zinc-400'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                    {n.status !== 'READ' && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-zinc-950/50 border-t border-white/5 text-center">
              <button className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-white transition-colors">
                View All Activity
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
