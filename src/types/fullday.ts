// ============================================
// ARCHIVO: src/types/fullday.ts
// Tipos para pedidos FullDay
// ============================================

// Eliminada importación no usada de Student

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
export type FullDayPaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null;

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
  notes: string | null;
  created_at: Date;
  updated_at: Date;
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
  items: any; // JSONB en la BD
  status: string;
  total: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}