import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { DateRangePicker, type DateRangeValue } from '@/components/ui/DateRangePicker';
import { FilterSelect } from '@/components/ui/filter-select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import type { PaymentModeOption, RecordViewFilter } from '@/types/payment';
import { Download, RotateCcw, Search } from 'lucide-react';

interface PaymentToolbarProps {
  searchQuery: string;
  selectedMode: string;
  sortBy: string;
  dateRange: DateRangeValue;
  modeOptions: PaymentModeOption[];
  viewFilter: RecordViewFilter;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onModeChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onDateRangeChange: (value: DateRangeValue) => void;
  onViewFilterChange: (value: RecordViewFilter) => void;
  onResetFilters: () => void;
  onExportCsv: () => void;
}

export const PaymentToolbar = memo(function PaymentToolbar({
  searchQuery,
  selectedMode,
  sortBy,
  dateRange,
  modeOptions,
  viewFilter,
  hasActiveFilters,
  onSearchChange,
  onModeChange,
  onSortChange,
  onDateRangeChange,
  onViewFilterChange,
  onResetFilters,
  onExportCsv
}: PaymentToolbarProps) {
  const modeSelectOptions = [
    { value: 'all-modes', label: 'All modes' },
    ...modeOptions.map(mode => ({ value: String(mode.id), label: mode.name }))
  ];

  return (
    <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="relative w-full md:w-[200px] md:shrink-0">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search records..."
            autoComplete="off"
            className="pl-9"
          />
        </div>

        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder="Filter by payment date"
          className="w-full md:w-auto md:shrink-0"
        />

        <FilterSelect
          value={selectedMode || 'all-modes'}
          onValueChange={value => onModeChange(value === 'all-modes' ? '' : value)}
          ariaLabel="Filter by payment mode"
          options={modeSelectOptions}
          className="w-full md:w-[9.5rem]"
        />

        <FilterSelect
          value={sortBy}
          onValueChange={onSortChange}
          ariaLabel="Sort records"
          className="w-full md:w-[11rem]"
          options={[
            { value: 'date_of_payment-DESC', label: 'Newest first' },
            { value: 'date_of_payment-ASC', label: 'Oldest first' },
            { value: 'id-DESC', label: 'S. No (High to Low)' },
            { value: 'id-ASC', label: 'S. No (Low to High)' },
            { value: 'total_amount-DESC', label: 'Highest amount' },
            { value: 'total_amount-ASC', label: 'Lowest amount' },
            { value: 'supplier-ASC', label: 'Supplier A-Z' }
          ]}
        />

        {hasActiveFilters ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onResetFilters} className="md:shrink-0">
                <RotateCcw data-icon="inline-start" />
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset search and filters</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Tabs
          value={viewFilter}
          onValueChange={value => onViewFilterChange(value as RecordViewFilter)}
          className="w-full min-w-[220px] sm:w-[240px]"
        >
          <TabsList className="w-full" aria-label="Filter by record type">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
            <TabsTrigger value="worker">Worker</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="hidden h-4 w-px shrink-0 bg-border sm:block mx-1" aria-hidden="true" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              <Download data-icon="inline-start" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export records to CSV file</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
