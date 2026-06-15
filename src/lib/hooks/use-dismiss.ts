'use client';

/**
 * Dismiss helpers for popovers and modals.
 *
 *   useDismiss(ref, onDismiss, isOpen)  — Escape + click-outside.
 *     Use for popovers / dropdowns that have NO portal'd children.
 *     Listens on document mousedown; if the click target is outside `ref`
 *     it fires onDismiss.
 *
 *   useEscapeDismiss(onDismiss, isOpen)  — Escape only.
 *     Use for MODALS. Modals also have portal'd children (Select, Toast,
 *     etc.) whose clicks land outside the modal's DOM subtree. The
 *     mousedown-based outside-click would close the modal as soon as the
 *     user picks an option in a Select. Use this hook + a backdrop
 *     `onClick` handler that checks `e.target === e.currentTarget` so
 *     only clicks on the dimmed area itself close the modal.
 */
import { RefObject, useEffect } from 'react';

export function useDismiss<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onDismiss: () => void,
  isOpen: boolean,
): void {
  useEffect(() => {
    if (!isOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const node = ref.current;
      const target = event.target;
      if (!node || !(target instanceof Node)) return;
      if (!node.contains(target)) onDismiss();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onDismiss, ref]);
}

export function useEscapeDismiss(onDismiss: () => void, isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onDismiss]);
}
