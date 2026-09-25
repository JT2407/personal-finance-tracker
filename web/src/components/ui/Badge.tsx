import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type Tone = 'default' | 'accent' | 'danger' | 'gold' | 'neutral';

const tones: Record<Tone, string> = {
  default: 'bg-[rgb(var(--surface-sunken))] text-[rgb(var(--text-secondary))]',
  accent: 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-ink))]',
  danger: 'bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))]',
  gold: 'bg-[rgb(var(--gold)/0.14)] text-[rgb(var(--gold))]',
  neutral: 'bg-transparent text-[rgb(var(--text-muted))]',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/**
 * Small status label. Rounded-full per the shape lock for interactive chips.
 */
export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-medium whitespace-nowrap',
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
