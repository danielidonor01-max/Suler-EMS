import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children,
  size = 'md' 
}) => {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        
        // Focus Trap Logic
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        previousFocus.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[480px]',
    md: 'max-w-[640px]',
    lg: 'max-w-[820px]',
    xl: 'max-w-[1024px]'
  };

  return (
    <Portal>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Backdrop with Executive Blur */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
          onClick={onClose}
        />
        
        {/* Modal Surface: Centered Workflow Architecture */}
        <div 
          ref={modalRef}
          className={`w-full ${sizeClasses[size]} bg-white rounded-[24px] shadow-floating relative z-10 flex flex-col max-h-full animate-in zoom-in-95 fade-in duration-300 ease-out`}
        >
          {/* Header Layer */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <h3 id="modal-title" className="text-xl font-black text-slate-900 tracking-tighter leading-none">{title}</h3>
              {subtitle && (
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1.5">{subtitle}</p>
              )}
            </div>
            <button 
              onClick={onClose}
              aria-label="Close modal"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              <X className="w-5 h-5 stroke-[1.5px]" />
            </button>
          </div>

          {/* Content Canvas */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
};
