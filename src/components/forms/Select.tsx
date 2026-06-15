"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Portal } from '../common/Portal';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: 'standard' | 'minimal';
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = "Select option...",
  className = "",
  variant = 'standard'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  const openDropdown = useCallback(() => {
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  }, []);

  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openDropdown();
    }
  };

  // Re-measure on scroll so the popup tracks correctly; only close if trigger is off-screen
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (triggerRef.current) {
        const newRect = triggerRef.current.getBoundingClientRect();
        setRect(newRect);
        // Close only if trigger has scrolled completely out of viewport
        if (newRect.bottom < 0 || newRect.top > window.innerHeight) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // Escape-to-close. Click-outside is already handled by the Portal backdrop.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const popupStyle: React.CSSProperties = rect ? {
    top: rect.bottom + 8,
    left: rect.left,
    width: rect.width,
    minWidth: '160px',
    ...(rect.bottom + 250 > window.innerHeight && {
      top: 'auto',
      bottom: window.innerHeight - rect.top + 8,
    })
  } : {};

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleDropdown}
          className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-5 h-[48px] flex items-center justify-between text-[13px] font-bold transition-all outline-none ${
            variant === 'minimal' ? 'h-[32px] bg-transparent border-transparent px-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900' : 
            isOpen ? 'bg-white border-slate-300 ring-4 ring-slate-900/5' : 'hover:border-slate-300'
          }`}
        >
          <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && rect && (
          <Portal>
            {/* Backdrop — z-[200] to sit above modal (z-[100]) */}
            <div 
              className="fixed inset-0 z-[200]" 
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown panel — z-[201] */}
            <div 
              className="fixed z-[201] bg-white border border-slate-200 rounded-[18px] shadow-floating py-2 animate-in zoom-in-95 duration-200 overflow-hidden"
              style={popupStyle}
            >
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className="w-full px-5 py-3 flex items-center justify-between text-[13px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-left group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Portal>
        )}
      </div>
    </div>
  );
};
