export type RecordType = 'supplier' | 'worker';
export type PaymentType = 'altogether' | 'separate';
export type WorkerTypeName = 'permanent' | 'temporary';
export type MainWorkerFlag = 'Yes' | 'No';
export type RecordViewFilter = 'all' | 'supplier' | 'worker';

export interface WorkerPaymentRecord {
  id?: number;
  worker_id?: number;
  worker_name: string;
  is_main_worker: MainWorkerFlag;
  worker_type: WorkerTypeName;
  worker_type_id?: number;
  amount_payable: number | string | null;
  amount_paid: number | string | null;
  mode_of_payment: string | null;
  mode_of_payment_id?: number | null;
}

export interface WorkerFormRow {
  worker_name: string;
  is_main_worker: MainWorkerFlag;
  worker_type: WorkerTypeName;
  amount_payable: string;
  amount_paid: string;
  mode_of_payment: string;
}

export interface Payment {
  id: number;
  record_type: RecordType;
  // Supplier fields
  supplier_id?: number | null;
  item_id?: number | null;
  brand_id?: number | null;
  quantity?: string | null;
  weight?: string | null;
  size?: string | null;
  price?: string | null;
  total_amount?: string | null;
  mode_of_payment_id?: number | null;
  supplier?: string | null;
  item?: string | null;
  brand?: string | null;
  mode_of_payment?: string | null;
  // Worker fields
  payment_type?: PaymentType | null;
  amount_payable?: number | string | null;
  amount_paid?: number | string | null;
  main_worker?: string | null;
  workers?: WorkerPaymentRecord[];
  date_of_payment?: string | null;
  created_at?: string | null;
}

export interface PaymentFormData {
  record_type: RecordType;
  // Supplier
  item: string;
  supplier: string;
  brand: string;
  quantity: string;
  weight: string;
  size: string;
  price: string;
  total_amount: string;
  mode_of_payment: string;
  date_of_payment: string;
  // Worker
  payment_type: PaymentType;
  amount_payable: string;
  amount_paid: string;
  workers: WorkerFormRow[];
}

export interface PaymentStats {
  totalCount: number;
  totalSpent: number;
  supplierSpent: number;
  workerSpent: number;
  uniqueSuppliers: number;
  byModeOfPayment: Record<string, number>;
}

export interface MasterSuggestion {
  id: number;
  name: string;
}

export interface WorkerTypeOption {
  id: number;
  type: WorkerTypeName;
}

export type EntityType =
  | 'item'
  | 'supplier'
  | 'brand'
  | 'mode_of_payment'
  | 'worker';
