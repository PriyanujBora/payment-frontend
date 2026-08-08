import React, { useMemo, useState, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Payment, RecordViewFilter } from '@/types/payment';
import { Badge } from '@/components/ui/badge';
import { getPaymentModeBadgeVariant } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterSelect } from '@/components/ui/filter-select';
import { cn, formatNumber } from '@/lib/utils';
import { Pencil, Trash2, Inbox } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 / page' },
  { value: '25', label: '25 / page' },
  { value: '50', label: '50 / page' }
];

/**
 * Uniform cell padding token — every cell gets the same horizontal padding.
 * Alignment is NOT handled via text-align on the cell; instead, an inner
 * flex wrapper (AlignWrapper) positions content within the uniformly-padded
 * content area. This ensures the visual gap between any two adjacent
 * columns is always constant (= right padding + left padding), regardless
 * of whether their alignments differ.
 */
const CELL_PAD = 'px-3';

const COL = {
  id: CELL_PAD,
  type: CELL_PAD,
  mode: CELL_PAD,
  actions: CELL_PAD,
  amount: CELL_PAD,
  qty: CELL_PAD,
  measure: CELL_PAD,
  count: CELL_PAD,
  text: CELL_PAD
} as const;

/**
 * Per-column width tracks, tuned so that the visual gap between adjacent
 * columns' content is approximately equal regardless of alignment.
 *
 * The math: the gap between column i and i+1 =
 *   rightContrib(i) + cellPadding*2 + leftContrib(i+1)
 *
 * where:
 *   left-aligned  → rightContrib = all slack,  leftContrib = 0
 *   right-aligned → rightContrib = 0,          leftContrib = all slack
 *   center-aligned→ rightContrib = slack/2,    leftContrib = slack/2
 *
 * To equalise, centered columns need ~2× the slack of other columns,
 * and columns at left→right boundaries need minimal slack.
 */
const COLUMN_WIDTHS: Record<RecordViewFilter, string[]> = {
  //       ID    Type   Party  Detail Total  Mode   Bank   Date   Actions
  all:      ['5%','10%','13%', '14%', '11%', '12%', '10%', '11%', '8%'],
  //       ID   Supp  Item  Brand Qty   Wt    Sz    Price Total Mode  Bank  Date  Act
  supplier: ['4%','8%','8%', '7%', '5%', '5%', '5%', '8%','9%','12%','8%','11%','8%'],
  //       ID   Type  MnWkr Payable Paid  Mode  Bank  Date  Act
  worker:   ['5%','10%','14%','12%','12%','12%','10%','13%','8%'],
};

const CHIP_CLASS = 'h-6 w-[5.75rem] max-w-full justify-center px-2';

const TABLE_LAYOUT_CLASS = 'w-full table-fixed';

function PaymentColGroup({ viewFilter }: { viewFilter: RecordViewFilter }) {
  const widths = COLUMN_WIDTHS[viewFilter];
  return (
    <colgroup>
      {widths.map((w, index) => (
        <col key={index} style={{ width: w }} />
      ))}
    </colgroup>
  );
}

/** Maps a logical alignment to a flex justify class. */
const ALIGN_CLASS: Record<string, string> = {
  left: 'justify-start',
  right: 'justify-end',
  center: 'justify-center'
};

/**
 * Wraps cell content in a flex container that handles alignment.
 * This keeps the td/th padding uniform while letting content
 * sit at left / right / center within the padded area.
 */
function AlignWrapper({
  align,
  children
}: {
  align?: 'left' | 'right' | 'center';
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-center w-full', ALIGN_CLASS[align || 'left'])}>
      {children}
    </div>
  );
}

interface PaymentTableProps {
  payments: Payment[];
  isLoading: boolean;
  viewFilter: RecordViewFilter;
  onEdit: (id: number, recordType: 'supplier' | 'worker') => void;
  onDelete: (id: number, label: string, recordType: 'supplier' | 'worker') => void;
}

type ColumnMeta = {
  className?: string;
  align?: 'left' | 'right' | 'center';
};

function getDeleteLabel(payment: Payment): string {
  if (payment.record_type === 'worker') {
    return payment.main_worker || 'Worker payment';
  }
  return payment.item || 'Supplier payment';
}

function formatWorkerDetail(payment: Payment): string {
  const typeLabel =
    payment.payment_type === 'separate' ? 'Separately' : 'Altogether';
  const count = payment.workers?.length ?? 0;
  return `${typeLabel} · ${count} worker${count === 1 ? '' : 's'}`;
}

function getPaymentDisplayAmount(payment: Payment): string {
  if (payment.record_type === 'worker') {
    return payment.amount_paid != null ? String(payment.amount_paid) : '0';
  }
  return payment.total_amount || '0';
}

function getWorkerMode(payment: Payment): string | null {
  if (payment.mode_of_payment) return payment.mode_of_payment;
  const withMode = payment.workers?.find(w => w.mode_of_payment);
  return withMode?.mode_of_payment || null;
}

function getWorkerBank(payment: Payment): string | null {
  if (payment.bank) return payment.bank;
  const withBank = payment.workers?.find(w => w.bank);
  return withBank?.bank || null;
}

function ModeCell({ value }: { value: string | null }) {
  const variant = getPaymentModeBadgeVariant(value);
  return (
    <div className="flex justify-center">
      <Badge variant={variant} className={CHIP_CLASS} title={value || undefined}>
        {value || '-'}
      </Badge>
    </div>
  );
}

function TypeCell({ value }: { value: 'supplier' | 'worker' | null | undefined }) {
  const type = value === 'worker' ? 'worker' : 'supplier';
  return (
    <div className="flex justify-center">
      <Badge
        variant={type === 'supplier' ? 'secondary' : 'outline'}
        className={CHIP_CLASS}
      >
        {type === 'supplier' ? 'Supplier' : 'Worker'}
      </Badge>
    </div>
  );
}

function AmountCell({ value, bold }: { value: string; bold?: boolean }) {
  return (
    <span
      className={`tabular-nums whitespace-nowrap ${bold ? 'font-semibold text-foreground' : 'text-foreground'}`}
    >
      <span className="text-muted-foreground">₹&nbsp;</span>
      {formatNumber(value)}
    </span>
  );
}

function TextCell({
  value,
  className,
  maxWidthClass = 'max-w-full'
}: {
  value: string | null | undefined;
  className?: string;
  maxWidthClass?: string;
}) {
  const display = value || '-';
  return (
    <span className={cn('block truncate', maxWidthClass, className)} title={display}>
      {display}
    </span>
  );
}

function ActionsCell({
  payment,
  onEdit,
  onDelete
}: {
  payment: Payment;
  onEdit: (id: number, recordType: 'supplier' | 'worker') => void;
  onDelete: (id: number, label: string, recordType: 'supplier' | 'worker') => void;
}) {
  const deleteLabel = getDeleteLabel(payment);
  const recordType = payment.record_type === 'worker' ? 'worker' : 'supplier';
  return (
    <div className="inline-flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(payment.id, recordType)}
            aria-label={`Edit payment ${payment.id}`}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Edit #{payment.id}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(payment.id, deleteLabel, recordType)}
            aria-label={`Delete payment ${payment.id}`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Delete #{payment.id}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function buildIdColumn(): ColumnDef<Payment> {
  return {
    accessorKey: 'id',
    header: 'ID',
    cell: info => (
      <span className="tabular-nums font-medium text-muted-foreground">#{info.getValue<number>()}</span>
    ),
    meta: { className: COL.id, align: 'left' } satisfies ColumnMeta
  };
}

function buildActionsColumn(
  onEdit: (id: number, recordType: 'supplier' | 'worker') => void,
  onDelete: (id: number, label: string, recordType: 'supplier' | 'worker') => void
): ColumnDef<Payment> {
  return {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <ActionsCell payment={row.original} onEdit={onEdit} onDelete={onDelete} />
    ),
    meta: { className: COL.actions, align: 'right' } satisfies ColumnMeta
  };
}

function buildModeColumn(): ColumnDef<Payment> {
  return {
    accessorKey: 'mode_of_payment',
    header: 'Mode',
    cell: info => <ModeCell value={info.getValue<string | null>()} />,
    meta: { className: COL.mode, align: 'center' } satisfies ColumnMeta
  };
}

function formatDateDisplay(ymdStr: string | null | undefined): string {
  if (!ymdStr) return '-';
  const [y, m, d] = ymdStr.split('-').map(Number);
  if (!y || !m || !d) return ymdStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function buildDateColumn(): ColumnDef<Payment> {
  return {
    accessorKey: 'date_of_payment',
    header: 'Date',
    cell: info => (
      <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
        {formatDateDisplay(info.getValue<string | null>())}
      </span>
    ),
    meta: { className: COL.text, align: 'center' } satisfies ColumnMeta
  };
}

function buildBankColumn(): ColumnDef<Payment> {
  return {
    accessorKey: 'bank',
    header: 'Bank',
    cell: info => (
      <TextCell
        value={info.getValue<string | null>()}
        className="text-xs text-muted-foreground"
      />
    ),
    meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
  };
}

function buildTotalColumn(): ColumnDef<Payment> {
  return {
    id: 'total_amount',
    header: 'Total',
    cell: ({ row }) => <AmountCell value={getPaymentDisplayAmount(row.original)} bold />,
    meta: { className: COL.amount, align: 'right' } satisfies ColumnMeta
  };
}

function buildAllColumns(
  onEdit: (id: number, recordType: 'supplier' | 'worker') => void,
  onDelete: (id: number, label: string, recordType: 'supplier' | 'worker') => void
): ColumnDef<Payment>[] {
  return [
    buildIdColumn(),
    {
      accessorKey: 'record_type',
      header: 'Type',
      cell: info => <TypeCell value={info.getValue<'supplier' | 'worker'>()} />,
      meta: { className: COL.type, align: 'center' } satisfies ColumnMeta
    },
    {
      id: 'party',
      header: 'Party',
      cell: ({ row }) => {
        const p = row.original;
        const val = p.record_type === 'supplier' ? p.supplier : p.main_worker;
        return <TextCell value={val} className="font-medium text-foreground" />;
      },
      meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
    },
    {
      id: 'detail',
      header: 'Detail',
      cell: ({ row }) => {
        const p = row.original;
        const val =
          p.record_type === 'supplier' ? p.item || '-' : formatWorkerDetail(p);
        return <TextCell value={val} className="text-foreground" />;
      },
      meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
    },
    buildTotalColumn(),
    {
      id: 'mode_of_payment',
      header: 'Mode',
      cell: ({ row }) => {
        const p = row.original;
        const mode =
          p.record_type === 'worker' ? getWorkerMode(p) : p.mode_of_payment || null;
        return <ModeCell value={mode} />;
      },
      meta: { className: COL.mode, align: 'center' } satisfies ColumnMeta
    },
    {
      id: 'bank',
      header: 'Bank',
      cell: ({ row }) => {
        const p = row.original;
        const bank = p.record_type === 'worker' ? getWorkerBank(p) : p.bank || null;
        return (
          <TextCell value={bank} className="text-xs text-muted-foreground" />
        );
      },
      meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
    },
    buildDateColumn(),
    buildActionsColumn(onEdit, onDelete)
  ];
}

function buildSupplierColumns(
  onEdit: (id: number, recordType: 'supplier' | 'worker') => void,
  onDelete: (id: number, label: string, recordType: 'supplier' | 'worker') => void
): ColumnDef<Payment>[] {
  return [
    buildIdColumn(),
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: info => (
        <TextCell
          value={info.getValue<string | null>()}
          className="font-medium text-foreground"
        />
      ),
      meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
    },
    {
      accessorKey: 'item',
      header: 'Item',
      cell: info => (
        <TextCell
          value={info.getValue<string>()}
          className="font-semibold text-foreground"
        />
      ),
      meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: info => (
        <TextCell value={info.getValue<string | null>()} className="text-muted-foreground" />
      ),
      meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: info => (
        <span className="whitespace-nowrap tabular-nums font-medium text-foreground">
          {info.getValue<string>() || '0'}
        </span>
      ),
      meta: { className: COL.qty, align: 'right' } satisfies ColumnMeta
    },
    {
      accessorKey: 'weight',
      header: 'Weight',
      cell: info => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {info.getValue<string | null>() || '-'}
        </span>
      ),
      meta: { className: COL.measure, align: 'right' } satisfies ColumnMeta
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: info => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {info.getValue<string | null>() || '-'}
        </span>
      ),
      meta: { className: COL.measure, align: 'right' } satisfies ColumnMeta
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: info => <AmountCell value={info.getValue<string>() || '0'} />,
      meta: { className: COL.amount, align: 'right' } satisfies ColumnMeta
    },
    buildTotalColumn(),
    buildModeColumn(),
    buildBankColumn(),
    buildDateColumn(),
    buildActionsColumn(onEdit, onDelete)
  ];
}

function buildWorkerColumns(
  onEdit: (id: number, recordType: 'supplier' | 'worker') => void,
  onDelete: (id: number, label: string, recordType: 'supplier' | 'worker') => void
): ColumnDef<Payment>[] {
  return [
    buildIdColumn(),
    {
      accessorKey: 'payment_type',
      header: 'Type',
      cell: info => {
        const value = info.getValue<string | null>();
        const label = value === 'separate' ? 'Separately' : 'Altogether';
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className={CHIP_CLASS}>
              {label}
            </Badge>
          </div>
        );
      },
      meta: { className: COL.type, align: 'center' } satisfies ColumnMeta
    },
    {
      accessorKey: 'main_worker',
      header: 'Main worker',
      cell: info => (
        <TextCell
          value={info.getValue<string | null>()}
          className="font-medium text-foreground"
        />
      ),
      meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
    },
    {
      accessorKey: 'amount_payable',
      header: 'Payable',
      cell: info => <AmountCell value={String(info.getValue() ?? '0')} />,
      meta: { className: COL.amount, align: 'right' } satisfies ColumnMeta
    },
    {
      accessorKey: 'amount_paid',
      header: 'Paid',
      cell: info => <AmountCell value={String(info.getValue() ?? '0')} bold />,
      meta: { className: COL.amount, align: 'right' } satisfies ColumnMeta
    },
    {
      id: 'mode_of_payment',
      header: 'Mode',
      cell: ({ row }) => <ModeCell value={getWorkerMode(row.original)} />,
      meta: { className: COL.mode, align: 'center' } satisfies ColumnMeta
    },
    {
      id: 'bank',
      header: 'Bank',
      cell: ({ row }) => (
        <TextCell
          value={getWorkerBank(row.original)}
          className="text-xs text-muted-foreground"
        />
      ),
      meta: { className: COL.text, align: 'left' } satisfies ColumnMeta
    },
    buildDateColumn(),
    buildActionsColumn(onEdit, onDelete)
  ];
}

const SKELETON_LAYOUTS: Record<
  RecordViewFilter,
  { className: string; align?: 'left' | 'right' | 'center' }[]
> = {
  all: [
    { className: COL.id, align: 'left' },
    { className: COL.type, align: 'center' },
    { className: COL.text, align: 'left' },
    { className: COL.text, align: 'left' },
    { className: COL.amount, align: 'right' },
    { className: COL.mode, align: 'center' },
    { className: COL.text, align: 'left' },
    { className: COL.text, align: 'center' },
    { className: COL.actions, align: 'right' }
  ],
  supplier: [
    { className: COL.id, align: 'left' },
    { className: COL.text, align: 'left' },
    { className: COL.text, align: 'left' },
    { className: COL.text, align: 'left' },
    { className: COL.qty, align: 'right' },
    { className: COL.measure, align: 'right' },
    { className: COL.measure, align: 'right' },
    { className: COL.amount, align: 'right' },
    { className: COL.amount, align: 'right' },
    { className: COL.mode, align: 'center' },
    { className: COL.text, align: 'left' },
    { className: COL.text, align: 'center' },
    { className: COL.actions, align: 'right' }
  ],
  worker: [
    { className: COL.id, align: 'left' },
    { className: COL.type, align: 'center' },
    { className: COL.text, align: 'left' },
    { className: COL.amount, align: 'right' },
    { className: COL.amount, align: 'right' },
    { className: COL.mode, align: 'center' },
    { className: COL.text, align: 'left' },
    { className: COL.text, align: 'center' },
    { className: COL.actions, align: 'right' }
  ]
};

function getFooterColSpans(viewFilter: RecordViewFilter): { before: number; after: number } {
  switch (viewFilter) {
    case 'all':
      return { before: 4, after: 4 };
    case 'supplier':
      return { before: 8, after: 4 };
    case 'worker':
      return { before: 4, after: 4 };
  }
}

export const PaymentTable = React.memo(function PaymentTable({
  payments,
  isLoading,
  viewFilter,
  onEdit,
  onDelete
}: PaymentTableProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });
  const skeletonCount = useMemo(() => {
    if (payments.length > 0) {
      return Math.min(payments.length, 10);
    }
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('last_payment_count');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return Math.min(parsed, 10);
      }
    }
    return 5;
  }, [payments.length]);

  useEffect(() => {
    if (!isLoading && payments.length > 0) {
      sessionStorage.setItem('last_payment_count', payments.length.toString());
    }
  }, [isLoading, payments.length]);

  const columns = useMemo<ColumnDef<Payment>[]>(() => {
    switch (viewFilter) {
      case 'supplier':
        return buildSupplierColumns(onEdit, onDelete);
      case 'worker':
        return buildWorkerColumns(onEdit, onDelete);
      default:
        return buildAllColumns(onEdit, onDelete);
    }
  }, [viewFilter, onEdit, onDelete]);

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination
    },
    onPaginationChange: setPagination
  });

  const grandTotal = payments.reduce(
    (acc, p) => acc + (parseFloat(getPaymentDisplayAmount(p)) || 0),
    0
  );
  const footerColSpans = getFooterColSpans(viewFilter);
  const skeletonLayout = SKELETON_LAYOUTS[viewFilter];

  if (isLoading) {
    const rows = Array.from({ length: Math.max(3, skeletonCount) }, (_, i) => i + 1);
    return (
      <Table className={TABLE_LAYOUT_CLASS}>
        <PaymentColGroup viewFilter={viewFilter} />
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            {skeletonLayout.map((col, colPos) => (
              <TableHead key={`sk-head-${col.className}-${colPos}`} className={col.className}>
                <AlignWrapper align={col.align}>
                  <Skeleton className="h-3.5 w-12" />
                </AlignWrapper>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(i => (
            <TableRow key={i} className="hover:bg-transparent">
              {skeletonLayout.map((col, colPos) => (
                <TableCell key={`sk-cell-${i}-${colPos}`} className={col.className}>
                  <AlignWrapper align={col.align}>
                    <Skeleton
                      className={cn(
                        'h-4 w-20',
                        col.align === 'center' && 'h-5 w-[5.75rem] rounded-full',
                        colPos === skeletonLayout.length - 1 && 'h-7 w-14 rounded-md'
                      )}
                    />
                  </AlignWrapper>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-border bg-secondary">
          <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">No payment records found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a new payment record to get started.
        </p>
      </div>
    );
  }

  const pageCount = Math.max(1, table.getPageCount());
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRecord = payments.length > 0 ? pageIndex * pageSize + 1 : 0;
  const endRecord = Math.min((pageIndex + 1) * pageSize, payments.length);

  return (
    <div className="flex flex-col">
      <Table className={TABLE_LAYOUT_CLASS}>
        <PaymentColGroup viewFilter={viewFilter} />
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
              {headerGroup.headers.map(header => {
                const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                return (
                  <TableHead key={header.id} className={cn(meta?.className, 'truncate')}>
                    {header.isPlaceholder ? null : (
                      <AlignWrapper align={meta?.align}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </AlignWrapper>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => {
                const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                return (
                  <TableCell key={cell.id} className={meta?.className}>
                    <AlignWrapper align={meta?.align}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </AlignWrapper>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={footerColSpans.before}
              className={`${CELL_PAD} text-xs font-medium uppercase tracking-wide text-muted-foreground`}
            />
            <TableCell className={COL.amount}>
              <AlignWrapper align="right">
                <span className="tabular-nums text-sm font-bold text-foreground">
                  <span className="text-muted-foreground">₹&nbsp;</span>
                  {formatNumber(grandTotal)}
                </span>
              </AlignWrapper>
            </TableCell>
            <TableCell colSpan={footerColSpans.after} />
          </TableRow>
        </TableFooter>
      </Table>

      <div className="flex items-center justify-between gap-4 border-t border-border bg-card px-6 py-3 rounded-b-xl">
        <div className="flex items-center gap-3">
          <p className="text-xs whitespace-nowrap text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{startRecord}</span> to{' '}
            <span className="font-semibold text-foreground">{endRecord}</span> of{' '}
            <span className="font-semibold text-foreground">{payments.length}</span> records
          </p>

          <FilterSelect
            value={String(pageSize)}
            onValueChange={value => {
              const nextSize = Number(value);
              setPagination({
                pageIndex: 0,
                pageSize: nextSize
              });
            }}
            ariaLabel="Rows per page"
            options={PAGE_SIZE_OPTIONS}
            className="w-[7.5rem]"
          />
        </div>

        <Pagination className="mx-0 w-auto shrink-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              />
            </PaginationItem>

            {Array.from({ length: pageCount }, (_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink
                  isActive={pageIndex === idx}
                  onClick={() => table.setPageIndex(idx)}
                >
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
});
