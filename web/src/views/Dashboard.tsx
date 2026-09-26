import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { NumberDisplay, moneyDisplay } from '@/components/ui/NumberDisplay';
import { Reveal } from '@/components/Reveal';
import { Progress } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { useDataStore } from '@/store/useDataStore';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Dashboard — the landing view.
 * Hero net-worth figure (NumberFlow-animated), income/expense stat cards,
 * recent transactions and a compact budget-health list. Empty states guide the
 * user toward creating their first data.
 */
export function Dashboard() {
  const accounts = useDataStore((s) => s.accounts);
  const transactions = useDataStore((s) => s.transactions);
  const budgets = useDataStore((s) => s.budgets);
  const categories = useDataStore((s) => s.categories);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    }
    const net = income - expense;
    return { income, expense, net };
  }, [transactions]);

  const totalBalance = accounts.filter((a) => a.isActive).reduce((s, a) => s + a.balance, 0);
  const recent = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  const budgetPct = (spent: number, limit: number) => (limit > 0 ? (spent / limit) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Reveal>
        <Card className="relative overflow-hidden p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[rgb(var(--accent)/0.08)] blur-3xl"
          />
          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-caption uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">
                <TrendingUp className="h-3.5 w-3.5" />
                Net worth
              </p>
              <NumberDisplay
                value={totalBalance}
                format={moneyDisplay}
                className="font-display text-display-xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-display-2xl"
              />
              <p className="text-body-sm text-[rgb(var(--text-secondary))]">
                Across {accounts.filter((a) => a.isActive).length} active account
                {accounts.filter((a) => a.isActive).length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              <StatPill
                label="Income"
                value={totals.income}
                tone="accent"
                icon={<ArrowUpRight className="h-4 w-4" />}
              />
              <StatPill
                label="Expense"
                value={totals.expense}
                tone="danger"
                icon={<ArrowDownRight className="h-4 w-4" />}
              />
            </div>
          </div>
        </Card>
      </Reveal>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Reveal delay={0.05}>
          <Card className="p-5">
            <StatRow
              icon={<Wallet className="h-4 w-4" />}
              label="Net this period"
              value={totals.net}
              tone={totals.net >= 0 ? 'accent' : 'danger'}
              sub={totals.net >= 0 ? 'Money you kept or lost' : 'Spending above income'}
            />
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="p-5">
            <StatRow
              icon={<ArrowUpRight className="h-4 w-4" />}
              label="Accounts"
              value={accounts.filter((a) => a.isActive).length}
              sub={`${accounts.filter((a) => !a.isActive).length} inactive`}
              isMoney={false}
            />
          </Card>
        </Reveal>
        <Reveal delay={0.15}>
          <Card className="p-5">
            <StatRow
              icon={<TrendingUp className="h-4 w-4" />}
              label="Categories"
              value={categories.length}
              sub={`${budgets.length} active budgets`}
              isMoney={false}
            />
          </Card>
        </Reveal>
      </div>


      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent transactions */}
        <Reveal delay={0.05} className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-4">
              <h2 className="font-display text-body font-semibold">Recent activity</h2>
              <Link
                to="/transactions"
                className="flex items-center gap-1 text-caption font-medium text-[rgb(var(--accent-ink))] hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                body="Add your first transaction to start tracking."
              />
            ) : (
              <ul className="divide-y divide-[rgb(var(--border))]">
                <AnimatePresence initial={false}>
                  {recent.map((t, i) => {
                    const cat = categories.find((c) => c.id === t.categoryId);
                    const signClass =
                      t.type === 'income'
                        ? 'text-emerald'
                        : t.type === 'transfer'
                          ? 'text-gold'
                          : 'text-rose';
                    const amount =
                      t.type === 'income'
                        ? `+${formatMoney(t.amount)}`
                        : t.type === 'expense'
                          ? `-${formatMoney(t.amount)}`
                          : formatMoney(t.amount);
                    return (
                      <motion.li
                        key={t.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="flex items-center justify-between gap-4 px-6 py-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'grid h-9 w-9 shrink-0 place-items-center rounded-full text-micro font-semibold',
                              t.type === 'income'
                                ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-ink))]'
                                : t.type === 'expense'
                                  ? 'bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))]'
                                  : 'bg-[rgb(var(--gold)/0.14)] text-[rgb(var(--gold))]'
                            )}
                          >
                            {t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : '⇄'}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-body-sm font-medium text-[rgb(var(--text-primary))]">
                              {t.description || cat?.name || typeLabel(t.type)}
                            </p>
                            <p className="truncate text-caption text-[rgb(var(--text-muted))]">
                              {cat?.name && t.description ? `${cat.name} · ` : ''}
                              {formatDate(t.date)}
                              {t.type === 'transfer' ? ' · transfer' : ''}
                            </p>
                          </div>
                        </div>
                        <span className={cn('tabular shrink-0 text-body-sm font-medium', signClass)}>
                          {amount}
                        </span>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </Card>
        </Reveal>


        {/* Budget health */}
        <Reveal delay={0.1}>
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-body font-semibold">Budget health</h2>
              <Link
                to="/budgets"
                className="text-caption font-medium text-[rgb(var(--accent-ink))] hover:underline"
              >
                Manage
              </Link>
            </div>
            {budgets.length === 0 ? (
              <EmptyState
                title="No budgets yet"
                body="Set monthly limits to keep spending in check."
              />
            ) : (
              <ul className="space-y-5">
                {budgets.slice(0, 5).map((b) => {
                  const cat = categories.find((c) => c.id === b.categoryId);
                  const pct = budgetPct(b.spent, b.limit);
                  return (
                    <li key={b.id}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-body-sm font-medium text-[rgb(var(--text-primary))]">
                          {cat?.name ?? 'Category'}
                        </span>
                        <span className="tabular text-caption text-[rgb(var(--text-muted))]">
                          {formatMoney(b.spent)} / {formatMoney(b.limit)}
                        </span>
                      </div>
                      <Progress value={pct} tone={pct > 100 ? 'danger' : pct > 80 ? 'gold' : 'accent'} />
                      <div className="mt-1.5 text-right">
                        <Badge tone={b.overLimit ? 'danger' : 'default'}>
                          {b.overLimit ? 'Over limit' : `${Math.round(pct)}% used`}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
}


function StatPill({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: 'accent' | 'danger';
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-control border border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] px-4 py-3">
      <span
        className={cn(
          'grid h-8 w-8 place-items-center rounded-full',
          tone === 'accent'
            ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-ink))]'
            : 'bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))]'
        )}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-caption text-[rgb(var(--text-muted))]">{label}</p>
        <NumberDisplay
          value={value}
          format={moneyDisplay}
          className="tabular text-body font-semibold text-[rgb(var(--text-primary))]"
        />
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  sub,
  tone,
  isMoney = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  tone?: 'accent' | 'danger';
  isMoney?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[rgb(var(--text-muted))]">
        {icon}
        <span className="text-body-sm font-medium">{label}</span>
      </div>
      <p
        className={cn(
          'tabular font-display text-display-md font-semibold tracking-tight',
          tone === 'danger' ? 'text-rose' : 'text-[rgb(var(--text-primary))]'
        )}
      >
        {isMoney ? <NumberDisplay value={value} format={moneyDisplay} /> : value.toLocaleString()}
      </p>
      <p className="text-caption text-[rgb(var(--text-muted))]">{sub}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <p className="text-body-sm font-medium text-[rgb(var(--text-primary))]">{title}</p>
      <p className="max-w-xs text-caption text-[rgb(var(--text-muted))]">{body}</p>
    </div>
  );
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
  };
  return map[type] ?? type;
}
