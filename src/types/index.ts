// ============================================
// ARCHIVO: src/types/index.ts (COMPLETO - CON PAGO MIXTO)
// ============================================

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  type: 'food' | 'drink';
  available: boolean;
  description?: string;
  isDailySpecial?: boolean;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface OrderSource {
  type: 'phone' | 'walk-in' | 'delivery' | 'fullDay' | 'oep' | 'loncheritas';
  deliveryAddress?: string;
}

// Definimos el tipo para los métodos de pago, ahora incluye 'MIXTO'
export type PaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO';

// Interfaz para el detalle de un pago mixto
export interface SplitPaymentDetails {
  efectivo: number;
  yapePlin: number;
  tarjeta: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  kitchenNumber?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: Date;
  total: number;
  customerName: string;
  phone: string;
  address?: string;
  source: OrderSource;
  notes?: string;
  tableNumber?: string;
  paymentMethod?: PaymentMethod; // Usa el nuevo tipo
  // Nuevo campo para guardar el detalle del pago mixto
  splitPayment?: SplitPaymentDetails;
  updatedAt?: Date;
  studentId?: string;
  studentInfo?: {
    fullName: string;
    grade: string;
    section: string;
    guardianName: string;
    phone?: string;
  };
  orderType: 'regular' | 'fullday';
  igvRate?: number;
}

export interface DatabaseOrder {
  id: string;
  order_number?: string;
  kitchen_number?: string;
  customer_name: string;
  phone: string;
  address?: string;
  table_number?: string;
  source_type: 'phone' | 'walk-in' | 'delivery' | 'fullDay' | 'oep' | 'loncheritas';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  notes?: string;
  payment_method?: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO'; // Actualizado
  created_at: string;
  updated_at: string;
  student_id?: string;
  order_type: string;
}

export interface DatabaseOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  menu_item_price: number;
  quantity: number;
  notes?: string;
  created_at: string;
}