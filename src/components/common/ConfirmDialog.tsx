"use client";

/**
 * Shared confirmation dialog. Drop-in replacement for native `confirm()`
 * across the app: same imperative shape via a hook, no UA-styled
 * browser modal.
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: 'Delete leave type?',
 *     message: 'Existing requests using it are kept, but no new requests can choose it.',
 *     confirmLabel: 'Delete',
 *     tone: 'danger',
 *   });
 *   if (!ok) return;
 *
 * Tone palette:
 *   neutral — slate-900 confirm button (default destructive-free flow)
 *   danger  — rose-600 confirm button (delete / withdraw / close)
 *   warning — amber-600 confirm button (open cycle, activate, etc.)
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Modal } from './Modal';

type Tone = 'neutral' | 'danger' | 'warning';

interface ConfirmOptions {
  title:        string;
  message?:     string;
  confirmLabel?: string;
  cancelLabel?:  string;
  tone?:         Tone;
}

type Resolver = (value: boolean) => void;

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback to native confirm so legacy call sites still work during a
    // staged migration. Soft-warn so a missing provider is visible.
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[useConfirm] ConfirmProvider not mounted — falling back to native confirm().');
    }
    return (opts) => Promise.resolve(
      // eslint-disable-next-line no-alert
      typeof window !== 'undefined' && window.confirm(`${opts.title}${opts.message ? `\n\n${opts.message}` : ''}`),
    );
  }
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    setOpen(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
    // Keep options around for the closing animation; reset after.
    setTimeout(() => setOptions(null), 200);
  };

  const tone: Tone = options?.tone ?? 'neutral';
  const confirmClasses =
    tone === 'danger'  ? 'bg-rose-600 hover:bg-rose-700' :
    tone === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
    'bg-slate-900 hover:bg-black';

  const iconBg =
    tone === 'danger'  ? 'bg-rose-50 border-rose-100  text-rose-600' :
    tone === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' :
    'bg-slate-50 border-slate-100 text-slate-500';

  const Icon = tone === 'neutral' ? Info : AlertTriangle;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal isOpen={open} onClose={() => close(false)} title={options?.title ?? 'Confirm'} size="sm">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[13px] text-slate-700 leading-relaxed">
              {options?.message ?? 'Are you sure you want to continue?'}
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => close(false)}
              className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest"
            >
              {options?.cancelLabel ?? 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              autoFocus
              className={`flex-1 h-11 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest ${confirmClasses}`}
            >
              {options?.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
