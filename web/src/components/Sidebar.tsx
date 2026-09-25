import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Tags,
  BarChart3,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/useDataStore';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

interface SidebarProps {
  compact?: boolean;
}

/**
 * App sidebar — persistent navigation chrome. Uses a "content bleeds, controls
 * float" pattern; the rail is elevated above the surface with its own surface
 * tint. Active state uses the single locked accent with a soft wash.
 */
export function Sidebar({ compact = false }: SidebarProps) {
  const accounts = useDataStore((s) => s.accounts);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))]',
        'transition-[width] duration-200 ease-out',
        compact ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      {/* Brand */}
      <div className={cn('flex h-16 items-center gap-2.5 px-4', compact && 'justify-center px-0')}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-[rgb(var(--accent))] text-white shadow-sm shadow-emerald/30">
          <Wallet className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </div>
        {!compact && (
          <div className="leading-none">
            <div className="font-display text-body font-semibold tracking-tight">Ledger</div>
            <div className="text-micro text-[rgb(var(--text-muted))]">Personal finance</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={compact ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-control px-3 py-2.5 text-body-sm font-medium transition-[background-color,color] duration-150',
                isActive
                  ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-ink))]'
                  : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-sunken))] hover:text-[rgb(var(--text-primary))]',
                compact && 'justify-center px-0'
              )
            }
          >
            <item.icon
              className={cn('h-[18px] w-[18px] shrink-0', compact && 'h-5 w-5')}
              strokeWidth={2}
            />
            {!compact && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Quick action + account count */}
      {!compact && (
        <div className="border-t border-[rgb(var(--border))] p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-micro uppercase tracking-wider text-[rgb(var(--text-muted))]">
              Accounts
            </span>
            <span className="text-micro text-[rgb(var(--text-muted))]">
              {accounts.filter((a) => a.isActive).length}
            </span>
          </div>
          <div className="space-y-1.5">
            {accounts
              .filter((a) => a.isActive)
              .slice(0, 4)
              .map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-control px-2 py-1.5 text-caption text-[rgb(var(--text-secondary))]"
                >
                  <span className="truncate">{a.name}</span>
                  <span className="tabular font-medium text-[rgb(var(--text-primary))]">
                    {a.balance < 0 ? '-' : ''}
                    {Math.abs(a.balance).toLocaleString('en-US', {
                      style: 'currency',
                      currency: a.currency,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-control border border-dashed border-[rgb(var(--border-strong))] p-3 text-micro text-[rgb(var(--text-muted))]">
            <Plus className="h-4 w-4" />
            <span>Create accounts in the Accounts view</span>
          </div>
        </div>
      )}
    </aside>
  );
}
