import React, { useState } from 'react';
import { Phone, User, MapPin, Plus, Trash2, Search } from 'lucide-react';
import { MenuItem, OrderItem, Customer, OrderSource } from '../../types';
import OrderTicket from './OrderTicket';

const OrderReception: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'phone' | 'walk-in' | 'delivery'>('phone');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos de ejemplo del menú - luego vendrán de Google Sheets
  const menuItems: MenuItem[] = [
    // Entradas
    { id: 'E001', name: 'Papa a la Huancaina', category: 'Entradas', price: 18.00, type: 'food', available: true },
    { id: 'E002', name: 'Causa Rellena', category: 'Entradas', price: 16.00, type: 'food', available: true },
    { id: 'E003', name: 'Tequeños', category: 'Entradas', price: 15.00, type: 'food', available: true },
    
    // Platos de Fondo
    { id: 'P001', name: 'Lomo Saltado de Pollo', category: 'Platos de Fondo', price: 28.00, type: 'food', available: true },
    { id: 'P002', name: 'Lomo Saltado de Res', category: 'Platos de Fondo', price: 32.00, type: 'food', available: true },
    { id: 'P003', name: 'Arroz con Mariscos', category: 'Platos de Fondo', price: 35.00, type: 'food', available: true },
    { id: 'P004', name: 'Aji de Gallina', category: 'Platos de Fondo', price: 25.00, type: 'food', available: true },
    
    // Bebidas
    { id: 'B001', name: 'Inca Kola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
    { id: 'B002', name: 'Coca Cola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
    { id: 'B003', name: 'Chicha Morada', category: 'Bebidas', price: 8.00, type: 'drink', available: true },
  ];

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.menuItem.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.menuItem.id !== itemId));
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart(prev =>
      prev.map(item =>
        item.menuItem.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const createOrder = () => {
    const orderSource: OrderSource = {
      type: activeTab,
      customer: customer || undefined,
    };

    if (activeTab === 'delivery') {
      orderSource.deliveryAddress = address;
    }

    const newOrder = {
      id: `ORD-${Date.now()}`,
      items: cart,
      status: 'pending' as const,
      createdAt: new Date(),
      total: getTotal(),
      customerName: customerName || customer?.name,
      phone: phone || customer?.phone,
      address: activeTab === 'delivery' ? address : undefined,
      source: orderSource,
      notes: orderNotes,
    };

    // Aquí enviaríamos el pedido a Google Sheets
    console.log('Nuevo pedido:', newOrder);
    
    // Limpiar el formulario
    setCart([]);
    setCustomerName('');
    setPhone('');
    setAddress('');
    setOrderNotes('');
    
    alert('Pedido creado exitosamente!');
    
    return newOrder;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recepción de Pedidos</h2>
        
        {/* Tipo de Pedido */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Pedido</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('phone')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                activeTab === 'phone'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Phone className="h-6 w-6 mb-2 text-primary-600" />
              <div className="font-semibold">Por Teléfono</div>
              <div className="text-sm text-gray-600">Cliente llama para pedir</div>
            </button>
            
            <button
              onClick={() => setActiveTab('walk-in')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                activeTab === 'walk-in'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <User className="h-6 w-6 mb-2 text-primary-600" />
              <div className="font-semibold">Paso por Local</div>
              <div className="text-sm text-gray-600">Cliente recoge en tienda</div>
            </button>
            
            <button
              onClick={() => setActiveTab('delivery')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                activeTab === 'delivery'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <MapPin className="h-6 w-6 mb-2 text-primary-600" />
              <div className="font-semibold">Delivery</div>
              <div className="text-sm text-gray-600">Envío a domicilio</div>
            </button>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ingrese nombre del cliente"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ingrese teléfono"
              required
            />
          </div>

          {activeTab === 'delivery' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección de Envío *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ingrese dirección completa"
                required
              />
            </div>
          )}
        </div>

        {/* Búsqueda de Productos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Productos
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Buscar por nombre o categoría..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menú */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Menú</h3>
          
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{category}</h4>
                <div className="space-y-2">
                  {filteredItems
                    .filter(item => item.category === category)
                    .map(item => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">S/ {item.price.toFixed(2)}</div>
                        </div>
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito de Pedido */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedido Actual</h3>
          
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay items en el pedido
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.menuItem.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        S/ {item.menuItem.price.toFixed(2)} c/u
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.menuItem.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Notas para este plato:</label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                      placeholder="Ej: Sin cebolla, bien cocido, etc."
                    />
                  </div>
                </div>
              ))}
              
              {/* Notas generales del pedido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Generales del Pedido
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Instrucciones especiales para el pedido..."
                />
              </div>
              
              {/* Total y acciones */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    S/ {getTotal().toFixed(2)}
                  </span>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setCart([])}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createOrder}
                    disabled={cart.length === 0 || !customerName || !phone}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Crear Pedido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderReception;