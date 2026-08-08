import { Field, FieldLabel } from '@/components/ui/field';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';

export type MeasureMode = 'quantity' | 'weight';

interface MeasureModeSwitchProps {
  value: MeasureMode;
  onChange: (value: MeasureMode) => void;
}

export function MeasureModeSwitch({ value, onChange }: MeasureModeSwitchProps) {
  return (
    <Field>
      <FieldLabel>Measure by</FieldLabel>
      <SegmentedToggle
        value={value}
        onChange={onChange}
        ariaLabel="Measure by quantity or weight"
        options={[
          { value: 'quantity', label: 'Quantity' },
          { value: 'weight', label: 'Weight' }
        ]}
      />
    </Field>
  );
}
