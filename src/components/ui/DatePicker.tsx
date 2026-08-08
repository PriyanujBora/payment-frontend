import { useState } from 'react';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  requiredMark?: boolean;
  invalid?: boolean;
  error?: string;
  className?: string;
}

function parseYMD(ymdStr: string): Date | undefined {
  if (!ymdStr || !/^\d{4}-\d{2}-\d{2}$/.test(ymdStr)) return undefined;
  return parse(ymdStr, 'yyyy-MM-dd', new Date());
}

function formatYMD(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function DatePicker({
  id = 'date_of_payment',
  name = 'date_of_payment',
  value,
  onChange,
  label = 'Date of payment',
  requiredMark = false,
  invalid = false,
  error,
  className
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseYMD(value);
  const fieldError = error;

  return (
    <Field data-invalid={invalid || fieldError ? true : undefined} className={className}>
      <FieldLabel htmlFor={id}>
        {label}
        {requiredMark ? <span className="text-destructive"> *</span> : null}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={fieldError ? true : undefined}
            className={cn('w-full justify-start font-normal', !selected && 'text-muted-foreground')}
          >
            <CalendarIcon data-icon="inline-start" />
            {selected ? format(selected, 'dd MMM yyyy') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={date => {
              if (date) {
                onChange(formatYMD(date));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
      {error ? <FieldError>{error}</FieldError> : null}
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
    </Field>
  );
}
