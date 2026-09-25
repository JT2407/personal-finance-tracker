import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Modal with the accessibility & motion rules baked in:
 *  - Focus is moved in on open and restored to the trigger on close.
 *  - Escape closes. Background is inert (no pointer events) while open.
 *  - Modals appear centered and scale from center (unlike popovers which scale
 *    from their trigger) — per the skills.
 *  - Enter animation staggered; exit is subtler (soft fade + tiny translateY).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Escape to close on the window level.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus management: save trigger, move focus in, restore on close.
  useEffect(() => {
    if (open) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]');
      (first ?? panelRef.current)?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      restoreRef.current?.focus?.();
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel — scales from center (modal rule) */}
          <motion.div
            ref={panelRef}
            className={cn(
              'relative z-10 w-full max-w-lg rounded-panel border border-[rgb(var(--border))]',
              'bg-[rgb(var(--surface-raised))] p-6 shadow-card-lg',
              'origin-center',
              className
            )}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 id="modal-title" className="text-display-sm font-semibold tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p className="text-body-sm text-[rgb(var(--text-secondary))]">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-sunken))] hover:text-[rgb(var(--text-primary))] active:scale-[0.97]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-body text-[rgb(var(--text-primary))]">{children}</div>

            {footer && (
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[rgb(var(--border))] pt-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
