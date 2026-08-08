import React, { useState, useEffect, useCallback } from 'react';
import {
  createPayment,
  deletePayment,
  getPaymentById,
  getPaymentModes,
  getPayments,
  getPaymentStats,
  updatePayment
} from '@/api/payments';
import { Header } from '@/components/layout/Header';
import { DeleteModal } from '@/components/payments/DeleteModal';
import { ExportModal } from '@/components/payments/ExportModal';
import { MetricsOverview } from '@/components/payments/MetricsOverview';
import { PaymentModal, createEmptyWorkerRow } from '@/components/payments/PaymentModal';
import { PaymentTable } from '@/components/payments/PaymentTable';
import { PaymentToolbar } from '@/components/payments/PaymentToolbar';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { exportPaymentsToCsv } from '@/lib/exportCsv';
import type {
  Payment,
  PaymentFormData,
  PaymentStats,
  RecordType,
  RecordViewFilter,
  WorkerFormRow,
  WorkerTypeName
} from '@/types/payment';

import { DateRangeValue } from '@/components/ui/DateRangePicker';

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const initialFormData: PaymentFormData = {
  record_type: 'supplier',
  item: '',
  supplier: '',
  brand: '',
  quantity: '',
  weight: '',
  size: '',
  price: '',
  total_amount: '0.00',
  mode_of_payment: '',
  bank: '',
  date_of_payment: getTodayDateString(),
  payment_type: 'altogether',
  amount_payable: '',
  amount_paid: '',
  workers: [createEmptyWorkerRow(true)]
};

function mapWorkersToForm(payment: Payment): WorkerFormRow[] {
  if (!payment.workers?.length) {
    return [createEmptyWorkerRow(true)];
  }

  return payment.workers.map(w => ({
    worker_name: w.worker_name || '',
    is_main_worker: w.is_main_worker === 'Yes' ? 'Yes' : 'No',
    worker_type: (w.worker_type === 'temporary' ? 'temporary' : 'permanent') as WorkerTypeName,
    amount_payable: w.amount_payable != null ? String(w.amount_payable) : '',
    amount_paid: w.amount_paid != null ? String(w.amount_paid) : '',
    mode_of_payment: w.mode_of_payment || '',
    bank: w.bank || ''
  }));
}

export function PaymentsPage() {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [paymentModes, setPaymentModes] = useState<string[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [sortBy, setSortBy] = useState('id-DESC');
  const [dateRange, setDateRange] = useState<DateRangeValue>({ startDate: '', endDate: '' });
  const [viewFilter, setViewFilter] = useState<RecordViewFilter>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecordType, setEditingRecordType] = useState<RecordType>('supplier');
  const [formData, setFormData] = useState<PaymentFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingItem, setDeletingItem] = useState('');
  const [deletingRecordType, setDeletingRecordType] = useState<RecordType>('supplier');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState<RecordViewFilter>('all');

  const fetchPayments = useCallback(async () => {
    setIsTableLoading(true);
    try {
      const [sortCol, order] = sortBy.split('-');
      const result = await getPayments({
        search: searchQuery || undefined,
        mode: selectedMode || undefined,
        sortBy: sortCol,
        order,
        recordType: viewFilter,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined
      });

      if (result.success) {
        setPayments(Array.isArray(result.data) ? result.data : []);
      } else {
        setPayments([]);
        addToast(result.message || 'Failed to load payments', 'danger');
      }
    } catch {
      setPayments([]);
      addToast('Could not connect to backend', 'danger');
    } finally {
      setIsTableLoading(false);
    }
  }, [searchQuery, selectedMode, sortBy, dateRange, viewFilter, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getPaymentStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch {
      // Silent fail for stats
    }
  }, []);

  const fetchPaymentModes = useCallback(async () => {
    try {
      const result = await getPaymentModes();
      if (result.success && Array.isArray(result.data)) {
        setPaymentModes(result.data);
        setSelectedMode(prev => (prev && !result.data.includes(prev) ? '' : prev));
      }
    } catch {
      // Silent fail for modes filter
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function initStatsAndModes() {
      setIsStatsLoading(true);
      await Promise.all([fetchStats(), fetchPaymentModes()]);
      if (isMounted) setIsStatsLoading(false);
    }
    initStatsAndModes();
    return () => {
      isMounted = false;
    };
  }, [fetchStats, fetchPaymentModes]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPayments(), fetchStats(), fetchPaymentModes()]);
  }, [fetchPayments, fetchStats, fetchPaymentModes]);

  const handleOpenAddModal = useCallback(() => {
    setIsEdit(false);
    setEditingId(null);
    setEditingRecordType('supplier');
    setFormData({
      ...initialFormData,
      date_of_payment: getTodayDateString(),
      workers: [createEmptyWorkerRow(true)]
    });
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleOpenAddModal();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleOpenAddModal]);

  const handleOpenEditModal = async (id: number, recordType: RecordType) => {
    try {
      const result = await getPaymentById(id, recordType);
      if (result.success && result.data) {
        const p = result.data;
        setIsEdit(true);
        setEditingId(id);
        setEditingRecordType(recordType);

        if (recordType === 'worker') {
          setFormData({
            ...initialFormData,
            record_type: 'worker',
            payment_type: p.payment_type === 'separate' ? 'separate' : 'altogether',
            amount_payable: p.amount_payable != null ? String(p.amount_payable) : '',
            amount_paid: p.amount_paid != null ? String(p.amount_paid) : '',
            mode_of_payment: p.mode_of_payment || '',
            bank: p.bank || '',
            date_of_payment: p.date_of_payment || getTodayDateString(),
            workers: mapWorkersToForm(p)
          });
        } else {
          setFormData({
            ...initialFormData,
            record_type: 'supplier',
            item: p.item || '',
            supplier: p.supplier || '',
            brand: p.brand || '',
            quantity: p.quantity || '',
            weight: p.weight || '',
            size: p.size || '',
            price: p.price || '',
            total_amount: p.total_amount || '0',
            mode_of_payment: p.mode_of_payment || '',
            bank: p.bank || '',
            date_of_payment: p.date_of_payment || getTodayDateString(),
            workers: [createEmptyWorkerRow(true)]
          });
        }

        setIsModalOpen(true);
      } else {
        addToast(result.message || 'Could not load record', 'danger');
      }
    } catch {
      addToast('Failed to fetch payment details', 'danger');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      const result =
        isEdit && editingId
          ? await updatePayment(editingId, formData, editingRecordType)
          : await createPayment(formData);

      if (result.success) {
        setIsModalOpen(false);
        addToast(isEdit ? 'Record updated' : 'Record created', 'success');
        refreshAll();
      } else {
        addToast(result.message || 'Operation failed', 'danger');
      }
    } catch {
      addToast('Network error while saving', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteModal = (
    id: number,
    item: string,
    recordType: RecordType
  ) => {
    setDeletingId(id);
    setDeletingItem(item);
    setDeletingRecordType(recordType);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    try {
      const result = await deletePayment(deletingId, deletingRecordType);
      if (result.success) {
        setIsDeleteOpen(false);
        addToast('Record deleted', 'success');
        refreshAll();
      } else {
        addToast(result.message || 'Delete failed', 'danger');
      }
    } catch {
      addToast('Network error while deleting', 'danger');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMode('');
    setSortBy('id-DESC');
    setDateRange({ startDate: '', endDate: '' });
    setViewFilter('all');
  };

  const handleOpenExport = () => {
    setExportFilter(viewFilter);
    setIsExportOpen(true);
  };

  const handleConfirmExport = async () => {
    try {
      const [sortCol, order] = sortBy.split('-');
      const result = await getPayments({
        search: searchQuery || undefined,
        mode: selectedMode || undefined,
        sortBy: sortCol,
        order,
        recordType: exportFilter,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined
      });

      const rows = result.success && Array.isArray(result.data) ? result.data : [];
      if (rows.length === 0) {
        addToast('No records to export', 'warning');
        setIsExportOpen(false);
        return;
      }

      exportPaymentsToCsv(rows, exportFilter);
      addToast(`Exported ${rows.length} records`, 'success');
      setIsExportOpen(false);
    } catch {
      addToast('Failed to export records', 'danger');
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      selectedMode ||
      dateRange.startDate ||
      dateRange.endDate ||
      sortBy !== 'id-DESC' ||
      viewFilter !== 'all'
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header theme={theme} onToggleTheme={toggleTheme} onAddPayment={handleOpenAddModal} />

      <main id="main-content" className="mx-auto max-w-7xl px-6 py-6">
        <MetricsOverview stats={stats} isLoading={isStatsLoading} />

        <PaymentToolbar
          searchQuery={searchQuery}
          selectedMode={selectedMode}
          sortBy={sortBy}
          dateRange={dateRange}
          modeOptions={paymentModes}
          viewFilter={viewFilter}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearchQuery}
          onModeChange={setSelectedMode}
          onSortChange={setSortBy}
          onDateRangeChange={setDateRange}
          onViewFilterChange={setViewFilter}
          onResetFilters={handleResetFilters}
          onExportCsv={handleOpenExport}
        />

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <PaymentTable
            payments={payments}
            isLoading={isTableLoading}
            viewFilter={viewFilter}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
          />
        </div>
      </main>

      <PaymentModal
        isOpen={isModalOpen}
        isEdit={isEdit}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSaving={isSaving}
      />

      <DeleteModal
        isOpen={isDeleteOpen}
        deletingId={deletingId}
        deletingItem={deletingItem}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <ExportModal
        isOpen={isExportOpen}
        value={exportFilter}
        onChange={setExportFilter}
        onClose={() => setIsExportOpen(false)}
        onConfirm={handleConfirmExport}
      />

    </div>
  );
}
