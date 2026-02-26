// ============================================
// ARCHIVO: src/types/fullday.ts
// Tipos para pedidos FullDay
// ============================================

import { Student } from './student';

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
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  payment_method: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null;
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