import { useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Tabs';
import { BudgetModal } from '@/components/BudgetModal';
import { useDataStore } from '@/store/useDataStore';
import { cn, formatMoney, formatMonth } from '@/lib/utils';
import type { Budget } from '@/types';

/**
 * Budgets view — cards showing per-category monthly limits with live
 * utilization against spend, plus edit/delete controls.
 */
export function Budgets() {
  const budgets = useDataStore((s) => s.budgets);
  const categories = useDataStore((s) => s.categories);
  const deleteBudget = useDataStore((s) => s.deleteBudget);
  const [creating, setCreating] = useState(false);
  const [preset, setPreset] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<Budget | null>(null);

  function catName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? 'Category';
  }

  async function onDelete(b: Budget) {
    if (!confirm('Delete this budget?')) return;
    try {
      await deleteBudget(b.id);
      toast.success('Budget deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete budget');
    }
  }

  const pct = (b: Budget) => (b.limit > 0 ? (b.spent / b.limit) * 100 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-[rgb(var(--text-secondary))]">
          {budgets.length} budget{budgets.length === 1 ? '' : 's'}
        </p>
        <Button onClick={() => { setPreset(undefined); setCreating(true); }}>
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          New budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[rgb(var(--surface-sunken))] text-[rgb(var(--text-muted))]">
            <PiggyBank className="h-6 w-6" />
          </span>
          <p className="text-body font-medium text-[rgb(var(--text-primary))]">No budgets yet</p>
          <p className="max-w-sm text-caption text-[rgb(var(--text-muted))]">
            Set a monthly limit for an expense category to start tracking.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const util = pct(b);
            const tone = b.overLimit ? 'danger' : util > 80 ? 'gold' : 'accent';
            return (
              <Card key={b.id} className="group p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-body font-medium text-[rgb(var(--text-primary))]">
                      {catName(b.categoryId)}
                    </p>
                    <p className="text-caption text-[rgb(var(--text-muted))]">
                      {formatMonth(b.month)}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconBtn label="Edit" onClick={() => setEditing(b)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Delete" onClick={() => onDelete(b)} danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>

                <div className="mb-2 flex items-end justify-between">
                  <span className="tabular font-display text-display-sm font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                    {formatMoney(b.spent)}
                  </span>
                  <span className="tabular text-caption text-[rgb(var(--text-muted))]">
                    of {formatMoney(b.limit)}
                  </span>
                </div>

                <Progress value={util} tone={tone} />

                <div className="mt-2 flex items-center justify-between">
                  <Badge tone={b.overLimit ? 'danger' : 'default'}>
                    {b.overLimit ? 'Over limit' : `${Math.round(util)}% used`}
                  </Badge>
                  <span className={cn('tabular text-caption font-medium', b.remaining < 0 ? 'text-rose' : 'text-[rgb(var(--text-muted))]')}>
                    {b.remaining < 0 ? `${formatMoney(Math.abs(b.remaining))} over` : `${formatMoney(b.remaining)} left`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetModal open={creating} onClose={() => setCreating(false)} presetCategoryId={preset} />
      <BudgetModal open={!!editing} onClose={() => setEditing(null)} editing={editing} />
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-control transition-colors active:scale-[0.97]',
        danger
          ? 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--danger-soft))] hover:text-[rgb(var(--danger))]'
          : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-sunken))] hover:text-[rgb(var(--text-primary))]'
      )}
    >
      {children}
    </button>
  );
}
