import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input, Select } from './ui/forms';
import { useDataStore } from '@/store/useDataStore';
import type { Budget } from '@/types';
import { currentMonth } from '@/lib/utils';

interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
  /** When set with an id, the modal edits that budget; otherwise pre-fills a category. */
  editing?: Budget | null;
  presetCategoryId?: string;
}

/**
 * Add / edit budget modal. `limit` is a positive number; `spent` is always
 * derived by the backend and never taken as input.
 */
export function BudgetModal({ open, onClose, editing, presetCategoryId }: BudgetModalProps) {
  const categories = useDataStore((s) => s.categories);
  const createBudget = useDataStore((s) => s.createBudget);
  const updateBudget = useDataStore((s) => s.updateBudget);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.isActive && c.type === 'expense'),
    [categories]
  );

  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategoryId(editing?.categoryId ?? presetCategoryId ?? '');
    setLimit(editing ? String(editing.limit) : '');
    setMonth(editing?.month ?? currentMonth());
    setError('');
    setSubmitting(false);
  }, [open, editing, presetCategoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(limit);
    if (!limit || !Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive limit');
      return;
    }
    if (!categoryId) {
      setError('Choose a category');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await updateBudget(editing.id, { categoryId, limit: amount, month });
        toast.success('Budget updated');
      } else {
        await createBudget({ categoryId, limit: amount, month });
        toast.success('Budget created');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit budget' : 'New budget'}
      description="A monthly spending limit belongs to a single expense category."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="budget-form" isLoading={submitting}>
            {editing ? 'Save changes' : 'Create budget'}
          </Button>
        </>
      }
    >
      <form id="budget-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Category" error={error}>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select a category</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Monthly limit">
            <Input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </Field>
          <Field label="Month">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
