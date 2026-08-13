import React, { useEffect, useRef, useState } from 'react';
import type {
  MainWorkerFlag,
  PaymentFormData,
  PaymentModeOption,
  PaymentType,
  RecordType,
  WorkerFormRow,
  WorkerTypeName
} from '@/types/payment';
import { ComboboxInput } from '@/components/payments/ComboboxInput';
import { type MeasureMode } from '@/components/payments/MeasureModeSwitch';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/DatePicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { FormInput } from '@/components/ui/form-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Box,
  Building2,
  Check,
  CreditCard,
  Plus,
  Trash2,
  User,
  Users,
  Wrench
} from 'lucide-react';

type WorkerFieldKey =
  | 'worker_name'
  | 'worker_type'
  | 'is_main_worker'
  | 'amount_payable'
  | 'amount_paid'
  | 'mode_of_payment';

type FieldErrors = Partial<Record<string, string>>;

const NUMERIC_DECIMAL_PATTERN = /^(?:\d+(?:\.\d*)?|\.\d*)?$/;
const NUMERIC_VALUE_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)$/;
const ALPHABETS_INPUT_PATTERN = /^[A-Za-z ]*$/;
const ALPHABETS_VALUE_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const LETTERS_NOT_ALLOWED = 'Only numbers and decimals allowed';
const ALPHABETS_ONLY = 'Only letters allowed';
const MODE_MAX_LENGTH = 10;
const MODE_TOO_LONG = `Max ${MODE_MAX_LENGTH} characters allowed`;
const PAID_EXCEEDS_PAYABLE = 'Amount paid cannot be higher than amount payable';

const SUPPLIER_MAX_LENGTH = 100;
const ITEM_MAX_LENGTH = 100;
const BRAND_MAX_LENGTH = 100;
const WORKER_NAME_MAX_LENGTH = 100;

const WORKER_PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: 'altogether', label: 'Pay Altogether' },
  { value: 'separate', label: 'Pay Separately' }
];

const RECORD_TYPE_OPTIONS: { value: RecordType; label: string }[] = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'worker', label: 'Worker' }
];

interface PaymentModalProps {
  isOpen: boolean;
  isEdit: boolean;
  editingId: number | null;
  formData: PaymentFormData;
  setFormData: React.Dispatch<React.SetStateAction<PaymentFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  paymentModes?: PaymentModeOption[];
}

export function createEmptyWorkerRow(isMain: boolean = false): WorkerFormRow {
  return {
    worker_name: '',
    is_main_worker: isMain ? 'Yes' : 'No',
    worker_type: 'permanent',
    amount_payable: '',
    amount_paid: '',
    mode_of_payment: ''
  };
}

function isNumericDecimalInput(value: string): boolean {
  return NUMERIC_DECIMAL_PATTERN.test(value);
}

function isAlphabeticInput(value: string): boolean {
  return ALPHABETS_INPUT_PATTERN.test(value);
}

function isValidAlphabeticValue(value: string): boolean {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed === '' || ALPHABETS_VALUE_PATTERN.test(trimmed);
}

function parseMultiplier(value: string): number {
  if (!value.trim()) return NaN;
  const num = parseFloat(value);
  return Number.isNaN(num) ? NaN : num;
}

function formatTotal(amount: number): string {
  return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
}

function withSupplierTotal(data: PaymentFormData, measureMode: MeasureMode): PaymentFormData {
  const price = parseFloat(data.price);
  if (Number.isNaN(price)) {
    return { ...data, total_amount: '0.00' };
  }

  const raw = measureMode === 'quantity' ? data.quantity : data.weight;
  const multiplier = parseMultiplier(raw);
  const factor = Number.isNaN(multiplier) ? 1 : multiplier;
  return { ...data, total_amount: formatTotal(price * factor) };
}

function validateAmountPair(
  payable: string,
  paid: string,
  payableKey: string,
  paidKey: string,
  errors: FieldErrors
) {
  if (!payable.trim()) {
    errors[payableKey] = 'Amount payable is required';
  } else {
    const val = parseFloat(payable);
    if (Number.isNaN(val) || val < 0) {
      errors[payableKey] = 'Enter a valid non-negative amount';
    }
  }

  if (!paid.trim()) {
    errors[paidKey] = 'Amount paid is required';
  } else {
    const val = parseFloat(paid);
    if (Number.isNaN(val) || val < 0) {
      errors[paidKey] = 'Enter a valid non-negative amount';
    }
  }

  if (!errors[payableKey] && !errors[paidKey]) {
    if (parseFloat(paid) > parseFloat(payable)) {
      errors[paidKey] = PAID_EXCEEDS_PAYABLE;
    }
  }
}

function validateMode(
  mode: string,
  modeKey: string,
  errors: FieldErrors
) {
  if (!mode || !mode.trim()) {
    errors[modeKey] = 'Mode of payment is required';
  }
}

function validateSupplierFields(
  formData: PaymentFormData,
  measureMode: MeasureMode
): FieldErrors {
  const errors: FieldErrors = {};

  if (!formData.item.trim()) errors.item = 'Item Name is required';
  if (!formData.supplier.trim()) errors.supplier = 'Supplier Name is required';
  if (!formData.brand.trim()) errors.brand = 'Brand Name is required';

  if (!formData.price.trim()) {
    errors.price = 'Unit price is required';
  } else {
    const price = parseFloat(formData.price);
    if (Number.isNaN(price) || price < 0) {
      errors.price = 'Enter a valid non-negative price';
    }
  }

  const measureValue = measureMode === 'quantity' ? formData.quantity : formData.weight;
  const cleanedMeasure = measureValue.trim().replace(/\.$/, '');
  if (!cleanedMeasure) {
    errors[measureMode] = `${measureMode === 'quantity' ? 'Quantity' : 'Weight'} is required`;
  } else if (!NUMERIC_VALUE_PATTERN.test(cleanedMeasure)) {
    errors[measureMode] = LETTERS_NOT_ALLOWED;
  }

  validateMode(
    formData.mode_of_payment,
    'mode_of_payment',
    errors
  );

  if (!formData.date_of_payment.trim()) {
    errors.date_of_payment = 'Date of payment is required';
  }

  return errors;
}

function validateWorkerFields(formData: PaymentFormData): FieldErrors {
  const errors: FieldErrors = {};
  const isAltogether = formData.payment_type === 'altogether';

  if (!formData.date_of_payment.trim()) {
    errors.date_of_payment = 'Date of payment is required';
  }

  if (isAltogether) {
    validateAmountPair(
      formData.amount_payable,
      formData.amount_paid,
      'amount_payable',
      'amount_paid',
      errors
    );
    validateMode(
      formData.mode_of_payment,
      'mode_of_payment',
      errors
    );
  }

  if (!formData.workers.length) {
    errors.workers = 'At least one worker is required';
    return errors;
  }

  const mainCount = formData.workers.filter(w => w.is_main_worker === 'Yes').length;
  if (mainCount !== 1) {
    errors.workers = 'Exactly one worker must be marked as main worker';
  }

  formData.workers.forEach((worker, index) => {
    const prefix = `workers.${index}`;

    if (!worker.worker_name.trim()) {
      errors[`${prefix}.worker_name`] = 'Worker name is required';
    } else if (!isValidAlphabeticValue(worker.worker_name)) {
      errors[`${prefix}.worker_name`] = ALPHABETS_ONLY;
    }

    if (!worker.worker_type) {
      errors[`${prefix}.worker_type`] = 'Worker type is required';
    }

    if (!isAltogether) {
      validateAmountPair(
        worker.amount_payable,
        worker.amount_paid,
        `${prefix}.amount_payable`,
        `${prefix}.amount_paid`,
        errors
      );
      validateMode(
        worker.mode_of_payment,
        `${prefix}.mode_of_payment`,
        errors
      );
    }
  });

  return errors;
}

export function PaymentModal({
  isOpen,
  isEdit,
  editingId,
  formData,
  setFormData,
  onClose,
  onSubmit,
  isSaving,
  paymentModes = []
}: PaymentModalProps) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const letterErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recordType: RecordType = formData.record_type ?? 'supplier';
  const paymentType: PaymentType = formData.payment_type ?? 'altogether';

  useEffect(() => {
    return () => {
      if (letterErrorTimeoutRef.current) {
        clearTimeout(letterErrorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFieldErrors({});
    }
  }, [isOpen, editingId]);

  const derivedMeasureMode: MeasureMode =
    Boolean(formData.weight.trim()) && !Boolean(formData.quantity.trim())
      ? 'weight'
      : 'quantity';

  const [overrideMeasureMode, setOverrideMeasureMode] = useState<MeasureMode | null>(null);
  const measureMode = overrideMeasureMode ?? derivedMeasureMode;
  const setMeasureMode = (mode: MeasureMode) => setOverrideMeasureMode(mode);

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const showTransientError = (field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));

    if (letterErrorTimeoutRef.current) {
      clearTimeout(letterErrorTimeoutRef.current);
    }

    letterErrorTimeoutRef.current = setTimeout(() => {
      setFieldErrors(prev => {
        if (prev[field] !== message) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
      letterErrorTimeoutRef.current = null;
    }, 2200);
  };

  const handleRecordTypeChange = (type: RecordType) => {
    if (type === recordType) return;
    setFieldErrors({});

    if (type === 'worker') {
      setFormData(prev => ({
        ...prev,
        record_type: 'worker',
        item: '',
        supplier: '',
        brand: '',
        quantity: '',
        weight: '',
        size: '',
        price: '',
        total_amount: '0.00',
        payment_type: prev.payment_type || 'altogether',
        amount_payable: '',
        amount_paid: '',
        mode_of_payment: '',
        workers: prev.workers?.length ? prev.workers : [createEmptyWorkerRow(true)]
      }));
      return;
    }

    setMeasureMode('quantity');
    setFormData(prev =>
      withSupplierTotal(
        {
          ...prev,
          record_type: 'supplier',
          payment_type: 'altogether',
          amount_payable: '',
          amount_paid: '',
          workers: [createEmptyWorkerRow(true)],
          mode_of_payment: ''
        },
        'quantity'
      )
    );
  };

  const handlePaymentTypeChange = (type: PaymentType) => {
    if (type === paymentType) return;
    setFieldErrors({});
    setFormData(prev => ({
      ...prev,
      payment_type: type,
      amount_payable: '',
      amount_paid: '',
      mode_of_payment: '',
      workers: prev.workers.map(w => ({
        ...w,
        amount_payable: '',
        amount_paid: '',
        mode_of_payment: ''
      }))
    }));
  };

  const handleMeasureModeChange = (mode: MeasureMode) => {
    setMeasureMode(mode);
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next.quantity;
      delete next.weight;
      return next;
    });

    setFormData(prev =>
      withSupplierTotal(
        {
          ...prev,
          quantity: mode === 'quantity' ? prev.quantity : '',
          weight: mode === 'weight' ? prev.weight : ''
        },
        mode
      )
    );
  };

  const handleChange = (field: keyof PaymentFormData, value: string) => {
    const alphaFields: Array<keyof PaymentFormData> = [
      'supplier',
      'brand'
    ];
    const numericFields: Array<keyof PaymentFormData> = [
      'price',
      'quantity',
      'weight',
      'amount_payable',
      'amount_paid'
    ];

    if (numericFields.includes(field)) {
      if (!isNumericDecimalInput(value)) {
        showTransientError(String(field), LETTERS_NOT_ALLOWED);
        return;
      }
      clearFieldError(String(field));
    }

    if (alphaFields.includes(field)) {
      if (!isAlphabeticInput(value)) {
        showTransientError(String(field), ALPHABETS_ONLY);
        return;
      }
      clearFieldError(String(field));
    }

    if (field === 'item' || field === 'size' || field === 'date_of_payment' || field === 'mode_of_payment') {
      clearFieldError(String(field));
    }

    setFormData(prev => {
      const next = { ...prev, [field]: value } as PaymentFormData;
      if (field === 'price' || field === 'quantity' || field === 'weight') {
        return withSupplierTotal(next, measureMode);
      }
      return next;
    });
  };

  const updateWorker = (index: number, patch: Partial<WorkerFormRow>) => {
    setFormData(prev => {
      if (patch.is_main_worker === 'No' && prev.workers[index]?.is_main_worker === 'Yes') {
        // Keep exactly one main worker: ignore demoting the current main via No.
        const { is_main_worker: _ignored, ...rest } = patch;
        if (Object.keys(rest).length === 0) return prev;
        const workers = prev.workers.map((row, i) =>
          i === index ? { ...row, ...rest } : row
        );
        return { ...prev, workers };
      }

      const workers = prev.workers.map((row, i) => {
        if (i !== index) {
          if (patch.is_main_worker === 'Yes') {
            return { ...row, is_main_worker: 'No' as MainWorkerFlag };
          }
          return row;
        }
        return { ...row, ...patch };
      });
      return { ...prev, workers };
    });
  };

  const handleWorkerChange = (index: number, field: WorkerFieldKey, value: string) => {
    const key = `workers.${index}.${field}`;

    if (
      field === 'amount_payable' ||
      field === 'amount_paid'
    ) {
      if (!isNumericDecimalInput(value)) {
        showTransientError(key, LETTERS_NOT_ALLOWED);
        return;
      }
      clearFieldError(key);
      updateWorker(index, { [field]: value });
      return;
    }

    if (field === 'worker_name') {
      if (!isAlphabeticInput(value)) {
        showTransientError(key, ALPHABETS_ONLY);
        return;
      }
      clearFieldError(key);
      updateWorker(index, { [field]: value });
      return;
    }

    if (field === 'is_main_worker') {
      if (value === 'No' && formData.workers[index]?.is_main_worker === 'Yes') {
        const mainCount = formData.workers.filter(w => w.is_main_worker === 'Yes').length;
        if (mainCount <= 1) {
          showTransientError(key, 'At least one worker needs to be the main worker');
          return;
        }
      }
      clearFieldError(key);
      updateWorker(index, { is_main_worker: value as MainWorkerFlag });
      return;
    }

    clearFieldError(key);
    updateWorker(index, { [field]: value } as Partial<WorkerFormRow>);
  };

  const handleAddWorker = () => {
    setFormData(prev => ({
      ...prev,
      workers: [...prev.workers, createEmptyWorkerRow(false)]
    }));
  };

  const handleRemoveWorker = (index: number) => {
    setFormData(prev => {
      if (prev.workers.length <= 1) return prev;
      const removed = prev.workers[index];
      let workers = prev.workers.filter((_, i) => i !== index);
      if (removed.is_main_worker === 'Yes' && workers.length > 0) {
        workers = workers.map((w, i) =>
          i === 0 ? { ...w, is_main_worker: 'Yes' } : { ...w, is_main_worker: 'No' }
        );
      }
      return { ...prev, workers };
    });
    setFieldErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors =
      recordType === 'worker'
        ? validateWorkerFields(formData)
        : validateSupplierFields(formData, measureMode);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    onSubmit(e);
  };

  const activeMeasureError =
    measureMode === 'quantity' ? fieldErrors.quantity : fieldErrors.weight;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="grid max-h-[90vh] w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-5 py-3">
          <DialogTitle>{isEdit ? `Edit record #${editingId}` : 'New payment record'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the fields below and save.' : 'Fill in the payment details below.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden"
        >
          <div className="flex shrink-0 flex-col gap-2 border-b bg-background px-5 py-3">
            <Tabs
              value={recordType}
              onValueChange={value => handleRecordTypeChange(value as RecordType)}
              className="w-full"
            >
              <TabsList className="w-full" aria-label="Record type">
                {RECORD_TYPE_OPTIONS.map(option => (
                  <TabsTrigger key={option.value} value={option.value} className="flex-1">
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {recordType === 'worker' ? (
              <Field orientation="horizontal" className="justify-between">
                <FieldLabel className="text-sm font-medium text-muted-foreground">
                  Pay Workers
                </FieldLabel>
                <Select
                  value={paymentType}
                  onValueChange={val => handlePaymentTypeChange(val as PaymentType)}
                >
                  <SelectTrigger id="paymentType" className="w-40 sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="altogether">Altogether</SelectItem>
                      <SelectItem value="separate">Separately</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </div>

          <ScrollArea className="h-full min-h-0">
            <div className="flex flex-col gap-3 px-5 py-3">
              {recordType === 'supplier' ? (
                <>
                  <FieldSet>
                    <FieldLegend className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Supplier & Item Details
                    </FieldLegend>
                    <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <ComboboxInput
                        id="supplier"
                        name="supplier"
                        value={formData.supplier}
                        onChange={val => handleChange('supplier', val)}
                        entityName="supplier"
                        label="Supplier Name"
                        requiredMark
                        error={fieldErrors.supplier}
                        placeholder="Enter supplier..."
                      />

                      <ComboboxInput
                        id="item"
                        name="item"
                        value={formData.item}
                        onChange={val => handleChange('item', val)}
                        entityName="item"
                        label="Item Name"
                        requiredMark
                        error={fieldErrors.item}
                        placeholder="Enter item..."
                      />

                      <ComboboxInput
                        id="brand"
                        name="brand"
                        value={formData.brand}
                        onChange={val => handleChange('brand', val)}
                        entityName="brand"
                        label="Brand Name"
                        requiredMark
                        error={fieldErrors.brand}
                        placeholder="Enter brand..."
                      />

                      <FormInput
                        id="size"
                        name="size"
                        type="text"
                        value={formData.size}
                        onChange={e => handleChange('size', e.target.value)}
                        label="Size (Optional)"
                        error={fieldErrors.size}
                        placeholder="e.g. XL, 10mm"
                      />
                    </FieldGroup>

                    <FieldGroup className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FormInput
                        id="price"
                        name="price"
                        type="text"
                        inputMode="decimal"
                        value={formData.price}
                        onChange={e => handleChange('price', e.target.value)}
                        label="Price"
                        requiredMark
                        error={fieldErrors.price}
                        prefix="₹"
                        placeholder="0.00"
                        className="text-right tabular-nums"
                      />

                      <div>
                        {measureMode === 'quantity' ? (
                          <FormInput
                            id="quantity"
                            name="quantity"
                            type="text"
                            inputMode="decimal"
                            value={formData.quantity}
                            onChange={e => handleChange('quantity', e.target.value)}
                            label="Quantity"
                            requiredMark
                            error={fieldErrors.quantity}
                            placeholder="e.g. 10"
                            className="text-right tabular-nums"
                          />
                        ) : (
                          <FormInput
                            id="weight"
                            name="weight"
                            type="text"
                            inputMode="decimal"
                            value={formData.weight}
                            onChange={e => handleChange('weight', e.target.value)}
                            label="Weight"
                            requiredMark
                            error={fieldErrors.weight}
                            placeholder="e.g. 2.5 kg"
                            className="text-right tabular-nums"
                          />
                        )}
                      </div>

                      <FormInput
                        id="total_amount"
                        name="total_amount"
                        type="text"
                        value={formData.total_amount}
                        label={measureMode === 'quantity' ? 'Total Amount (Price × Qty)' : 'Total Amount (Price × Weight)'}
                        readOnly
                        prefix="₹"
                        suffix={
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            Auto
                          </Badge>
                        }
                        className="bg-muted font-bold text-foreground text-right tabular-nums"
                      />
                    </FieldGroup>
                  </FieldSet>
                </>
              ) : (
                <>

                  {paymentType === 'altogether' && (
                    <FieldSet>
                      <FieldLegend className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Altogether Amounts
                      </FieldLegend>
                      <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormInput
                          id="header_amount_payable"
                          name="header_amount_payable"
                          type="text"
                          inputMode="decimal"
                          value={formData.amount_payable}
                          onChange={e => handleChange('amount_payable', e.target.value)}
                          label="Amount Payable"
                          requiredMark
                          error={fieldErrors.amount_payable}
                          prefix="₹"
                          placeholder="0.00"
                          className="text-right tabular-nums"
                        />

                        <FormInput
                          id="header_amount_paid"
                          name="header_amount_paid"
                          type="text"
                          inputMode="decimal"
                          value={formData.amount_paid}
                          onChange={e => handleChange('amount_paid', e.target.value)}
                          label="Amount Paid"
                          requiredMark
                          error={fieldErrors.amount_paid}
                          prefix="₹"
                          placeholder="0.00"
                          className="text-right tabular-nums"
                        />

                        <Field data-invalid={fieldErrors.mode_of_payment ? true : undefined}>
                          <FieldLabel htmlFor="modeOfPaymentHeader">
                            Mode of Payment <span className="text-destructive"> *</span>
                          </FieldLabel>
                          <Select
                            value={formData.mode_of_payment}
                            onValueChange={val => handleChange('mode_of_payment', val)}
                          >
                            <SelectTrigger
                              id="modeOfPaymentHeader"
                              className="w-full"
                              aria-invalid={fieldErrors.mode_of_payment ? true : undefined}
                            >
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {paymentModes.map(mode => (
                                  <SelectItem key={mode.id} value={String(mode.id)}>
                                    {mode.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {fieldErrors.mode_of_payment ? (
                            <FieldError>{fieldErrors.mode_of_payment}</FieldError>
                          ) : null}
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  )}

                  <FieldSet>
                    <FieldLegend className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Workers List
                    </FieldLegend>
                    {fieldErrors.workers ? <FieldError>{fieldErrors.workers}</FieldError> : null}

                    <div className="flex flex-col gap-4">
                      {formData.workers.map((worker, index) => {
                        const prefix = `workers.${index}`;
                        return (
                          <div
                            key={index}
                            className="rounded-lg border border-border bg-card/40 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Worker {index + 1}
                              </p>
                              {formData.workers.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorker(index)}
                                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="size-3" aria-hidden="true" />
                                  Remove
                                </button>
                              ) : null}
                            </div>

                          {/* Row 1: name | worker type | role — always 3 columns */}
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <ComboboxInput
                              id={`workerName-${index}`}
                              name={`workerName-${index}`}
                              value={worker.worker_name}
                              onChange={val => handleWorkerChange(index, 'worker_name', val)}
                              entityName="worker"
                              label="Worker Name"
                              requiredMark
                              error={fieldErrors[`${prefix}.worker_name`]}
                              placeholder="Enter worker name"
                            />

                            <Field data-invalid={fieldErrors[`${prefix}.worker_type`] ? true : undefined}>
                              <FieldLabel htmlFor={`worker-type-${index}`}>
                                Worker Type <span className="text-destructive"> *</span>
                              </FieldLabel>
                              <Select
                                value={worker.worker_type}
                                onValueChange={val => handleWorkerChange(index, 'worker_type', val)}
                              >
                                <SelectTrigger
                                  id={`worker-type-${index}`}
                                  className="w-full"
                                  aria-invalid={fieldErrors[`${prefix}.worker_type`] ? true : undefined}
                                >
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="permanent">Permanent</SelectItem>
                                    <SelectItem value="temporary">Temporary</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              {fieldErrors[`${prefix}.worker_type`] ? (
                                <FieldError>{fieldErrors[`${prefix}.worker_type`]}</FieldError>
                              ) : null}
                            </Field>

                            <Field data-invalid={fieldErrors[`${prefix}.is_main_worker`] ? true : undefined}>
                              <FieldLabel htmlFor={`worker-role-${index}`}>
                                Role
                              </FieldLabel>
                              <Select
                                value={worker.is_main_worker}
                                onValueChange={val => handleWorkerChange(index, 'is_main_worker', val)}
                              >
                                <SelectTrigger
                                  id={`worker-role-${index}`}
                                  className="w-full"
                                  aria-invalid={fieldErrors[`${prefix}.is_main_worker`] ? true : undefined}
                                >
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="Yes">Main</SelectItem>
                                    <SelectItem value="No">Helper</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              {fieldErrors[`${prefix}.is_main_worker`] ? (
                                <FieldError>{fieldErrors[`${prefix}.is_main_worker`]}</FieldError>
                              ) : null}
                            </Field>
                          </div>

                          {/* Row 2+: payment fields (separate mode only) — 3 columns */}
                          {paymentType === 'separate' ? (
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                              <FormInput
                                id={`workerPayable-${index}`}
                                name={`workerPayable-${index}`}
                                inputMode="decimal"
                                value={worker.amount_payable}
                                onChange={e =>
                                  handleWorkerChange(index, 'amount_payable', e.target.value)
                                }
                                label="Amount Payable"
                                requiredMark
                                error={fieldErrors[`${prefix}.amount_payable`]}
                                prefix="₹"
                                placeholder="0.00"
                                className="text-right tabular-nums"
                              />
                              <FormInput
                                id={`workerPaid-${index}`}
                                name={`workerPaid-${index}`}
                                inputMode="decimal"
                                value={worker.amount_paid}
                                onChange={e =>
                                  handleWorkerChange(index, 'amount_paid', e.target.value)
                                }
                                label="Amount Paid"
                                requiredMark
                                error={fieldErrors[`${prefix}.amount_paid`]}
                                prefix="₹"
                                placeholder="0.00"
                                className="text-right tabular-nums"
                              />
                              <Field data-invalid={fieldErrors[`${prefix}.mode_of_payment`] ? true : undefined}>
                                <FieldLabel htmlFor={`worker-mode-${index}`}>
                                  Mode of Payment <span className="text-destructive"> *</span>
                                </FieldLabel>
                                <Select
                                  value={worker.mode_of_payment}
                                  onValueChange={val => handleWorkerChange(index, 'mode_of_payment', val)}
                                >
                                  <SelectTrigger
                                    id={`worker-mode-${index}`}
                                    className="w-full"
                                    aria-invalid={fieldErrors[`${prefix}.mode_of_payment`] ? true : undefined}
                                  >
                                    <SelectValue placeholder="Select mode" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      {paymentModes.map(mode => (
                                        <SelectItem key={mode.id} value={String(mode.id)}>
                                          {mode.name}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                {fieldErrors[`${prefix}.mode_of_payment`] ? (
                                  <FieldError>{fieldErrors[`${prefix}.mode_of_payment`]}</FieldError>
                                ) : null}
                              </Field>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleAddWorker}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Add Worker
                  </Button>
                </FieldSet>
              </>
            )}
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t bg-background px-5 py-3">
            <FieldSet>
              <FieldLegend className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Payment
              </FieldLegend>
              <FieldGroup
                className={
                  recordType === 'supplier'
                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2'
                    : 'grid grid-cols-1 gap-4'
                }
              >
                {recordType === 'supplier' ? (
                  <Field data-invalid={fieldErrors.mode_of_payment ? true : undefined}>
                    <FieldLabel htmlFor="modeOfPayment">
                      Mode of Payment <span className="text-destructive"> *</span>
                    </FieldLabel>
                    <Select
                      value={formData.mode_of_payment}
                      onValueChange={val => handleChange('mode_of_payment', val)}
                    >
                      <SelectTrigger
                        id="modeOfPayment"
                        className="w-full"
                        aria-invalid={fieldErrors.mode_of_payment ? true : undefined}
                      >
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {paymentModes.map(mode => (
                            <SelectItem key={mode.id} value={String(mode.id)}>
                              {mode.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldErrors.mode_of_payment ? (
                      <FieldError>{fieldErrors.mode_of_payment}</FieldError>
                    ) : null}
                  </Field>
                ) : null}

                <DatePicker
                  id="date_of_payment"
                  name="date_of_payment"
                  value={formData.date_of_payment}
                  onChange={val => handleChange('date_of_payment', val)}
                  label="Date of Payment"
                  requiredMark
                  error={fieldErrors.date_of_payment}
                />
              </FieldGroup>
            </FieldSet>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background px-5 py-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" />}
              {isEdit ? 'Save changes' : 'Create record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
