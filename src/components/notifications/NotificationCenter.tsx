"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, Shield, Clock, X, CheckCircle2 } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, setNotifications } = useRealtime();
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
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'ACTION': return <Shield className="w-4 h-4 text-indigo-500" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 group ${
          isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
        }`}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 && !isOpen ? 'animate-pulse text-indigo-500' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[1px]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute right-0 mt-4 w-[420px] bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Activity Feed</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Updates</p>
                </div>
                <button 
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Bell className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All caught up</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all hover:bg-white hover:shadow-md hover:shadow-slate-200/50 group relative ${n.status !== 'READ' ? 'bg-indigo-50/30' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                            n.status !== 'READ' ? 'bg-white border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-100'
                          }`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-[13px] font-bold truncate ${n.status !== 'READ' ? 'text-slate-900' : 'text-slate-500'}`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 shrink-0 uppercase tracking-tighter">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 font-medium">
                              {n.message}
                            </p>
                          </div>
                        </div>
                        {n.status !== 'READ' && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                <button className="w-full py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                  View Management Audit
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
