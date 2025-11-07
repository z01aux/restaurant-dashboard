export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  type: 'food' | 'drink';
  available: boolean;
  description?: string;
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
}

