import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input, Select } from './ui/forms';
import { useDataStore } from '@/store/useDataStore';
import type { Category, CategoryType } from '@/types';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  editing?: Category | null;
}

const TYPES: CategoryType[] = ['income', 'expense', 'transfer'];

/**
 * Add / edit category modal.
 */
export function CategoryModal({ open, onClose, editing }: CategoryModalProps) {
  const categories = useDataStore((s) => s.categories);
  const createCategory = useDataStore((s) => s.createCategory);
  const updateCategory = useDataStore((s) => s.updateCategory);

  const parentOptions = useMemo(
    () => categories.filter((c) => c.isActive && c.id !== editing?.id),
    [categories, editing]
  );

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setType(editing?.type ?? 'expense');
    setParentId(editing?.parentId ?? '');
    setError('');
    setSubmitting(false);
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name');
      return;
    }
    if (parentId === editing?.id) {
      setError('A category cannot be its own parent');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Category> = {
        name: trimmed,
        type,
        parentId: parentId || undefined,
      };
      if (editing) {
        await updateCategory(editing.id, payload);
        toast.success('Category updated');
      } else {
        await createCategory(payload);
        toast.success('Category created');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit category' : 'New category'}
      description="Categories classify transactions and form budget groups."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" isLoading={submitting}>
            {editing ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Name" error={error}>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries"
            aria-invalid={!!error}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as CategoryType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Parent">
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">No parent</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}
