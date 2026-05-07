'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  zIndex?: number;
}

export function Modal({ isOpen, onClose, size = 'md', children, zIndex = 1000 }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-[400px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[800px]',
    xl: 'max-w-[1100px]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-6" style={{ zIndex }}>
          {/* Premium Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Premium Modal Surface */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.8 }}
            className={`relative bg-white rounded-[32px] shadow- premium w-full ${sizeClasses[size]} overflow-hidden flex flex-col max-h-[90vh] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)]`}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ModalHeader({ children, onClose, description }: { children: React.ReactNode, onClose?: () => void, description?: string }) {
  return (
    <div className="px-10 py-8 border-b border-slate-50 flex items-start justify-between shrink-0 bg-white">
      <div>
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{children}</h3>
        {description && <p className="text-[13px] font-medium text-slate-400 mt-1">{description}</p>}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-slate-300 hover:text-slate-900 transition-all p-2 rounded-xl hover:bg-slate-50"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-10 py-8 overflow-y-auto custom-scrollbar ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-10 py-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-end gap-4 shrink-0 ${className}`}>
      {children}
    </div>
  );
}
