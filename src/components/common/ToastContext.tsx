"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Loader2, 
  AlertTriangle, 
  RotateCcw, 
  ShieldCheck, 
  X 
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading' | 'info' | 'warning' | 'recovery' | 'governance';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...options, id };
    
    setToasts((prev) => [...prev, newToast]);

    if (options.type !== 'loading' && options.duration !== 0) {
      setTimeout(() => removeToast(id), options.duration || 5000);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-indigo-500" />,
    loading: <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    recovery: <RotateCcw className="w-5 h-5 text-cyan-500" />,
    governance: <ShieldCheck className="w-5 h-5 text-slate-900" />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="pointer-events-auto group relative w-[380px] bg-white border border-slate-200 rounded-[20px] shadow-floating p-4 flex items-start gap-4 overflow-hidden"
    >
      <div className="mt-0.5 shrink-0">
        {icons[toast.type]}
      </div>
      
      <div className="flex-1 space-y-1 pr-6">
        <h4 className="text-[13px] font-bold text-slate-900 leading-tight tracking-tight">
          {toast.message}
        </h4>
        {toast.description && (
          <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>

      <button 
        onClick={onRemove}
        className="absolute top-3 right-3 text-slate-300 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Subtle Progress Bar for non-loading toasts */}
      {toast.type !== 'loading' && (
        <motion.div 
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: (toast.duration || 5000) / 1000, ease: "linear" }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 origin-left"
        />
      )}
    </motion.div>
  );
};
