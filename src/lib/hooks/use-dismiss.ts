'use client';

/**
 * useDismiss — close-on-Escape + click-outside hook.
 *
 * Pass a ref to the dismissible element, the `isOpen` state, and the
 * `onDismiss` callback. While open, the hook attaches a document-level
 * mousedown + keydown listener that calls `onDismiss` when the user
 * clicks anywhere outside the element OR hits Escape.
 *
 * Use for header dropdowns, profile menus, modals built without the
 * shared Modal component, etc. Idempotent across re-renders.
 *
 * @example
 *   const ref = useRef<HTMLDivElement>(null);
 *   const [open, setOpen] = useState(false);
 *   useDismiss(ref, () => setOpen(false), open);
 *   return <div ref={ref}>…</div>;
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
