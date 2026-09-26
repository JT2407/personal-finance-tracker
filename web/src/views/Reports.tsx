import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/Reveal';
import { Select } from '@/components/ui/forms';
import { Badge } from '@/components/ui/Badge';
import { useDataStore } from '@/store/useDataStore';
import { cn, formatMoney, todayString } from '@/lib/utils';

const PALETTE = ['#10b981', '#34d399', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6', '#eab308', '#6366f1', '#ec4899'];

function useReportData() {
  const transactions = useDataStore((s) => s.transactions);
  const categories = useDataStore((s) => s.categories);
  const accounts = useDataStore((s) => s.accounts);
  const month = todayString().slice(0, 7);

  const monthly = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense' && t.categoryId) {
        map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
      }
    }
    return [...map.entries()]
      .map(([id, value]) => ({
        id,
        name: categories.find((c) => c.id === id)?.name ?? 'Uncategorized',
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, categories]);

  const totalBalance = accounts.filter((a) => a.isActive).reduce((s, a) => s + a.balance, 0);
  return { month, monthly, byCategory, totalBalance };
}

export function Reports() {
  const data = useReportData();
  const [range, setRange] = useState('all');
  const totalExpense = data.byCategory.reduce((s, c) => s + c.value, 0);
  const breakEven = data.monthly.income > 0 ? (data.monthly.expense / data.monthly.income) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-[rgb(var(--text-secondary))]">Insights for {data.month}</p>
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-40">
          <option value="all">All time</option>
          <option value="month">This month</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Reveal>
          <Card className="p-5">
            <Metric label="Total balance" value={formatMoney(data.totalBalance)} tone={data.totalBalance < 0 ? 'rose' : 'primary'} />
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="p-5">
            <Metric label="Income" value={formatMoney(data.monthly.income)} tone="emerald" />
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="p-5">
            <Metric label="Expense" value={formatMoney(data.monthly.expense)} tone="rose" />
          </Card>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income vs expense */}
        <Reveal>
          <Card className="p-6">
            <h2 className="mb-1 font-display text-body font-semibold">Income vs expense</h2>
            <p className="mb-6 text-caption text-[rgb(var(--text-muted))]">
              {breakEven.toFixed(0)}% of income spent · net{' '}
              <span className={cn('font-medium', data.monthly.net < 0 ? 'text-rose' : 'text-emerald')}>
                {formatMoney(data.monthly.net)}
              </span>
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Income', value: data.monthly.income }, { name: 'Expense', value: data.monthly.expense }]}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} cursor={{ fill: 'rgba(16,185,129,0.06)' }} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Reveal>


        {/* Spending by category donut */}
        <Reveal delay={0.05}>
          <Card className="p-6">
            <h2 className="mb-1 font-display text-body font-semibold">Spending by category</h2>
            <p className="mb-6 text-caption text-[rgb(var(--text-muted))]">
              {data.byCategory.length} expense categor{data.byCategory.length === 1 ? 'y' : 'ies'}
            </p>
            {data.byCategory.length === 0 ? (
              <div className="grid h-56 place-items-center text-caption text-[rgb(var(--text-muted))]">
                No expense data yet
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-4">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.byCategory} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                        {data.byCategory.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-1.5">
                  {data.byCategory.map((c, i) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-caption">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="truncate text-[rgb(var(--text-secondary))]">{c.name}</span>
                      </span>
                      <span className="tabular text-[rgb(var(--text-primary))]">{formatMoney(c.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </Reveal>
      </div>

      {/* Full breakdown table */}
      <Reveal delay={0.08}>
        <Card className="overflow-hidden">
          <div className="border-b border-[rgb(var(--border))] px-6 py-4">
            <h2 className="font-display text-body font-semibold">Category breakdown</h2>
          </div>
          <ul className="divide-y divide-[rgb(var(--border))]">
            {data.byCategory.map((c) => {
              const share = totalExpense > 0 ? (c.value / totalExpense) * 100 : 0;
              return (
                <li key={c.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-[rgb(var(--text-primary))]">{c.name}</p>
                    <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[rgb(var(--border))]">
                      <div className="h-full rounded-full bg-[rgb(var(--accent))]" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone="neutral">{share.toFixed(0)}%</Badge>
                    <span className="tabular w-24 text-right text-body-sm font-medium text-[rgb(var(--text-primary))]">
                      {formatMoney(c.value)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </Reveal>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-caption text-[rgb(var(--text-muted))]">{label}</p>
      <p className={cn('tabular font-display text-display-md font-semibold tracking-tight', tone === 'rose' ? 'text-rose' : tone === 'emerald' ? 'text-emerald' : 'text-[rgb(var(--text-primary))]')}>
        {value}
      </p>
    </div>
  );
}
