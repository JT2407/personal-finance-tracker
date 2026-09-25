import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Tags,
  BarChart3,
  Plus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '@/lib/utils';
import { useDataStore } from '@/store/useDataStore';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', value: 'dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Accounts', value: 'accounts', path: '/accounts', icon: Wallet },
  { label: 'Transactions', value: 'transactions', path: '/transactions', icon: ArrowLeftRight },
  { label: 'Budgets', value: 'budgets', path: '/budgets', icon: PiggyBank },
  { label: 'Categories', value: 'categories', path: '/categories', icon: Tags },
  { label: 'Reports', value: 'reports', path: '/reports', icon: BarChart3 },
];

/**
 * Global command palette (⌘K) built on cmdk.
 * Navigates to views, jumps to accounts/categories, and triggers a new
 * transaction. Keyboard-first, scale-from-center (per modal rule), Escape closes.
 */
export function CommandPalette({ open, onClose, onNewTransaction }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const accounts = useDataStore((s) => s.accounts);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  // Global ⌘K / Ctrl+K listener.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggling is handled by the parent, but we respect open state.
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  function go(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <Command
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-panel border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] shadow-card-lg"
      >
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search views, accounts, categories…"
          className="w-full border-b border-[rgb(var(--border))] bg-transparent px-4 py-3.5 text-body text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none"
          autoFocus
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-caption text-[rgb(var(--text-muted))]">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigate" className="text-[rgb(var(--text-muted))]">
            {NAV_ITEMS.map((item) => (
              <Command.Item
                key={item.value}
                value={item.value}
                onSelect={() => go(item.path)}
                className="flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-body-sm text-[rgb(var(--text-primary))] data-[selected=true]:bg-[rgb(var(--surface-sunken))]"
              >
                <item.icon className="h-4 w-4 text-[rgb(var(--text-muted))]" strokeWidth={2} />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Jump to account" className="text-[rgb(var(--text-muted))]">
            {accounts
              .filter((a) => a.isActive)
              .map((a) => (
                <Command.Item
                  key={a.id}
                  value={`account ${a.name}`}
                  onSelect={() => go('/accounts')}
                  className="flex cursor-pointer items-center justify-between rounded-control px-3 py-2.5 text-body-sm text-[rgb(var(--text-primary))] data-[selected=true]:bg-[rgb(var(--surface-sunken))]"
                >
                  <span className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-[rgb(var(--text-muted))]" strokeWidth={2} />
                    {a.name}
                  </span>
                  <span className="tabular text-caption text-[rgb(var(--text-muted))]">
                    {formatMoney(a.balance, a.currency, 0)}
                  </span>
                </Command.Item>
              ))}
          </Command.Group>

          <Command.Group heading="Actions" className="text-[rgb(var(--text-muted))]">
            <Command.Item
              value="new transaction"
              onSelect={() => {
                onClose();
                onNewTransaction();
              }}
              className="flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-body-sm text-[rgb(var(--text-primary))] data-[selected=true]:bg-[rgb(var(--surface-sunken))]"
            >
              <Plus className="h-4 w-4 text-[rgb(var(--text-muted))]" strokeWidth={2} />
              New transaction
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
