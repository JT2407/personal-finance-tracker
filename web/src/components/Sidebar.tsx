import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Tags,
  BarChart3,
  X,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/useDataStore';
import { AnimatePresence, motion } from 'motion/react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

interface SidebarProps {
  /** When true, renders as a full mobile slide-in drawer driven by `open`. */
  mobile?: boolean;
  /** Mobile drawer visibility (ignored on desktop). */
  open?: boolean;
  /** Called when the mobile drawer is dismissed. */
  onClose?: () => void;
}

/**
 * App sidebar. On desktop it is the persistent left rail. In `mobile` mode it
 * becomes a full-height slide-in drawer with a backdrop, shown only while
 * `open` — used for navigation on phones/tablets.
 */
export function Sidebar({ mobile = false, open = false, onClose }: SidebarProps) {
  const accounts = useDataStore((s) => s.accounts);

  if (!mobile) {
    // Desktop rail.
    return (
      <aside className="flex h-full w-[248px] flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))]">
        <Brand />
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
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
                    {a.balance.toLocaleString('en-US', {
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
      </aside>
    );
  }

  // Mobile slide-in drawer.
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="absolute inset-y-0 left-0 flex w-[80vw] max-w-[300px] flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] pb-[env(safe-area-inset-bottom)]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-control text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-sunken))] hover:text-[rgb(var(--text-primary))] active:scale-[0.97]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-2">
              {NAV.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}


/**
 * Fixed bottom navigation bar for small screens. Provides thumb-friendly
 * access to the primary routes plus a quick "new transaction" action.
 */
export function MobileNav({ onNewTransaction }: { onNewTransaction: () => void }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex items-center justify-around px-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-[rgb(var(--accent-ink))]'
                  : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'
              )
            }
          >
            <item.icon className="h-5 w-5" strokeWidth={2} />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onNewTransaction}
          aria-label="New transaction"
          className="my-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[rgb(var(--accent))] text-white shadow-sm shadow-emerald/25 transition-[transform] active:scale-[0.95]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.4} />
        </button>
      </div>
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-2.5 px-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-[rgb(var(--accent))] text-white shadow-sm shadow-emerald/30">
        <Wallet className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </div>
      <div className="leading-none">
        <div className="font-display text-body font-semibold tracking-tight">Ledger</div>
        <div className="text-micro text-[rgb(var(--text-muted))]">Personal finance</div>
      </div>
    </div>
  );
}

function NavItem({
  to,
  end,
  label,
  icon: Icon,
}: {
  to: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-control px-3 py-2.5 text-body-sm font-medium transition-[background-color,color] duration-150',
          isActive
            ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-ink))]'
            : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-sunken))] hover:text-[rgb(var(--text-primary))]'
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  );
}
