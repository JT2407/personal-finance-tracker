import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input, Select } from './ui/forms';
import { useDataStore } from '@/store/useDataStore';
import type { Transaction, TransactionType } from '@/types';
import { todayString } from '@/lib/utils';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, the modal edits this transaction instead of creating a new one. */
  editing?: Transaction | null;
}

interface FormState {
  type: TransactionType;
  accountId: string;
  fromAccountId: string;
  toAccountId: string;
  categoryId: string;
  amount: string;
  date: string;
  description: string;
}

const INITIAL: FormState = {
  type: 'expense',
  accountId: '',
  fromAccountId: '',
  toAccountId: '',
  categoryId: '',
  amount: '',
  date: todayString(),
  description: '',
};

/**
 * Add / edit transaction modal. Supports income, expense and transfer types.
 * Validates before submit, marks errors inline, and toasts outcomes.
 */
export function TransactionModal({ open, onClose, editing }: TransactionModalProps) {
  const accounts = useDataStore((s) => s.accounts);
  const categories = useDataStore((s) => s.categories);
  const addTransaction = useDataStore((s) => s.addTransaction);
  const updateTransaction = useDataStore((s) => s.updateTransaction);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.isActive && c.type === 'expense'),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.isActive && c.type === 'income'),
    [categories]
  );

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset when the modal opens / editing target changes.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        type: editing.type,
        accountId: editing.accountId ?? '',
        fromAccountId: editing.fromAccountId ?? '',
        toAccountId: editing.toAccountId ?? '',
        categoryId: editing.categoryId ?? '',
        amount: String(editing.amount),
        date: editing.date,
        description: editing.description ?? '',
      });
    } else {
      setForm(INITIAL);
    }
    setErrors({});
    setSubmitting(false);
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = 'Enter a positive amount';
    }
    if (!form.date) {
      nextErrors.date = 'Choose a date';
    }

    if (form.type === 'transfer') {
      if (!form.fromAccountId) nextErrors.fromAccountId = 'Required';
      if (!form.toAccountId) nextErrors.toAccountId = 'Required';
      if (form.fromAccountId && form.fromAccountId === form.toAccountId) {
        nextErrors.toAccountId = 'Must differ from source';
      }
    } else {
      if (!form.accountId) nextErrors.accountId = 'Required';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload: Partial<Transaction> = {
        type: form.type,
        amount,
        date: form.date,
        description: form.description.trim() || undefined,
      };
      if (form.type === 'transfer') {
        payload.fromAccountId = form.fromAccountId;
        payload.toAccountId = form.toAccountId;
      } else {
        payload.accountId = form.accountId;
        payload.categoryId = form.categoryId || undefined;
      }

      if (editing) {
        await updateTransaction(editing.id, payload);
        toast.success('Transaction updated');
      } else {
        await addTransaction(payload);
        toast.success('Transaction added');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  }

  const typeDesc = {
    income: 'Money into an account',
    expense: 'Money out of an account',
    transfer: 'Move money between two accounts',
  }[form.type];


  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit transaction' : 'New transaction'}
      description={typeDesc}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="transaction-form" isLoading={submitting}>
            {editing ? 'Save changes' : 'Add transaction'}
          </Button>
        </>
      }
    >
      {/* Type selector */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-control bg-[rgb(var(--surface-sunken))] p-1" role="tablist">
        {(['income', 'expense', 'transfer'] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={form.type === t}
            onClick={() => set('type', t)}
            className={`rounded-[6px] px-3 py-2 text-body-sm font-medium capitalize transition-all duration-150 ${
              form.type === t
                ? 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] shadow-sm'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {form.type === 'transfer' ? (
            <>
              <Field label="From account" error={errors.fromAccountId}>
                <Select
                  value={form.fromAccountId}
                  onChange={(e) => set('fromAccountId', e.target.value)}
                  aria-invalid={!!errors.fromAccountId}
                >
                  <option value="">Select account</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="To account" error={errors.toAccountId}>
                <Select
                  value={form.toAccountId}
                  onChange={(e) => set('toAccountId', e.target.value)}
                  aria-invalid={!!errors.toAccountId}
                >
                  <option value="">Select account</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </Field>
            </>
          ) : (
            <Field label="Account" error={errors.accountId} className="sm:col-span-2">
              <Select
                value={form.accountId}
                onChange={(e) => set('accountId', e.target.value)}
                aria-invalid={!!errors.accountId}
              >
                <option value="">Select account</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </Field>
          )}

          {form.type !== 'transfer' && (
            <Field label="Category" className="sm:col-span-2">
              <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">No category</option>
                {(form.type === 'income' ? incomeCategories : expenseCategories).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Amount" error={errors.amount}>
            <Input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              aria-invalid={!!errors.amount}
            />
          </Field>

          <Field label="Date" error={errors.date}>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              aria-invalid={!!errors.date}
            />
          </Field>

          <Field label="Description" className="sm:col-span-2">
            <Input
              type="text"
              placeholder="Optional note"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
