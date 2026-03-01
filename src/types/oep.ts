// ============================================================
// ARCHIVO: src/types/oep.ts
// Tipos para el módulo OEP
// Equivalente exacto de: src/types/fullday.ts
// ============================================================

export type OEPOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OEPPaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA';

export interface OEPOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category?: string;
}

export interface OEPOrder {
  id: string;
  order_number: string;
  student_id: string | null;
  student_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string | null;
  items: OEPOrderItem[];
  status: OEPOrderStatus;
  total: number;
  payment_method: OEPPaymentMethod | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

// Tipo de la base de datos (antes de convertir fechas)
export interface OEPDatabaseOrder {
  id: string;
  order_number: string;
  student_id: string | null;
  student_name: string;
  grade: string;
  section: string;
  guardian_name: string;
  phone: string | null;
  items: OEPOrderItem[];
  status: string;
  total: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
