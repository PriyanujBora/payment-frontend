import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedSwitchProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedSwitch<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className
}: SegmentedSwitchProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex h-10 w-full items-center rounded-lg border border-border bg-secondary p-0.5',
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'h-full flex-1 rounded-md px-3 text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
