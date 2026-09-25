import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { CommandPalette } from '@/components/CommandPalette';
import { TransactionModal } from '@/components/TransactionModal';
import { useDataStore } from '@/store/useDataStore';
import { useThemeStore, applyInitialTheme } from '@/store/themeStore';
import { Loader2 } from 'lucide-react';

// Route-level code splitting: each view loads on demand, shrinking the initial
// bundle and improving first paint.
const Dashboard = lazy(() => import('@/views/Dashboard').then((m) => ({ default: m.Dashboard })));
const Accounts = lazy(() => import('@/views/Accounts').then((m) => ({ default: m.Accounts })));
const Transactions = lazy(() => import('@/views/Transactions').then((m) => ({ default: m.Transactions })));
const Budgets = lazy(() => import('@/views/Budgets').then((m) => ({ default: m.Budgets })));
const Categories = lazy(() => import('@/views/Categories').then((m) => ({ default: m.Categories })));
const Reports = lazy(() => import('@/views/Reports').then((m) => ({ default: m.Reports })));

const queryClient = new QueryClient();

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Your money at a glance' },
  '/accounts': { title: 'Accounts', subtitle: 'Balances across your holdings' },
  '/transactions': { title: 'Transactions', subtitle: 'Every movement, one ledger' },
  '/budgets': { title: 'Budgets', subtitle: 'Monthly limits, tracked live' },
  '/categories': { title: 'Categories', subtitle: 'Organize your spending' },
  '/reports': { title: 'Reports', subtitle: 'Charts and insights' },
};

function Shell() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [newTxOpen, setNewTxOpen] = useState(false);
  const location = useLocation();
  const meta = TITLES[location.pathname] ?? TITLES['/'];

  // Global ⌘K toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[rgb(var(--surface))]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenCommand={() => setCommandOpen(true)}
          onNewTransaction={() => setNewTxOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--text-muted))]" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNewTransaction={() => {
          setCommandOpen(false);
          setNewTxOpen(true);
        }}
      />
      <TransactionModal open={newTxOpen} onClose={() => setNewTxOpen(false)} />
      <Toaster position="top-center" theme="dark" toastOptions={{ style: { background: '#16181d', color: '#eef0f3', border: '1px solid #2a2e35' } }} />
    </div>
  );
}

export function App() {
  const theme = useThemeStore((s) => s.theme);
  const bootstrap = useDataStore((s) => s.bootstrap);
  const error = useDataStore((s) => s.error);

  // Apply persisted theme on boot.
  useEffect(() => {
    applyInitialTheme(theme);
  }, [theme]);

  // Load all data once.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {error ? (
          <div className="grid h-screen place-items-center bg-[rgb(var(--surface))] px-6">
            <div className="max-w-md rounded-panel border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-8 text-center">
              <h1 className="mb-2 font-display text-display-md font-semibold text-[rgb(var(--text-primary))]">
                Can't reach the backend
              </h1>
              <p className="text-body-sm text-[rgb(var(--text-secondary))]">{error}</p>
              <p className="mt-1 text-caption text-[rgb(var(--text-muted))]">
                Start the server on port 3000, then refresh.
              </p>
            </div>
          </div>
        ) : (
          <Shell />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
