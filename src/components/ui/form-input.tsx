import * as React from 'react';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string;
  requiredMark?: boolean;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, requiredMark, error, prefix, suffix, id, className, ...props }, ref) => {
    return (
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={id}>
          {label}
          {requiredMark ? <span className="text-destructive"> *</span> : null}
        </FieldLabel>
        <div className="relative">
          {prefix ? (
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
              {prefix}
            </span>
          ) : null}
          <Input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            className={cn(prefix && 'pl-7', suffix && 'pr-14', className)}
            {...props}
          />
          {suffix ? (
            <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2">
              {suffix}
            </span>
          ) : null}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    );
  }
);
FormInput.displayName = 'FormInput';
