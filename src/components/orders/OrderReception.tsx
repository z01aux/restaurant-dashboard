import React, { useState, useEffect } from 'react';
import { Plus, Check, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { MenuItem, OrderItem, OrderSource, Order } from '../../types';
import OrderTicket from './OrderTicket';

// Componente de Notificación Toast simplificado
const ToastNotification: React.FC<{
  message: string;
  onClose: () => void;
}> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform animate-in slide-in-from-right-full duration-300">
      <div className="flex items-center space-x-2">
        <Check size={20} />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

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
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const showToast = (message: string) => {
    setToast(message);
    // Limpiar toast anterior si existe
    setTimeout(() => setToast(null), 100);
  };

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      let newQuantity = 1;
      
      if (existing) {
        newQuantity = existing.quantity + 1;
        showToast(`✓ ${menuItem.name} (${newQuantity})`);
      } else {
        showToast(`✓ ${menuItem.name} añadido`);
      }

      if (existing) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: newQuantity }
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
      prev.map(item => {
        if (item.menuItem.id === itemId) {
          return { ...item, quantity };
        }
        return item;
      })
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
    if (cart.length === 0) {
      showToast('El pedido está vacío');
      return;
    }

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
      setShowCartDrawer(false);
      
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
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-20 lg:pb-6">
      {/* Notificación Toast simplificada */}
      {toast && (
        <ToastNotification
          message={toast}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-orange-200">
          <div className="px-3 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Recepción de Pedidos</h1>
                <div className="flex items-center space-x-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    activeTab === 'phone' ? 'bg-blue-500' : 
                    activeTab === 'walk-in' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-600 capitalize">
                    {activeTab === 'phone' ? 'Teléfono' : activeTab === 'walk-in' ? 'Local' : 'Delivery'}
                  </span>
                </div>
              </div>
              
              {/* Botón Carrito Móvil mejorado con mensaje */}
              <button
                onClick={() => setShowCartDrawer(true)}
                className="relative bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <ShoppingBag size={20} />
                <div className="text-left">
                  <div className="text-xs font-medium">Ver pedido</div>
                  <div className="text-xs opacity-90">{totalItems} items</div>
                </div>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

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
                    <span>🖨️</span>
                    <span>Confirmar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drawer del Carrito Móvil mejorado */}
        {showCartDrawer && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCartDrawer(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform">
              <div className="p-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Tu Pedido</h3>
                    <p className="text-sm text-gray-600">Revisa los productos agregados</p>
                  </div>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="text-gray-500 text-sm mb-2">Tu pedido está vacío</div>
                    <div className="text-gray-400 text-xs">Agrega productos del menú</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {item.menuItem.name}
                            </div>
                            <div className="text-gray-600 text-xs">
                              S/ {item.menuItem.price.toFixed(2)} c/u
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-2 py-1">
                              <button
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-sm font-bold text-gray-700"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-sm font-bold text-gray-700"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.menuItem.id)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold text-orange-600 mt-2">
                          S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        S/ {getTotal().toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm text-center">
                          📝 Completa los datos del cliente arriba para continuar
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setCart([])}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Vaciar Carrito
                      </button>
                      <button
                        onClick={createOrder}
                        disabled={!customerName || !phone}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 font-semibold text-lg"
                      >
                        <Check size={20} />
                        <span>Confirmar Pedido</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-4 lg:gap-6 pt-4 lg:pt-6">
          
          {/* Panel de Información del Cliente */}
          <div className="xl:col-span-1 lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20 sticky top-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Información del Pedido</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Tipo de Pedido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Pedido</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'phone', label: '📞', desc: 'Teléfono' },
                      { type: 'walk-in', label: '👤', desc: 'Local' },
                      { type: 'delivery', label: '📍', desc: 'Delivery' }
                    ].map(({ type, label, desc }) => (
                      <button
                        key={type}
                        onClick={() => setActiveTab(type as any)}
                        className={`p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${
                          activeTab === type
                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{label}</div>
                        <div className="font-semibold text-xs sm:text-sm">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulario del Cliente */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Ingresa el nombre"
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
                      placeholder="Número de teléfono"
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
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Instrucciones especiales..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel del Menú */}
          <div className="xl:col-span-2 lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Menú del Día</h2>
                <div className="relative w-full sm:w-64">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</div>
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
                <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                        activeCategory === category
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid de Productos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {currentItems.map(item => {
                  const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-pointer group relative"
                      onClick={() => addToCart(item)}
                    >
                      {/* Badge de cantidad en carrito - simplificado */}
                      {quantityInCart > 0 && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                          {quantityInCart}
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base mb-1 truncate">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
                              {item.description}
                            </div>
                          )}
                          <div className="font-bold text-orange-600 text-sm sm:text-base">
                            S/ {item.price.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item);
                          }}
                          className="ml-3 bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resultados de Búsqueda */}
              {searchTerm && filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl text-gray-300 mb-3">🔍</div>
                  <div className="text-gray-500 text-sm">No se encontraron productos</div>
                  <div className="text-gray-400 text-xs">Intenta con otros términos</div>
                </div>
              )}
            </div>
          </div>

          {/* Panel del Carrito - Solo visible en desktop - Mejorado */}
          <div className="hidden xl:block xl:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tu Pedido</h2>
                  <p className="text-sm text-gray-600">{totalItems} productos agregados</p>
                </div>
                <div className="bg-orange-500 text-white p-2 rounded-lg">
                  <ShoppingBag size={20} />
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="text-gray-500 text-sm mb-2">Tu pedido está vacío</div>
                  <div className="text-gray-400 text-xs">Agrega productos del menú</div>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      👆 Haz clic en los productos para agregarlos
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de Items */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {item.menuItem.name}
                            </div>
                            <div className="text-gray-600 text-xs">
                              S/ {item.menuItem.price.toFixed(2)} c/u
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-2 py-1">
                              <button
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-sm font-bold text-gray-700"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-sm font-bold text-gray-700"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.menuItem.id)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold text-orange-600">
                          S/ {(item.menuItem.price * item.quantity).toFixed(2)}
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

                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm text-center">
                          ✅ Completa los datos del cliente para confirmar
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setCart([])}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Vaciar Carrito
                      </button>
                      <button
                        onClick={createOrder}
                        disabled={!customerName || !phone}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 font-semibold"
                      >
                        <Check size={18} />
                        <span>Confirmar Pedido</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket oculto para impresión */}
      {lastOrder && <OrderTicket order={lastOrder} />}
    </div>
  );
};

export default OrderReception;
