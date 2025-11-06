import React, { useState, useEffect } from 'react';
import { Phone, User, MapPin, Plus, Minus, Trash2, Search, Check, Printer } from 'lucide-react';
import { MenuItem, OrderItem, OrderSource, Order } from '../../types';
import OrderTicket from './OrderTicket';

const OrderReception: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'phone' | 'walk-in' | 'delivery'>('phone');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('🥗 Entradas');

  // Cargar pedidos desde localStorage al iniciar
  useEffect(() => {
    const savedOrders = localStorage.getItem('restaurant-orders');
    if (savedOrders) {
      console.log('Pedidos cargados desde localStorage:', JSON.parse(savedOrders).length);
    }
  }, []);

  // Menú del día organizado por categorías
  const menuDelDia: { [key: string]: MenuItem[] } = {
    '🥗 Entradas': [
      { id: 'E001', name: 'Papa a la Huancaina', category: 'Entradas', price: 18.00, type: 'food', available: true, description: 'Papa amarilla con salsa huancaina' },
      { id: 'E002', name: 'Causa Rellena', category: 'Entradas', price: 16.00, type: 'food', available: true, description: 'Causa de pollo o atún' },
      { id: 'E003', name: 'Tequeños', category: 'Entradas', price: 15.00, type: 'food', available: true, description: '12 unidades con salsa de ají' },
      { id: 'E004', name: 'Anticuchos', category: 'Entradas', price: 22.00, type: 'food', available: true, description: 'Brochetas de corazón' },
    ],
    '🍽️ Platos de Fondo': [
      { id: 'P001', name: 'Lomo Saltado de Pollo', category: 'Platos de Fondo', price: 28.00, type: 'food', available: true, description: 'Salteado con cebolla, tomate' },
      { id: 'P002', name: 'Lomo Saltado de Res', category: 'Platos de Fondo', price: 32.00, type: 'food', available: true, description: 'Salteado con cebolla, tomate' },
      { id: 'P003', name: 'Arroz con Mariscos', category: 'Platos de Fondo', price: 35.00, type: 'food', available: true, description: 'Arroz verde con mix de mariscos' },
      { id: 'P004', name: 'Aji de Gallina', category: 'Platos de Fondo', price: 25.00, type: 'food', available: true, description: 'Pollo en salsa de ají amarillo' },
    ],
    '🥤 Bebidas': [
      { id: 'B001', name: 'Inca Kola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
      { id: 'B002', name: 'Coca Cola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
      { id: 'B003', name: 'Chicha Morada', category: 'Bebidas', price: 8.00, type: 'drink', available: true },
      { id: 'B004', name: 'Limonada', category: 'Bebidas', price: 7.00, type: 'drink', available: true },
    ]
  };

  // Todos los items para búsqueda
  const allMenuItems = Object.values(menuDelDia).flat();

  const filteredItems = allMenuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const saveOrderToStorage = (order: Order) => {
    const existingOrders = localStorage.getItem('restaurant-orders');
    const orders = existingOrders ? JSON.parse(existingOrders) : [];
    orders.push(order);
    localStorage.setItem('restaurant-orders', JSON.stringify(orders));
    console.log('Pedido guardado en localStorage:', order);
  };

  const createOrder = () => {
    const orderSource: OrderSource = {
      type: activeTab,
      ...(activeTab === 'delivery' && { deliveryAddress: address })
    };

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      status: 'pending',
      createdAt: new Date(),
      total: getTotal(),
      customerName: customerName,
      phone: phone,
      address: activeTab === 'delivery' ? address : undefined,
      source: orderSource,
      notes: orderNotes,
    };

    setLastOrder(newOrder);
    setShowConfirmation(true);
    return newOrder;
  };

  const confirmOrder = () => {
    if (lastOrder) {
      saveOrderToStorage(lastOrder);
      setCart([]);
      setCustomerName('');
      setPhone('');
      setAddress('');
      setOrderNotes('');
      setShowConfirmation(false);
      
      setTimeout(() => {
        const printButton = document.querySelector(`[data-order-id="${lastOrder.id}"]`) as HTMLButtonElement;
        if (printButton) {
          printButton.click();
        }
      }, 500);
    }
  };

  const cancelOrder = () => {
    setShowConfirmation(false);
    setLastOrder(null);
  };

  const categories = Object.keys(menuDelDia);
  const currentItems = searchTerm ? filteredItems : menuDelDia[activeCategory] || [];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Modal de Confirmación */}
      {showConfirmation && lastOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto">
            <div className="text-center">
              <Check className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Confirmar Pedido?</h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm">
                Pedido <strong>{lastOrder.id}</strong> para <strong>{lastOrder.customerName}</strong>
              </p>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <p className="font-semibold text-base sm:text-lg">Total: S/ {lastOrder.total.toFixed(2)}</p>
                <p className="text-xs sm:text-sm text-gray-600">{lastOrder.items.length} items</p>
              </div>
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={cancelOrder}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Revisar
                </button>
                <button
                  onClick={confirmOrder}
                  className="flex-1 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm"
                >
                  <Printer size={14} className="sm:hidden" />
                  <Printer size={16} className="hidden sm:block" />
                  <span>Confirmar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información del Cliente - Solo en móvil */}
      <div className="lg:hidden bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Recepción de Pedidos</h2>
        
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">Tipo de Pedido</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('phone')}
              className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-colors ${
                activeTab === 'phone'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-orange-600" />
              <div className="font-semibold text-sm sm:text-base">Por Teléfono</div>
              <div className="text-gray-600 text-xs sm:text-sm">Cliente llama</div>
            </button>
            
            <button
              onClick={() => setActiveTab('walk-in')}
              className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-colors ${
                activeTab === 'walk-in'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <User className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-orange-600" />
              <div className="font-semibold text-sm sm:text-base">Paso por Local</div>
              <div className="text-gray-600 text-xs sm:text-sm">Cliente recoge</div>
            </button>
            
            <button
              onClick={() => setActiveTab('delivery')}
              className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-colors ${
                activeTab === 'delivery'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-orange-600" />
              <div className="font-semibold text-sm sm:text-base">Delivery</div>
              <div className="text-gray-600 text-xs sm:text-sm">Envío a domicilio</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nombre del cliente"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Teléfono"
              required
            />
          </div>

          {activeTab === 'delivery' && (
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Dirección de Envío *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Dirección completa"
                required
              />
            </div>
          )}
        </div>

        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Buscar Productos
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Buscar productos..."
            />
          </div>
        </div>
      </div>

      {/* Layout de Escritorio - 2 Columnas */}
      <div className="hidden lg:grid grid-cols-4 gap-6">
        {/* Columna 1: Información del Cliente */}
        <div className="col-span-1">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Información del Pedido</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pedido</label>
                <div className="space-y-2">
                  {[
                    { type: 'phone', icon: Phone, label: 'Por Teléfono', desc: 'Cliente llama' },
                    { type: 'walk-in', icon: User, label: 'Paso por Local', desc: 'Cliente recoge' },
                    { type: 'delivery', icon: MapPin, label: 'Delivery', desc: 'Envío a domicilio' }
                  ].map(({ type, icon: Icon, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => setActiveTab(type as any)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        activeTab === type
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1 text-orange-600" />
                      <div className="font-semibold text-sm">{label}</div>
                      <div className="text-gray-600 text-xs">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Nombre del cliente"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Teléfono"
                  required
                />
              </div>

              {activeTab === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de Envío *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Dirección completa"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas del Pedido
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Instrucciones especiales..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna 2: Menú */}
        <div className="col-span-2">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Menú del Día</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Buscar productos..."
                />
              </div>
            </div>

            {/* Navegación de Categorías */}
            {!searchTerm && (
              <div className="flex space-x-2 mb-6">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeCategory === category
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {/* Grid de Productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => addToCart(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm mb-1">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-gray-600 text-xs mb-2 line-clamp-2">
                          {item.description}
                        </div>
                      )}
                      <div className="font-bold text-orange-600 text-sm">
                        S/ {item.price.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="ml-3 bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors group-hover:scale-110"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resultados de Búsqueda */}
            {searchTerm && filteredItems.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <div className="text-gray-500 text-sm">No se encontraron productos</div>
                <div className="text-gray-400 text-xs">Intenta con otros términos</div>
              </div>
            )}
          </div>
        </div>

        {/* Columna 3: Carrito */}
        <div className="col-span-1">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Pedido Actual</h2>
              {cart.length > 0 && (
                <span className="bg-orange-500 text-white text-sm px-2 py-1 rounded-full">
                  {cart.length}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm mb-2">No hay items en el pedido</div>
                <div className="text-gray-300 text-xs">Selecciona productos del menú</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Lista de Items */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {item.menuItem.name}
                          </div>
                          <div className="text-gray-600 text-xs">
                            S/ {item.menuItem.price.toFixed(2)} c/u
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-xs"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-xs"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.menuItem.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total y Acciones */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      S/ {getTotal().toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setCart([])}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Limpiar Pedido
                    </button>
                    <button
                      onClick={createOrder}
                      disabled={!customerName || !phone}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 font-semibold"
                    >
                      <Check size={18} />
                      <span>Crear Pedido</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Versión Móvil */}
      <div className="lg:hidden">
        {/* Menú Móvil */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Menú del Día</h3>
          
          {/* Categorías Móvil */}
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {currentItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer"
                onClick={() => addToCart(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                    <div className="text-gray-600 text-xs">S/ {item.price.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className="ml-2 bg-orange-500 text-white p-2 rounded-lg"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carrito Móvil Fijo */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 shadow-lg">
          <div className="bg-white/95 backdrop-blur-lg rounded-t-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Pedido Actual</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-orange-600">
                  S/ {getTotal().toFixed(2)}
                </span>
                <button
                  onClick={() => setCart([])}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {item.quantity}x {item.menuItem.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-xs"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={createOrder}
              disabled={!customerName || !phone}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 font-semibold"
            >
              <Check size={18} />
              <span>Crear Pedido</span>
            </button>
          </div>
        </div>
      )}

      {/* Ticket oculto para impresión */}
      {lastOrder && <OrderTicket order={lastOrder} />}
    </div>
  );
};

export default OrderReception;
