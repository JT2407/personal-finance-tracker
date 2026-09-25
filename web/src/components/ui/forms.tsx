import { cn } from '@/lib/utils';
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';

/**
 * Minimal styled input. Chrome (label / error) lives in <Field>.
 * Hit area is at least 40px tall; uses the documented input radius (8px).
 */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-control border border-[rgb(var(--border-strong))]',
          'bg-[rgb(var(--surface-raised))] px-3 text-body text-[rgb(var(--text-primary))]',
          'placeholder:text-[rgb(var(--text-muted))] placeholder:font-normal',
          'transition-colors duration-150',
          'hover:border-[rgb(var(--text-muted)/0.6)]',
          'focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent)/0.25)] focus:outline-none',
          'disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

/** Styled native select — keeps keyboard/AT support (native elements first). */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-10 w-full appearance-none rounded-control border border-[rgb(var(--border-strong))]',
          'bg-[rgb(var(--surface-raised))] px-3 pr-9 text-body text-[rgb(var(--text-primary))]',
          'bg-[linear-gradient(45deg,transparent_50%,rgb(var(--text-muted))_50%),linear-gradient(135deg,rgb(var(--text-muted))_50%,transparent_50%)]',
          'bg-[position:calc(100%-20px)_55%,calc(100%-14px)_55%,calc(100%-20px)_55%] bg-[size:6px_6px,6px_6px,0px] bg-no-repeat',
          'transition-colors duration-150 hover:border-[rgb(var(--text-muted)/0.6)]',
          'focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent)/0.25)] focus:outline-none',
          'disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Form field wrapper. Rules encoded:
 *  - Label ABOVE input, error BELOW input.
 *  - Label is a real <label> bound to the control (never a placeholder).
 *  - Errors are marked with aria-describedby wiring in the consuming form and
 *    announced politely.
 */
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-body-sm font-medium text-[rgb(var(--text-secondary))]"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-caption text-[rgb(var(--text-muted))]">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-caption font-medium text-[rgb(var(--danger))]">
          {error}
        </p>
      )}
    </div>
  );
}
