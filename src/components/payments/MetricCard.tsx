import { memo } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  eyebrow: string;
  value: string | number;
  caption: string;
  icon: React.ReactNode;
  valueClassName?: string;
  isLoading?: boolean;
}

export const MetricCard = memo(function MetricCard({
  eyebrow,
  value,
  caption,
  icon,
  valueClassName = '',
  isLoading = false
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-medium tracking-wider uppercase">
          {eyebrow}
        </CardDescription>
        <CardTitle className={cn('text-2xl font-semibold tracking-tight', valueClassName)}>
          {isLoading ? <Skeleton className="h-7 w-28" /> : value}
        </CardTitle>
        <CardAction>
          <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground">
            {icon}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-3.5 w-36" /> : <p className="text-xs text-muted-foreground">{caption}</p>}
      </CardContent>
    </Card>
  );
});
