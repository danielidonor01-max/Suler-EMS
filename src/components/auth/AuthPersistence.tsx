"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccess } from '@/context/AccessContext';
import { useToast } from '@/components/common/ToastContext';
import { useActivity } from '@/context/ActivityContext';
import { AlertCircle, Clock, LogOut } from 'lucide-react';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export const AuthPersistence: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userRole } = useAccess();
  const { pushActivity } = useActivity();
  const { toast } = useToast();
  const router = useRouter();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_THRESHOLD);

  const handleLogout = useCallback((reason: string = 'Inactivity') => {
    pushActivity({
      type: 'SECURITY',
      label: 'Session Terminated',
      message: `User session ended due to ${reason}.`,
      author: userRole,
      status: 'SUCCESS'
    });

    localStorage.removeItem('suler_mock_role');
    localStorage.setItem('suler_logout_event', Date.now().toString());
    
    toast({
      type: 'info',
      message: 'Session Expired',
      description: `You have been logged out due to ${reason.toLowerCase()}.`
    });

    router.push('/login');
  }, [userRole, pushActivity, router, toast]);

  // Activity Monitor
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (showWarning) setShowWarning(false);
    };

    events.forEach(e => window.addEventListener(e, handleActivity));
    return () => events.forEach(e => window.removeEventListener(e, handleActivity));
  }, [showWarning]);

  // Timeout Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      const remaining = SESSION_TIMEOUT - elapsed;

      if (remaining <= 0) {
        handleLogout('Inactivity');
      } else if (remaining <= WARNING_THRESHOLD) {
        setShowWarning(true);
        setTimeLeft(Math.floor(remaining / 1000));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, handleLogout]);

  // Cross-Tab Logout
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'suler_logout_event') {
        router.push('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  return (
    <>
      {children}
      
      {showWarning && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 text-white rounded-[32px] p-6 pr-8 border border-white/10 shadow-2xl flex items-center gap-6 min-w-[400px]">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Security Alert</p>
               <h4 className="text-[15px] font-black tracking-tight leading-none">Session Expiring</h4>
               <p className="text-[12px] font-medium text-slate-400 mt-1">
                 Auto-logout in <span className="text-white font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
               </p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setLastActivity(Date.now())}
                 className="px-6 h-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-black uppercase tracking-widest transition-all"
               >
                 Stay Active
               </button>
               <button 
                 onClick={() => handleLogout('User Action')}
                 className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 flex items-center justify-center transition-all"
               >
                 <LogOut className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
