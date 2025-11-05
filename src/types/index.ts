export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  available: boolean;
  type: 'food' | 'drink';
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

export interface OrderSource {
  type: 'phone' | 'walk-in' | 'delivery' | 'reservation';
  customer?: Customer;
  deliveryAddress?: string;
}

export interface Order {
  id: string;
  tableNumber?: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'delivered';
  createdAt: Date;
  total: number;
  customerName?: string;
  phone?: string;
  address?: string;
  source: OrderSource;
  notes?: string;
}

export interface Table {
  number: number;
  status: 'available' | 'occupied' | 'reserved';
  orderId?: string;
}
