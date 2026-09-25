import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/forms';
import { TransactionModal } from '@/components/TransactionModal';
import { useDataStore } from '@/store/useDataStore';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import type { Transaction } from '@/types';

const TYPE_BADGE: Record<Transaction['type'], 'accent' | 'danger' | 'gold'> = {
  income: 'accent',
  expense: 'danger',
  transfer: 'gold',
};

export function Transactions() {
  const transactions = useDataStore((s) => s.transactions);
  const accounts = useDataStore((s) => s.accounts);
  const categories = useDataStore((s) => s.categories);
  const deleteTransaction = useDataStore((s) => s.deleteTransaction);
  const [accountFilter, setAccountFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        if (
          accountFilter &&
          t.accountId !== accountFilter &&
          t.fromAccountId !== accountFilter &&
          t.toAccountId !== accountFilter
        )
          return false;
        if (categoryFilter && t.categoryId !== categoryFilter) return false;
        if (typeFilter && t.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, accountFilter, categoryFilter, typeFilter]);

  function accountName(id?: string) {
    return id ? accounts.find((a) => a.id === id)?.name ?? id : '—';
  }
  function catName(id?: string) {
    return id ? categories.find((c) => c.id === id)?.name ?? null : null;
  }

  async function onDelete(t: Transaction) {
    if (!confirm(`Delete this ${t.type}?`)) return;
    try {
      await deleteTransaction(t.id);
      toast.success('Transaction deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-body-sm text-[rgb(var(--text-secondary))]">
          {filtered.length} transaction{filtered.length === 1 ? '' : 's'}
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          New transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </Select>
      </div>


      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[rgb(var(--surface-sunken))] text-[rgb(var(--text-muted))]">
            <ArrowLeftRight className="h-6 w-6" />
          </span>
          <p className="text-body font-medium text-[rgb(var(--text-primary))]">No transactions</p>
          <p className="max-w-sm text-caption text-[rgb(var(--text-muted))]">
            Adjust your filters or create a new transaction.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-[rgb(var(--border))]">
            {filtered.map((t) => {
              const cat = catName(t.categoryId);
              const signClass =
                t.type === 'income'
                  ? 'text-emerald'
                  : t.type === 'expense'
                    ? 'text-rose'
                    : 'text-gold';
              const amount =
                t.type === 'income'
                  ? `+${formatMoney(t.amount)}`
                  : t.type === 'expense'
                    ? `-${formatMoney(t.amount)}`
                    : formatMoney(t.amount);
              return (
                <li key={t.id} className="group flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <Badge tone={TYPE_BADGE[t.type]}>{t.type}</Badge>
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-medium text-[rgb(var(--text-primary))]">
                        {t.description || cat || (t.type === 'transfer' ? 'Transfer' : 'Transaction')}
                      </p>
                      <p className="truncate text-caption text-[rgb(var(--text-muted))]">
                        {formatDate(t.date)}
                        {cat ? ` · ${cat}` : ''}
                        {t.type === 'transfer'
                          ? ` · ${accountName(t.fromAccountId)} → ${accountName(t.toAccountId)}`
                          : t.type === 'income' || t.type === 'expense'
                            ? ` · ${accountName(t.accountId)}`
                            : ''}
                        {t.isReconciled ? ' · reconciled' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className={cn('tabular mr-2 text-body-sm font-semibold', signClass)}>
                      {amount}
                    </span>
                    <IconBtn label="Edit" onClick={() => setEditing(t)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Delete" onClick={() => onDelete(t)} danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <TransactionModal open={creating} onClose={() => setCreating(false)} />
      <TransactionModal open={!!editing} onClose={() => setEditing(null)} editing={editing} />
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
