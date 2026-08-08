import type { Payment, RecordViewFilter } from '@/types/payment';

function escapeCsv(value: string | null | undefined): string {
  return `"${(value || '').replace(/"/g, '""')}"`;
}

function displayAmount(payment: Payment): string {
  if (payment.record_type === 'worker') {
    return payment.amount_paid != null ? String(payment.amount_paid) : '';
  }
  return payment.total_amount || '';
}

function workerMode(payment: Payment): string {
  if (payment.mode_of_payment) return payment.mode_of_payment;
  return payment.workers?.find(w => w.mode_of_payment)?.mode_of_payment || '';
}

function workerBank(payment: Payment): string {
  if (payment.bank) return payment.bank;
  return payment.workers?.find(w => w.bank)?.bank || '';
}

export function exportPaymentsToCsv(payments: Payment[], filter: RecordViewFilter = 'all'): void {
  const headers = [
    'ID',
    'Type',
    'Payment Type',
    'Party',
    'Item/Detail',
    'Brand',
    'Quantity',
    'Weight',
    'Size',
    'Unit Price',
    'Amount Payable',
    'Amount Paid / Total',
    'Workers',
    'Mode of Payment',
    'Bank',
    'Date of Payment'
  ];

  const rows = payments.map(p => {
    const isWorker = p.record_type === 'worker';
    const workerNames = isWorker
      ? (p.workers || []).map(w => w.worker_name).filter(Boolean).join('; ')
      : '';

    return [
      p.id,
      escapeCsv(p.record_type || 'supplier'),
      escapeCsv(isWorker ? p.payment_type || '' : ''),
      escapeCsv(isWorker ? p.main_worker : p.supplier),
      escapeCsv(isWorker ? `${p.workers?.length || 0} workers` : p.item),
      escapeCsv(p.brand),
      escapeCsv(p.quantity),
      escapeCsv(p.weight),
      escapeCsv(p.size),
      p.price || '',
      isWorker && p.amount_payable != null ? String(p.amount_payable) : '',
      displayAmount(p),
      escapeCsv(workerNames),
      escapeCsv(isWorker ? workerMode(p) : p.mode_of_payment),
      escapeCsv(isWorker ? workerBank(p) : p.bank),
      escapeCsv(p.date_of_payment)
    ];
  });

  const suffix = filter === 'all' ? 'all' : filter;
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute(
    'download',
    `payments_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
