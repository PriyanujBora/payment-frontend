import { useState, useEffect, type MouseEvent } from 'react';
import { format, parse } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  id?: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  className?: string;
}

function parseYMD(ymdStr: string): Date | undefined {
  if (!ymdStr || !/^\d{4}-\d{2}-\d{2}$/.test(ymdStr)) return undefined;
  return parse(ymdStr, 'yyyy-MM-dd', new Date());
}

function formatYMD(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function formatDisplayDateShort(ymdStr: string): string {
  const date = parseYMD(ymdStr);
  if (!date) return '';
  return format(date, 'dd MMM');
}

function toDateRange(value: DateRangeValue): DateRange | undefined {
  const from = parseYMD(value.startDate);
  const to = parseYMD(value.endDate);
  if (!from && !to) return undefined;
  return { from, to };
}

export function DateRangePicker({
  id = 'date-range-picker',
  value,
  onChange,
  placeholder = 'Pick a date range',
  className
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const hasValue = Boolean(value.startDate || value.endDate);
  const hasDraftValue = Boolean(draft.startDate || draft.endDate);

  const selected = toDateRange(open ? draft : value);

  let triggerText = placeholder;
  if (value.startDate && value.endDate) {
    triggerText = `${formatDisplayDateShort(value.startDate)} - ${formatDisplayDateShort(value.endDate)}`;
  } else if (value.startDate) {
    triggerText = `${formatDisplayDateShort(value.startDate)} - Select end`;
  }

  const handleClear = (event?: MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    const empty = { startDate: '', endDate: '' };
    setDraft(empty);
    onChange(empty);
    setOpen(false);
  };

  const applyPreset = (preset: 'today' | 'this_month' | 'last_30_days') => {
    const today = new Date();
    const todayYMD = formatYMD(today);

    let nextRange: DateRangeValue;
    if (preset === 'today') {
      nextRange = { startDate: todayYMD, endDate: todayYMD };
    } else if (preset === 'this_month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      nextRange = { startDate: formatYMD(firstOfMonth), endDate: todayYMD };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      nextRange = { startDate: formatYMD(thirtyDaysAgo), endDate: todayYMD };
    }

    setDraft(nextRange);
    onChange(nextRange);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('relative inline-flex w-full items-center sm:w-auto', className)}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              'h-8 w-full min-w-[210px] justify-start gap-2 font-normal sm:w-auto',
              hasValue && 'pr-8',
              !hasValue && 'text-muted-foreground'
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            <span className="truncate">{triggerText}</span>
          </Button>
        </PopoverTrigger>

        {hasValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 size-6 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            aria-label="Clear date range filter"
          >
            <X />
          </Button>
        ) : null}
      </div>

      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex items-center justify-between gap-1.5 border-b border-border p-2.5">
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset('today')}>
              Today
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset('this_month')}>
              This month
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset('last_30_days')}>
              Last 30 days
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Reset date filter"
            className={cn(
              'size-7 text-destructive hover:bg-destructive/10 hover:text-destructive',
              !hasDraftValue && 'invisible'
            )}
            onClick={() => handleClear()}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>

        <Calendar
          mode="range"
          selected={selected}
          defaultMonth={selected?.from}
          numberOfMonths={1}
          className="w-full p-3"
          onSelect={range => {
            const fromStr = range?.from ? formatYMD(range.from) : '';
            const toStr = range?.to ? formatYMD(range.to) : '';

            const isFirstDateOnlySelected = Boolean(draft.startDate && !draft.endDate);

            if (isFirstDateOnlySelected) {
              if (fromStr && toStr) {
                const completeRange = { startDate: fromStr, endDate: toStr };
                setDraft(completeRange);
                onChange(completeRange);
                setOpen(false);
              } else if (fromStr) {
                const completeRange = { startDate: fromStr, endDate: fromStr };
                setDraft(completeRange);
                onChange(completeRange);
                setOpen(false);
              }
            } else {
              if (fromStr) {
                setDraft({ startDate: fromStr, endDate: '' });
              } else {
                setDraft({ startDate: '', endDate: '' });
              }
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
