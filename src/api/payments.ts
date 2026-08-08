import api from '@/api/axios';
import type {
  EntityType,
  MasterSuggestion,
  Payment,
  PaymentFormData,
  PaymentStats,
  WorkerTypeOption
} from '@/types/payment';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  fieldErrors?: Record<string, string>;
}

export interface PaymentListParams {
  search?: string;
  mode?: string;
  sortBy: string;
  order: string;
  recordType?: 'all' | 'supplier' | 'worker';
  startDate?: string;
  endDate?: string;
}

export async function getPayments(params: PaymentListParams) {
  const { data } = await api.get<ApiResponse<Payment[]>>('/payments', { params });
  return data;
}

export async function getPaymentStats() {
  const { data } = await api.get<ApiResponse<PaymentStats>>('/payments/stats/summary');
  return data;
}

export async function getPaymentModes() {
  const { data } = await api.get<ApiResponse<string[]>>('/payments/modes');
  return data;
}

export async function getWorkerTypes() {
  const { data } = await api.get<ApiResponse<WorkerTypeOption[]>>('/payments/worker-types');
  return data;
}

export async function getPaymentById(id: number, recordType?: 'supplier' | 'worker') {
  const { data } = await api.get<ApiResponse<Payment>>(`/payments/${id}`, {
    params: recordType ? { recordType } : undefined
  });
  return data;
}

export async function createPayment(payload: PaymentFormData) {
  const { data } = await api.post<ApiResponse<Payment>>('/payments', payload);
  return data;
}

export async function updatePayment(
  id: number,
  payload: PaymentFormData,
  recordType?: 'supplier' | 'worker'
) {
  const { data } = await api.put<ApiResponse<Payment>>(`/payments/${id}`, payload, {
    params: { recordType: recordType || payload.record_type }
  });
  return data;
}

export async function deletePayment(id: number, recordType?: 'supplier' | 'worker') {
  const { data } = await api.delete<ApiResponse<null>>(`/payments/${id}`, {
    params: recordType ? { recordType } : undefined
  });
  return data;
}

export async function getSuggestions(entityName: EntityType, query: string) {
  const { data } = await api.get<ApiResponse<MasterSuggestion[]>>(
    `/payments/suggestions/${entityName}`,
    { params: { query } }
  );
  return data;
}
