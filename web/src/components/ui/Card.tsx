import { cn } from '@/lib/utils';
import { forwardRef, type HTMLAttributes } from 'react';

/**
 * Card — used only where elevation communicates real hierarchy.
 * Uses the documented concentric radius (`rounded-card` = 16px) and a shadow
 * tinted to the surface hue (never pure black on light surfaces).
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-card border border-[rgb(var(--border))]',
        'bg-[rgb(var(--surface-raised))]',
        'shadow-card',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';
