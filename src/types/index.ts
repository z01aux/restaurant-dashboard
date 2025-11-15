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
  type: 'phone' | 'walk-in' | 'delivery';
  deliveryAddress?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;        // Nuevo campo: ORD-0000-0000001
  kitchenNumber?: string;      // Nuevo campo: COM-0000-00000001
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
  paymentMethod?: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA'; // Nuevo campo
  updatedAt?: Date;
}

// Interfaces para Supabase
export interface DatabaseOrder {
  id: string;
  order_number?: string;
  kitchen_number?: string;
  customer_name: string;
  phone: string;
  address?: string;
  table_number?: string;
  source_type: 'phone' | 'walk-in' | 'delivery';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  notes?: string;
  payment_method?: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA'; // Nuevo campo
  created_at: string;
  updated_at: string;
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

