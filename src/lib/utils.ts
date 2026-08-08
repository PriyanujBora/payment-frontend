import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '₹\u00A00.00';
  return (
    '₹\u00A0' +
    num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function formatNumber(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return typeof val === 'string' ? val : '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost';

export function getPaymentModeBadgeVariant(mode: string | null): BadgeVariant {
  if (!mode) return 'secondary';
  const m = mode.toLowerCase();
  if (m.includes('cash')) return 'default';
  if (m.includes('bank') || m.includes('transfer')) return 'outline';
  if (m.includes('card') || m.includes('credit')) return 'secondary';
  if (m.includes('upi')) return 'default';
  if (m.includes('cheque')) return 'outline';
  return 'secondary';
}
