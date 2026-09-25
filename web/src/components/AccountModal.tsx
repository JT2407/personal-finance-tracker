import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input, Select } from './ui/forms';
import { useDataStore } from '@/store/useDataStore';
import type { Account, AccountType } from '@/types';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  editing?: Account | null;
}

const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings', 'credit', 'cash'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR'];

/**
 * Add / edit account modal.
 */
export function AccountModal({ open, onClose, editing }: AccountModalProps) {
  const createAccount = useDataStore((s) => s.createAccount);
  const updateAccount = useDataStore((s) => s.updateAccount);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setType(editing?.type ?? 'checking');
    setCurrency(editing?.currency ?? 'USD');
    setInitialBalance(editing ? String(editing.balance) : '');
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

    setSubmitting(true);
    try {
      const payload: Partial<Account> & { initialBalance?: number } = {
        name: trimmed,
        type,
        currency,
      };
      if (!editing) {
        payload.initialBalance = initialBalance === '' ? 0 : Number(initialBalance);
      }

      if (editing) {
        await updateAccount(editing.id, payload);
        toast.success('Account updated');
      } else {
        await createAccount(payload);
        toast.success('Account created');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : 'New account'}
      description="Accounts track the balance of a checking, savings, credit or cash holding."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="account-form" isLoading={submitting}>
            {editing ? 'Save changes' : 'Create account'}
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Name" error={error}>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Everyday Checking"
            aria-invalid={!!error}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label={editing ? 'Current balance' : 'Initial balance'}
          hint={editing ? undefined : 'Opening balance, defaults to 0'}
        >
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
