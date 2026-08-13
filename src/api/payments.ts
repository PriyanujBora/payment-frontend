import api from '@/api/axios';
import type {
  EntityType,
  MasterSuggestion,
  Payment,
  PaymentFormData,
  PaymentModeOption,
  PaymentStats
} from '@/types/payment';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  fieldErrors?: Record<string, string>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination?: PaginationInfo;
}

export interface PaymentListParams {
  search?: string;
  mode?: string;
  sortBy: string;
  order: string;
  recordType?: 'all' | 'supplier' | 'worker';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getPayments(params: PaymentListParams) {
  const { data } = await api.get<PaginatedApiResponse<Payment[]>>('/payments', { params });
  return data;
}

export async function getPaymentStats() {
  const { data } = await api.get<ApiResponse<PaymentStats>>('/payments/stats');
  return data;
}

export async function getPaymentModes() {
  const { data } = await api.get<ApiResponse<PaymentModeOption[]>>('/payments/modes');
  return data;
}

export async function getPaymentById(id: number, recordType?: 'supplier' | 'worker') {
  const { data } = await api.get<ApiResponse<Payment>>(`/payments/${id}`, {
    params: recordType ? { recordType } : undefined
  });
  return data;
}

export async function createPayment(payload: PaymentFormData) {
  const endpoint = payload.record_type === 'worker' ? '/payments/worker' : '/payments/supplier';
  const { data } = await api.post<ApiResponse<Payment>>(endpoint, payload);
  return data;
}

export async function updatePayment(
  id: number,
  payload: PaymentFormData,
  recordType?: 'supplier' | 'worker'
) {
  const type = recordType || payload.record_type || 'supplier';
  const endpoint = `/payments/${type}/${id}`;
  const { data } = await api.put<ApiResponse<Payment>>(endpoint, payload);
  return data;
}

export async function getSuggestions(entityName: EntityType, query: string) {
  const { data } = await api.get<ApiResponse<MasterSuggestion[]>>(
    `/payments/suggestions/${entityName}`,
    { params: { query } }
  );
  return data;
}
