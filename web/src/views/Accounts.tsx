import { useState } from 'react';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Reveal } from '@/components/Reveal';
import { AccountModal } from '@/components/AccountModal';
import { useDataStore } from '@/store/useDataStore';
import { cn, formatMoney } from '@/lib/utils';
import type { Account, AccountType } from '@/types';

const TYPE_LABEL: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit',
  cash: 'Cash',
};

/**
 * Accounts view — a card grid of accounts with balances, type, activity
 * status and edit/delete actions.
 */
export function Accounts() {
  const accounts = useDataStore((s) => s.accounts);
  const deleteAccount = useDataStore((s) => s.deleteAccount);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  async function onDelete(account: Account) {
    if (!confirm(`Delete "${account.name}"? Transactions tied to it will be hidden.`)) return;
    try {
      await deleteAccount(account.id);
      toast.success('Account deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete account');
    }
  }

  const active = accounts.filter((a) => a.isActive);
  const inactive = accounts.filter((a) => !a.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-[rgb(var(--text-secondary))]">
          {active.length} active account{active.length === 1 ? '' : 's'}
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          New account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[rgb(var(--surface-sunken))] text-[rgb(var(--text-muted))]">
            <Wallet className="h-6 w-6" />
          </span>
          <p className="text-body font-medium text-[rgb(var(--text-primary))]">No accounts yet</p>
          <p className="max-w-sm text-caption text-[rgb(var(--text-muted))]">
            Create your first account to start tracking balances and transactions.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.04}>
              <Card className="group p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid h-10 w-10 place-items-center rounded-full',
                        a.type === 'credit'
                          ? 'bg-[rgb(var(--gold)/0.14)] text-[rgb(var(--gold))]'
                          : 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-ink))]'
                      )}
                    >
                      <Wallet className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div>
                      <p className="text-body font-medium text-[rgb(var(--text-primary))]">{a.name}</p>
                      <Badge tone="neutral">{TYPE_LABEL[a.type]}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconBtn label="Edit" onClick={() => setEditing(a)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Delete" onClick={() => onDelete(a)} danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-caption text-[rgb(var(--text-muted))]">Balance</p>
                    <p
                      className={cn(
                        'tabular font-display text-display-md font-semibold tracking-tight',
                        a.balance < 0 ? 'text-rose' : 'text-[rgb(var(--text-primary))]'
                      )}
                    >
                      {formatMoney(a.balance, a.currency)}
                    </p>
                  </div>
                  <Badge tone="default">{a.currency}</Badge>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}


      {inactive.length > 0 && (
        <div className="space-y-3">
          <p className="text-caption uppercase tracking-wider text-[rgb(var(--text-muted))]">
            Inactive
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactive.map((a) => (
              <Card key={a.id} className="p-5 opacity-60">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[rgb(var(--surface-sunken))] text-[rgb(var(--text-muted))]">
                      <Wallet className="h-5 w-5" />
                    </span>
                    <p className="text-body font-medium text-[rgb(var(--text-primary))]">{a.name}</p>
                  </div>
                  <IconBtn label="Edit" onClick={() => setEditing(a)}>
                    <Pencil className="h-4 w-4" />
                  </IconBtn>
                </div>
                <p className="tabular font-display text-display-md font-semibold tracking-tight text-[rgb(var(--text-primary))]">
                  {formatMoney(a.balance, a.currency)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AccountModal open={creating} onClose={() => setCreating(false)} />
      <AccountModal open={!!editing} onClose={() => setEditing(null)} editing={editing} />
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
