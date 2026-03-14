// ============================================
// ARCHIVO: src/types/fullday.ts
// ✅ ACTUALIZADO: Incluye PAGO MIXTO + SplitPaymentDetails
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

// ✅ NUEVO: Incluye MIXTO
export type FullDayPaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO' | null;

// ✅ NUEVO: Detalle del pago mixto
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
  // ✅ NUEVO: Campo para el desglose del pago mixto
  split_payment?: FullDaySplitPaymentDetails | null;
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
  // ✅ NUEVO: JSONB en la BD
  split_payment?: any | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
