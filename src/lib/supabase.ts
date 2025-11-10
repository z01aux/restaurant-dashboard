import { createClient } from '@supabase/supabase-js';

// @ts-ignore - Ignorar errores de TypeScript temporalmente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore - Ignorar errores de TypeScript temporalmente  
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de datos (mantener igual)
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  orders_count: number;
  total_spent: number;
  last_order: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  category_name?: string;
  type: 'food' | 'drink';
  available: boolean;
  image_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id?: string;
  customer_name: string;
  phone: string;
  address?: string;
  table_number?: string;
  source_type: 'phone' | 'walk-in' | 'delivery';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  menu_item_price: number;
  quantity: number;
  notes?: string;
  created_at: string;
}

export interface Employee {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  created_at: string;
  is_active: boolean;
}
