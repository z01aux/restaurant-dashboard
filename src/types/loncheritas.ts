// ============================================
// ARCHIVO: src/types/loncheritas.ts
// ============================================

export interface LoncheritasOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type LoncheritasOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type LoncheritasPaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null;

export interface LoncheritasOrder {
  id: string;
  order_number: string;
  student_id: string | null;
  student_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string | null;
  items: LoncheritasOrderItem[];
  status: LoncheritasOrderStatus;
  total: number;
  payment_method: LoncheritasPaymentMethod;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LoncheritasDatabaseOrder {
  id: string;
  order_number: string;
  student_id: string | null;
  student_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string | null;
  items: any; // JSONB en la BD
  status: string;
  total: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoncheritasSalesClosure {
  id: string;
  closure_date: string;
  closure_number: string;
  opened_at: string;
  closed_at: string;
  opened_by: string;
  closed_by: string;
  opened_by_name?: string;
  closed_by_name?: string;
  initial_cash: number;
  final_cash: number;
  total_efectivo: number;
  total_yape_plin: number;
  total_tarjeta: number;
  total_no_aplica: number;
  total_orders: number;
  total_amount: number;
  orders_pending: number;
  orders_preparing: number;
  orders_ready: number;
  orders_delivered: number;
  orders_cancelled: number;
  notes: string;
  top_products: Array<{
    id: string;
    name: string;
    quantity: number;
    total: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface LoncheritasCashRegisterStatus {
  is_open: boolean;
  opened_at: string | null;
  opened_by: string | null;
  opened_by_name?: string;
  initial_cash: number;
  current_cash: number;
  last_closure_id: string | null;
}
