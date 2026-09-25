import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

/* ---------- Tabs ---------- */

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Underline tabs — content-bound, accessible (each is a button), with a
 * sliding accent indicator. Keyboard arrows could be added; these use native
 * buttons so Tab/Enter work out of the box (native elements first).
 */
export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-1 border-b border-[rgb(var(--border))]', className)}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative inline-flex items-center gap-1.5 px-3 py-2.5 text-body-sm font-medium transition-colors',
              isActive
                ? 'text-[rgb(var(--text-primary))]'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'
            )}
          >
            {item.icon}
            {item.label}
            <span
              className={cn(
                'absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[rgb(var(--accent))] transition-all',
                isActive ? 'opacity-100' : 'opacity-0'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Progress ---------- */

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  tone?: 'accent' | 'danger' | 'gold';
}

/**
 * Slim progress bar. Used for budget utilization and allocation visualizations.
 * Only animates `transform`/width (GPU-friendly) and uses ease-out.
 */
export function Progress({ value, className, tone = 'accent' }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const toneClass =
    tone === 'danger'
      ? 'bg-[rgb(var(--danger))]'
      : tone === 'gold'
        ? 'bg-[rgb(var(--gold))]'
        : 'bg-[rgb(var(--accent))]';
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--border))]', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', toneClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
