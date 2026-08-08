import React, { memo } from 'react';
import { MetricCard } from '@/components/payments/MetricCard';
import { formatCurrency } from '@/lib/utils';
import type { PaymentStats } from '@/types/payment';
import { CreditCard, HardHat, IndianRupee, Truck } from 'lucide-react';

interface MetricsOverviewProps {
  stats: PaymentStats | null;
  isLoading: boolean;
}

function getTopPaymentMode(stats: PaymentStats | null): string {
  if (!stats?.byModeOfPayment) return 'N/A';

  let topMode = 'N/A';
  let maxCount = 0;

  Object.entries(stats.byModeOfPayment).forEach(([mode, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topMode = mode;
    }
  });

  return topMode;
}

export const MetricsOverview = memo(function MetricsOverview({ stats, isLoading }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        eyebrow="Total disbursed"
        value={formatCurrency(stats?.totalSpent || 0)}
        caption="Cumulative ledger total"
        icon={<IndianRupee className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
        isLoading={isLoading}
      />
      <MetricCard
        eyebrow="To suppliers"
        value={formatCurrency(stats?.supplierSpent || 0)}
        caption="Amount disbursed to suppliers"
        icon={<Truck className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />}
        isLoading={isLoading}
      />
      <MetricCard
        eyebrow="To workers"
        value={formatCurrency(stats?.workerSpent || 0)}
        caption="Amount disbursed to workers"
        icon={<HardHat className="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
        isLoading={isLoading}
      />
      <MetricCard
        eyebrow="Top payment mode"
        value={getTopPaymentMode(stats)}
        caption="Most used channel"
        icon={<CreditCard className="size-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />}
        valueClassName="text-lg"
        isLoading={isLoading}
      />
    </div>
  );
});
