"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Portal } from '../common/Portal';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${day.toString().padStart(2, '0')} ${MONTHS[month - 1]} ${year}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Calendar view state
  const today = new Date();
  const parsedDate = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(parsedDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate?.getMonth() ?? today.getMonth());

  // Keep view synced when value changes externally
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  }, [value]);

  const openCalendar = () => {
    if (disabled) return;
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to 6 rows if needed
  while (cells.length % 7 !== 0) cells.push(null);

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (day: number) => {
    if (!parsedDate) return false;
    return parsedDate.getFullYear() === viewYear &&
      parsedDate.getMonth() === viewMonth &&
      parsedDate.getDate() === day;
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  // Compute popup position
  const popupStyle: React.CSSProperties = rect ? {
    top: rect.bottom + 8,
    left: rect.left,
    width: Math.max(rect.width, 280),
    minWidth: 280,
    ...(rect.bottom + 340 > window.innerHeight && {
      top: 'auto',
      bottom: window.innerHeight - rect.top + 8,
    }),
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
          onClick={openCalendar}
          disabled={disabled}
          className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-5 h-[48px] flex items-center justify-between text-[13px] font-bold transition-all outline-none ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : isOpen
              ? 'bg-white border-slate-300 ring-4 ring-slate-900/5'
              : 'hover:border-slate-300'
          }`}
        >
          <span className={value ? 'text-slate-900' : 'text-slate-400'}>
            {value ? formatDisplay(value) : placeholder}
          </span>
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {isOpen && rect && (
          <Portal>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[200]"
              onClick={() => setIsOpen(false)}
            />
            {/* Calendar panel */}
            <div
              className="fixed z-[201] bg-white border border-slate-200 rounded-[18px] shadow-floating py-3 animate-in zoom-in-95 duration-200 overflow-hidden"
              style={popupStyle}
            >
              {/* Month/year header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[13px] font-black text-slate-900 tracking-tight">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const sel = isSelected(day);
                  const tod = isToday(day);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`w-full aspect-square flex items-center justify-center rounded-lg text-[12px] font-bold transition-all ${
                        sel
                          ? 'bg-slate-900 text-white shadow-sm'
                          : tod
                          ? 'bg-indigo-50 text-indigo-600 font-black'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 px-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const t = new Date();
                    const mm = String(t.getMonth() + 1).padStart(2, '0');
                    const dd = String(t.getDate()).padStart(2, '0');
                    onChange(`${t.getFullYear()}-${mm}-${dd}`);
                    setIsOpen(false);
                  }}
                  className="flex-1 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-all"
                >
                  Today
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => { onChange(''); setIsOpen(false); }}
                    className="flex-1 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </Portal>
        )}
      </div>
    </div>
  );
};
