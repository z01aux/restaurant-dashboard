// ============================================
// ARCHIVO: src/types/fullday.ts
// ACTUALIZADO: Incluye created_by_id y created_by_name
// ============================================

export interface FullDayMenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export interface FullDayOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type FullDayOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type FullDayPaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO' | null;

export interface FullDaySplitPaymentDetails {
  efectivo: number;
  yapePlin: number;
  tarjeta: number;
}

export interface FullDayOrder {
  id: string;
  order_number: string;
  student_id: string | null;
  student_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string | null;
  items: FullDayOrderItem[];
  status: FullDayOrderStatus;
  total: number;
  payment_method: FullDayPaymentMethod;
  split_payment?: FullDaySplitPaymentDetails | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  // ── Quién generó el pedido ──────────────
  created_by_id?:   string | null;
  created_by_name?: string | null;
}

export interface FullDayDatabaseOrder {
  id: string;
  order_number: string;
  student_id: string | null;
  student_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string | null;
  items: any;
  status: string;
  total: number;
  payment_method: string | null;
  split_payment?: any | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // ── Quién generó el pedido ──────────────
  created_by_id?:   string | null;
  created_by_name?: string | null;
}
