import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className
}: SegmentedToggleProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={next => {
        if (next) onChange(next as T);
      }}
      variant="outline"
      spacing={0}
      className={cn('w-full', className)}
      aria-label={ariaLabel}
    >
      {options.map(option => (
        <ToggleGroupItem key={option.value} value={option.value} className="flex-1">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
