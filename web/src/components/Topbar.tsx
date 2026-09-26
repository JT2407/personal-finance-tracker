import { Search, Plus, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface TopbarProps {
  /** Title of the current page. */
  title: string;
  subtitle?: string;
  onOpenCommand: () => void;
  onNewTransaction: () => void;
  /** Opens the mobile navigation drawer. */
  onOpenMenu: () => void;
}

/**
 * Top chrome — persistent command palette trigger (⌘K), theme toggle, page
 * title and a primary quick action. Content bleeds, chrome floats above the
 * surface with a hairline border.
 */
export function Topbar({ title, subtitle, onOpenCommand, onNewTransaction, onOpenMenu }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--surface-sunken))] hover:text-[rgb(var(--text-primary))] active:scale-[0.97] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-body font-semibold tracking-tight text-[rgb(var(--text-primary))]">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-caption text-[rgb(var(--text-muted))]">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Command palette trigger */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden items-center gap-2 rounded-control border border-[rgb(var(--border))] px-3 py-2 text-caption text-[rgb(var(--text-muted))] transition-colors duration-150 hover:border-[rgb(var(--border-strong))] hover:text-[rgb(var(--text-secondary))] sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
          <kbd className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />

        <button
          type="button"
          onClick={onNewTransaction}
          className="inline-flex h-9 items-center gap-1.5 rounded-control bg-[rgb(var(--accent))] px-3.5 text-body-sm font-medium text-white shadow-sm shadow-emerald/25 transition-[background-color,transform] duration-150 ease-out hover:bg-emerald-deep active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>
    </header>
  );
}
