import { useState } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CategoryModal } from '@/components/CategoryModal';
import { useDataStore } from '@/store/useDataStore';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * Categories view — grouped by type with editable details and usage counts.
 */
export function Categories() {
  const categories = useDataStore((s) => s.categories);
  const transactions = useDataStore((s) => s.transactions);
  const deleteCategory = useDataStore((s) => s.deleteCategory);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  function usageCount(id: string) {
    return transactions.filter((t) => t.categoryId === id).length;
  }

  async function onDelete(c: Category) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await deleteCategory(c.id);
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete category');
    }
  }

  const groups: Array<{ type: Category['type']; label: string }> = [
    { type: 'expense', label: 'Expense' },
    { type: 'income', label: 'Income' },
    { type: 'transfer', label: 'Transfer' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-[rgb(var(--text-secondary))]">
          {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          New category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[rgb(var(--surface-sunken))] text-[rgb(var(--text-muted))]">
            <Tags className="h-6 w-6" />
          </span>
          <p className="text-body font-medium text-[rgb(var(--text-primary))]">No categories yet</p>
          <p className="max-w-sm text-caption text-[rgb(var(--text-muted))]">
            Categories help you group and budget your transactions.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {groups.map((group) => {
            const items = categories.filter((c) => c.type === group.type);
            if (items.length === 0) return null;
            return (
              <Card key={group.type} className="p-3">
                <p className="px-2 pb-2 pt-1 text-caption uppercase tracking-wider text-[rgb(var(--text-muted))]">
                  {group.label} · {items.length}
                </p>
                <ul className="space-y-0.5">
                  {items.map((c) => (
                    <li key={c.id} className="group flex items-center gap-2 rounded-control px-2 py-2 hover:bg-[rgb(var(--surface-sunken))]">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--accent))]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-sm font-medium text-[rgb(var(--text-primary))]">
                          {c.name}
                        </p>
                        <p className="text-caption text-[rgb(var(--text-muted))]">
                          {usageCount(c.id)} {usageCount(c.id) === 1 ? 'transaction' : 'transactions'}
                        </p>
                      </div>
                      {c.parentId && <Badge tone="neutral">child</Badge>}
                      <div className="flex gap-0.5">
                        <IconBtn label="Edit" onClick={() => setEditing(c)}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Delete" onClick={() => onDelete(c)} danger>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <CategoryModal open={creating} onClose={() => setCreating(false)} />
      <CategoryModal open={!!editing} onClose={() => setEditing(null)} editing={editing} />
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
