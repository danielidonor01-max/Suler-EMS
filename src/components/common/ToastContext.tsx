"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  RotateCcw,
  Loader2
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: any;
  };
}

interface ToastContextType {
  toast: (config: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((config: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Deduplication: Don't add if the same message exists recently
    setToasts(prev => {
      const exists = prev.find(t => t.message === config.message);
      if (exists) return prev;
      return [...prev, { ...config, id }];
    });

    if (config.type !== 'loading') {
      setTimeout(() => removeToast(id), 5000);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast, onRemove: () => void }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-indigo-500" />,
    loading: <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
  };

  const bgStyles = {
    success: 'bg-white border-emerald-100 shadow-emerald-500/5',
    error: 'bg-white border-rose-100 shadow-rose-500/5',
    info: 'bg-white border-indigo-100 shadow-indigo-500/5',
    loading: 'bg-white border-slate-100 shadow-slate-500/5'
  };

  return (
    <div className={`flex items-start gap-4 p-5 rounded-[24px] border shadow-floating min-w-[340px] max-w-[420px] ${bgStyles[toast.type]}`}>
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 space-y-1 pr-6">
        <p className="text-[14px] font-black text-slate-900 tracking-tight leading-none">
          {toast.message}
        </p>
        {toast.description && (
          <p className="text-[12px] font-medium text-slate-400 leading-relaxed">
            {toast.description}
          </p>
        )}
        
        {toast.action && (
          <button 
            onClick={() => {
              toast.action?.onClick();
              onRemove();
            }}
            className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all"
          >
            {toast.action.icon && <toast.action.icon className="w-3 h-3" />}
            {toast.action.label}
          </button>
        )}
      </div>
      <button 
        onClick={onRemove}
        className="text-slate-300 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
