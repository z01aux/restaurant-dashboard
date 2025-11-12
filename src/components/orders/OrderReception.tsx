import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, X, ShoppingBag, ArrowRight, Search, Trash2 } from 'lucide-react';
import { MenuItem, OrderItem, OrderSource, Order } from '../../types';
import OrderTicket from './OrderTicket';
import { useMenu } from '../../hooks/useMenu';
import { useCustomers } from '../../hooks/useCustomers';

// Estilos para ocultar scrollbar
const styles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Componente de Notificación Toast
const ToastNotification: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      isVisible 
        ? 'animate-in slide-in-from-right-full opacity-100' 
        : 'animate-out slide-out-to-right-full opacity-0'
    }`}>
      <div className="font-medium">{message}</div>
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
  const [activeCategory, setActiveCategory] = useState<string>('Entradas');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Estado para autocompletado
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs para manejar clicks
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { customers } = useCustomers();
  const { getDailySpecialsByCategory, getAllItems } = useMenu();

  // Efecto para cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto para filtrar sugerencias
  useEffect(() => {
    if (customerName.trim().length > 1) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerName.toLowerCase()) ||
        customer.phone.includes(customerName)
      ).slice(0, 5);
      
      setCustomerSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  }, [customerName, customers]);

  // Cargar pedidos desde localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('restaurant-orders');
    if (savedOrders) {
      console.log('Pedidos cargados desde localStorage:', JSON.parse(savedOrders).length);
    }
  }, []);

  // Función para seleccionar un cliente
  const selectCustomer = (customer: any) => {
    setCustomerName(customer.name);
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setShowSuggestions(false);
    
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    showToast(`Cliente ${customer.name} seleccionado`, 'success');
  };

  // Manejadores para el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    
    if (value.length > 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (customerName.length > 1 && customerSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 300);
  };

  // Categorías
  const categories = ['Entradas', 'Platos de Fondo', 'Bebidas'];

  // Función de búsqueda mejorada
  const getItemsToShow = () => {
    if (searchTerm) {
      const allAvailableItems = getAllItems().filter(item => item.available);
      return allAvailableItems.filter((item: MenuItem) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return getDailySpecialsByCategory(activeCategory) || [];
  };

  const currentItems = getItemsToShow();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // Funciones del carrito
  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      let newQuantity = 1;
      
      if (existing) {
        newQuantity = existing.quantity + 1;
        showToast(`${menuItem.name} (${newQuantity})`, 'success');
      } else {
        showToast(`${menuItem.name} añadido`, 'success');
      }

      if (existing) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: newQuantity, menuItem }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1, notes: '' }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const itemToRemove = prev.find(item => item.menuItem.id === itemId);
      if (itemToRemove) {
        showToast(`${itemToRemove.menuItem.name} eliminado`, 'error');
      }
      return prev.filter(item => item.menuItem.id !== itemId);
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId);
      return;
    }
    
    const allAvailableItems = getAllItems().filter(item => item.available);
    const updatedMenuItem = allAvailableItems.find((item: MenuItem) => item.id === itemId);
    
    setCart(prev =>
      prev.map(item => {
        if (item.menuItem.id === itemId) {
          const menuItem = updatedMenuItem || item.menuItem;
          if (menuItem && quantity < item.quantity) {
            showToast(`${menuItem.name} (${quantity})`, 'error');
          } else if (menuItem && quantity > item.quantity) {
            showToast(`${menuItem.name} (${quantity})`, 'success');
          }
          return { ...item, quantity, menuItem };
        }
        return item;
      })
    );
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  // Funciones de órdenes
  const saveOrderToStorage = (order: Order) => {
    const existingOrders = localStorage.getItem('restaurant-orders');
    const orders = existingOrders ? JSON.parse(existingOrders) : [];
    orders.push(order);
    localStorage.setItem('restaurant-orders', JSON.stringify(orders));
    console.log('Pedido guardado en localStorage:', order);
  };

  const createOrder = () => {
    if (cart.length === 0) {
      showToast('El pedido está vacío', 'error');
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

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 pb-20 lg:pb-6">
        {/* Notificación Toast */}
        {toast && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Header Móvil */}
          <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-red-200">
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
                
                <button
                  onClick={() => setShowCartDrawer(true)}
                  className="relative bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
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
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-8 w-8 text-red-500" />
                  </div>
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
                      className="flex-1 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drawer del Carrito Móvil */}
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
                      <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-8 w-8 text-red-500" />
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
                                  <Minus size={12} />
                                </button>
                                <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-sm font-bold text-gray-700"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.menuItem.id)}
                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="text-right text-sm font-semibold text-red-600 mt-2">
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
                        <span className="text-2xl font-bold text-red-600">
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

          {/* VERSIÓN ESCRITORIO */}
          <div className="hidden lg:block">
            <div className="flex space-x-6 py-6">
              {/* Columna Izquierda - Datos del Cliente y Menú */}
              <div className="flex-1 max-w-2xl">
                {/* Header Desktop */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Recepción de Pedidos</h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${
                          activeTab === 'phone' ? 'bg-blue-500' : 
                          activeTab === 'walk-in' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">
                          {activeTab === 'phone' ? 'Teléfono' : activeTab === 'walk-in' ? 'Local' : 'Delivery'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Items en pedido</div>
                        <div className="text-xl font-bold text-red-600">{totalItems}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-xl font-bold text-green-600">S/ {getTotal().toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Datos del Cliente</h3>
                  
                  <div className="space-y-4">
                    {/* Tipo de Pedido */}
                    <div className="flex space-x-3">
                      {[
                        { type: 'phone', label: '📞 Teléfono', title: 'Teléfono' },
                        { type: 'walk-in', label: '👤 Local', title: 'Local' },
                        { type: 'delivery', label: '📍 Delivery', title: 'Delivery' }
                      ].map(({ type, label, title }) => (
                        <button
                          key={type}
                          onClick={() => setActiveTab(type as any)}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                            activeTab === type
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{label}</div>
                        </button>
                      ))}
                    </div>

                    {/* Nombre con Autocompletado */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del cliente *</label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={customerName}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Ingresa nombre o teléfono"
                        required
                      />
                      
                      {/* Lista de Sugerencias */}
                      {showSuggestions && customerSuggestions.length > 0 && (
                        <div 
                          ref={suggestionsRef}
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {customerSuggestions.map((customer) => (
                            <div
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="p-3 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {customer.name}
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    📞 {customer.phone}
                                  </div>
                                </div>
                                <div className="text-right ml-2">
                                  <div className="text-xs font-semibold text-green-600">
                                    {customer.orders_count} pedidos
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Teléfono */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Número de teléfono"
                          required
                        />
                      </div>

                      {/* Dirección (solo delivery) */}
                      {activeTab === 'delivery' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Dirección de envío"
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notas del pedido</label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Notas adicionales (opcional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Menú del Día */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Menú del Día</h3>
                    
                    {/* Buscador */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Buscar productos por nombre, categoría o descripción..."
                      />
                    </div>

                    {/* Categorías - Solo mostrar cuando no hay búsqueda */}
                    {!searchTerm && (
                      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
                        {categories.map(category => (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                              activeCategory === category
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Indicador de búsqueda */}
                    {searchTerm && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-blue-800 text-sm text-center">
                          🔍 Buscando en todos los productos disponibles
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Grid de Productos */}
                  <div className="grid grid-cols-2 gap-4">
                    {currentItems.map((item: MenuItem) => {
                      const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
                      const quantityInCart = cartItem ? cartItem.quantity : 0;
                      
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-red-300 transition-all relative group"
                        >
                          {quantityInCart > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                              {quantityInCart}
                            </div>
                          )}
                          
                          {/* Badge de producto del día */}
                          {item.isDailySpecial && !searchTerm && (
                            <div className="absolute -top-2 -left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                              ⭐ Del Día
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <div className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                              {item.name}
                            </div>
                            <div className="font-bold text-red-600 text-lg">
                              S/ {item.price.toFixed(2)}
                            </div>
                            {item.description && (
                              <div className="text-gray-500 text-xs mt-1 line-clamp-2">
                                {item.description}
                              </div>
                            )}
                          </div>

                          {quantityInCart > 0 ? (
                            <div className="flex items-center justify-between space-x-2">
                              <button
                                onClick={() => updateQuantity(item.id, quantityInCart - 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-medium min-w-8 text-center">{quantityInCart}</span>
                              <button
                                onClick={() => updateQuantity(item.id, quantityInCart + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm font-medium group-hover:bg-red-600"
                            >
                              <Plus size={16} />
                              <span>Agregar al Pedido</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Sin resultados */}
                  {currentItems.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-4xl text-gray-300 mb-4">
                        {searchTerm ? '🔍' : '🍽️'}
                      </div>
                      <div className="text-gray-500 text-lg mb-2">
                        {searchTerm ? 'No se encontraron productos' : 'No hay productos en esta categoría'}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Selecciona otra categoría'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha - Carrito */}
              <div className="w-96">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Tu Pedido</h3>
                    <div className="flex items-center space-x-2">
                      <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {totalItems}
                      </div>
                    </div>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-8 w-8 text-red-500" />
                      </div>
                      <div className="text-gray-500 text-lg mb-2">Tu pedido está vacío</div>
                      <div className="text-gray-400 text-sm">Agrega productos del menú</div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {cart.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">
                                  {item.menuItem.name}
                                </div>
                                <div className="text-gray-600 text-xs">
                                  S/ {item.menuItem.price.toFixed(2)} c/u
                                </div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.menuItem.id)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 bg-white rounded-lg px-3 py-1 border border-gray-200">
                                <button
                                  onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-sm font-bold text-gray-700 transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-sm font-bold text-gray-700 transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-red-600">
                                  S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
                          <span className="text-lg font-bold text-gray-900">S/ {getTotal().toFixed(2)}</span>
                        </div>
                        
                        <div className="space-y-3 mt-6">
                          <button
                            onClick={() => setCart([])}
                            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            Vaciar Carrito
                          </button>
                          <button
                            onClick={createOrder}
                            disabled={!customerName || !phone || (activeTab === 'delivery' && !address)}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 font-semibold text-lg"
                          >
                            <span>Confirmar Pedido</span>
                            <ArrowRight size={20} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MENÚ MÓVIL */}
          <div className="lg:hidden px-3 pt-4">
            {/* ... (mantener todo el código móvil existente) */}
          </div>
        </div>

        {/* Ticket oculto para impresión */}
        {lastOrder && <OrderTicket order={lastOrder} />}
      </div>
    </>
  );
};

export default OrderReception;
