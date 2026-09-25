import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

/**
 * Button primitive.
 *
 * Design rules encoded:
 *  - `scale(0.97)` on :active for tactile press feedback (never below 0.95).
 *  - Concentric/consistent radius per the shape lock (controls are 8px).
 *  - Keyboard :focus-visible ring, mouse users get none.
 *  - Explicit variants; primary = the single accent, peers stay neutral.
 */
const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-body-sm',
  md: 'h-10 px-4 text-body-sm',
  lg: 'h-12 px-6 text-body',
  icon: 'h-9 w-9',
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-emerald text-white hover:bg-emerald-deep shadow-sm shadow-emerald/20 focus-visible:outline-emerald',
  secondary:
    'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-sunken))]',
  outline:
    'text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] hover:bg-[rgb(var(--surface-sunken))]',
  ghost:
    'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-sunken))]',
  danger:
    'bg-[rgb(var(--danger))] text-white hover:opacity-90 focus-visible:outline-[rgb(var(--danger))]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium',
          'transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out',
          'active:scale-[0.97] disabled:active:scale-100',
          'disabled:opacity-50 disabled:pointer-events-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span
            role="status"
            aria-label="Loading"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
