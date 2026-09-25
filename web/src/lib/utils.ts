import { clsx, type ClassValue } from 'clsx';

/**
 * Combine class names — standard clsx usage for conditional classes.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format a number as currency. Uses compact / tabular-friendly output for the
 * finance ledger. `decimals` forces two places for money precision.
 */
export function formatMoney(value: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Compact money for big totals (e.g. $42.5k).
 */
export function formatMoneyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(2);
}

/**
 * Format a number with thousands separators and a fixed number of decimals,
 * without a currency symbol. Helpful for table cells.
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Current date as YYYY-MM-DD (local). */
export function todayString(): string {
  const d = new Date();
  return toDateString(d);
}

/** Format a Date as YYYY-MM-DD. */
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Current month as YYYY-MM. */
export function currentMonth(): string {
  return todayString().slice(0, 7);
}

/** Human-friendly date from YYYY-MM-DD, e.g. "Mar 5, 2026". */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`;
}

/** Month label from YYYY-MM, e.g. "March 2026". */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  const full = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${full[m - 1]} ${y}`;
}

/** A deterministic hue for a category name (used for the accent chip). */
export function hashHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

/** Simple signed prefix for transactions. */
export function signedAmount(value: number): string {
  const abs = formatNumber(Math.abs(value));
  return value < 0 ? `−${abs}` : `+${abs}`;
}
