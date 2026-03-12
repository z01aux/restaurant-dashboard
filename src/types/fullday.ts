// ============================================
// ARCHIVO: src/types/fullday.ts
// ACTUALIZADO: Soporte para pago MIXTO
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

// ✅ ACTUALIZADO: Añadido 'MIXTO'
export type FullDayPaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO' | null;

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
  // ✅ NUEVO: Desglose de pago mixto
  mixed_efectivo?: number;
  mixed_yape_plin?: number;
  mixed_tarjeta?: number;
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
  items: any;
  status: string;
  total: number;
  payment_method: string | null;
  // ✅ NUEVO
  mixed_efectivo?: number;
  mixed_yape_plin?: number;
  mixed_tarjeta?: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
