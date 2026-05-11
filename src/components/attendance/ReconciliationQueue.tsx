'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  History,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface ReconciliationRequest {
  id: string;
  date: string;
  requestedStatus: string;
  originalStatus?: string;
  reason: string;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
    staffId: string;
  };
}

const ReconciliationQueue: React.FC = () => {
  const [requests, setRequests] = useState<ReconciliationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/attendance/reconcile');
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/attendance/reconcile/${id}/approve`, { method: 'PATCH' });
      if (res.ok) setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
          <History className="w-4 h-4 text-amber-500" />
          Reconciliation Queue
        </h3>
        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-tighter rounded-full border border-amber-100">
          {requests.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)
        ) : (
          <AnimatePresence>
            {requests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Queue is empty. No corrections pending.</p>
              </div>
            ) : (
              requests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {req.employee.firstName} {req.employee.lastName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.employee.staffId}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-600">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        {new Date(req.date).toLocaleDateString()}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Correction Date</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Requested Change</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-lg border border-indigo-100">
                        {req.requestedStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 italic">"{req.reason}"</p>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      className="px-4 py-2 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Approve
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ReconciliationQueue;
