'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  Clock, 
  User, 
  CheckCircle2, 
  ChevronRight,
  ShieldAlert,
  Calendar
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

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (lastCommunication && lastCommunication.type === 'ANNOUNCEMENT_PUBLISHED') {
      setAnnouncements(prev => [lastCommunication.payload, ...prev]);
    }
  }, [lastCommunication]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/communication/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
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
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-400" />
          Organizational Broadcasts
        </h3>
        <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          View Archive
        </button>
      </div>

      {loading ? (
        Array(2).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-slate-800/30 rounded-2xl animate-pulse" />
        ))
      ) : (
        <AnimatePresence>
          {announcements.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
              <p className="text-slate-500 text-sm">No active announcements</p>
            </div>
          ) : (
            announcements.map((a) => {
              const isUrgent = a.priority === 'URGENT';
              const isAcknowledged = a.acknowledgments.length > 0;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                    isUrgent 
                      ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' 
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isUrgent && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                        <h4 className={`font-bold ${isUrgent ? 'text-rose-100' : 'text-white'}`}>
                          {a.title}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {a.content}
                      </p>
                    </div>
                    {isUrgent && (
                      <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-tighter rounded">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                      >
                        Acknowledge
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
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
