import React, { useEffect } from 'react';

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

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[400px]',
    md: 'max-w-[520px]',
    lg: 'max-w-[800px]',
    xl: 'max-w-[1000px]'
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Content */}
      <div 
        className={`relative bg-surface rounded-xl shadow-3 w-full ${sizeClasses[size]} overflow-hidden flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, onClose }: { children: React.ReactNode, onClose?: () => void }) {
  return (
    <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-bg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-6 overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-6 py-4 border-t border-border bg-surface flex items-center justify-end gap-3 shrink-0 ${className}`}>
      {children}
    </div>
  );
}
