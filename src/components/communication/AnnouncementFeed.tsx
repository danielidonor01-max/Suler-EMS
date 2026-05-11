'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  author: { name: string };
  createdAt: string;
  expiresAt?: string;
  acknowledgments: any[];
}

const AnnouncementFeed: React.FC = () => {
  const { lastCommunication } = useRealtime();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnnouncements(); }, []);

  useEffect(() => {
    if (lastCommunication && lastCommunication.type === 'ANNOUNCEMENT_PUBLISHED') {
      setAnnouncements(prev => [lastCommunication.payload, ...prev]);
    }
  }, [lastCommunication]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/communication/announcements');
      const data = await res.json();
      if (data.success) setAnnouncements(data.data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/communication/announcements/${id}/acknowledge`, { method: 'POST' });
      if (res.ok) {
        setAnnouncements(prev => prev.map(a =>
          a.id === id ? { ...a, acknowledgments: [{ id: 'temp' }] } : a
        ));
      }
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-600" />
          Organizational Broadcasts
        </h3>
        <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
          View Archive
        </button>
      </div>

      {loading ? (
        Array(2).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))
      ) : (
        <AnimatePresence>
          {announcements.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm font-medium">No active announcements</p>
            </div>
          ) : (
            announcements.map((a) => {
              const isUrgent = a.priority === 'URGENT';
              const isAcknowledged = a.acknowledgments.length > 0;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative p-5 rounded-xl border transition-all duration-200 ${
                    isUrgent
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isUrgent && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                        <h4 className={`font-bold text-sm ${isUrgent ? 'text-rose-700' : 'text-slate-900'}`}>
                          {a.title}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{a.content}</p>
                    </div>
                    {isUrgent && (
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-tighter rounded-lg border border-rose-200 shrink-0">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isUrgent ? 'border-rose-100' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        {a.author.name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {!isAcknowledged ? (
                      <button
                        onClick={() => acknowledge(a.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95"
                      >
                        Acknowledge
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" />
                        Acknowledged
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default AnnouncementFeed;
