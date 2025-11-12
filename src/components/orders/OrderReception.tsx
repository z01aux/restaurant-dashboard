import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, X, ShoppingBag, ArrowRight, Search, Trash2, User } from 'lucide-react';
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
  const [activeCategory, setActiveCategory] = useState<string>('🥗 Entradas');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Estado para autocompletado
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Refs para manejar clicks
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { customers, loading: customersLoading } = useCustomers();
  const { menuItems: menuDelDia, getCategories, getAllItems } = useMenu();

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

  // Función para seleccionar un cliente (CORREGIDA PARA MÓVIL)
  const selectCustomer = (customer: any) => {
    setCustomerName(customer.name);
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setSelectedCustomer(customer);
    setShowSuggestions(false);
    
    // Blur del input para cerrar el teclado en móvil
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    showToast(`Cliente ${customer.name} seleccionado`, 'success');
  };

  // Función para limpiar selección de cliente
  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setPhone('');
    setAddress('');
    setShowSuggestions(false);
  };

  // Manejadores para el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    setSelectedCustomer(null);
    
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

  // CORREGIDO: Aumentado el delay para móvil
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 300);
  };

  // Obtener items del menú
  const allMenuItems = getAllItems();
  const categories = getCategories();

  const getItemsToShow = () => {
    if (searchTerm) {
      return allMenuItems.filter((item: MenuItem) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return menuDelDia[activeCategory] || [];
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
    
    const updatedMenuItem = allMenuItems.find(item => item.id === itemId);
    
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
      setSelectedCustomer(null);
      
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

          {/* MENÚ MÓVIL */}
          <div className="lg:hidden px-3 pt-4">
            {/* Información del Cliente */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Datos del Cliente</h3>
              
              <div className="space-y-3">
                {/* Tipo de Pedido */}
                <div className="flex space-x-2">
                  {[
                    { type: 'phone', label: '📞', title: 'Teléfono' },
                    { type: 'walk-in', label: '👤', title: 'Local' },
                    { type: 'delivery', label: '📍', title: 'Delivery' }
                  ].map(({ type, label, title }) => (
                    <button
                      key={type}
                      onClick={() => setActiveTab(type as any)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        activeTab === type
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{label}</div>
                      <div className="text-xs font-medium">{title}</div>
                    </button>
                  ))}
                </div>

                {/* Nombre con Autocompletado CORREGIDO */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customerName}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Nombre del cliente *"
                    required
                  />
                  
                  {/* Lista de Sugerencias Móvil CORREGIDA */}
                  {showSuggestions && customerSuggestions.length > 0 && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {customerSuggestions.map((customer) => (
                        <div
                          key={customer.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectCustomer(customer);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            selectCustomer(customer);
                          }}
                          className="p-3 hover:bg-red-50 active:bg-red-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">
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

                {/* Teléfono */}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Teléfono *"
                  required
                />

                {/* Dirección (solo delivery) */}
                {activeTab === 'delivery' && (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Dirección de envío *"
                    required
                  />
                )}

                {/* Notas */}
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Notas del pedido (opcional)"
                />
              </div>
            </div>

            {/* Menú del Día */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-20">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Menú del Día</h3>
                
                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Buscar productos..."
                  />
                </div>
              </div>

              {/* Categorías */}
              {!searchTerm && (
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeCategory === category
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid de Productos */}
              <div className="grid grid-cols-2 gap-3">
                {currentItems.map((item: MenuItem) => {
                  const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-3 border border-gray-200 hover:border-red-300 transition-all relative"
                      onClick={() => addToCart(item)}
                    >
                      {quantityInCart > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                          {quantityInCart}
                        </div>
                      )}
                      
                      <div className="mb-2">
                        <div className="font-semibold text-gray-900 text-xs mb-1 line-clamp-2 min-h-[2rem]">
                          {item.name}
                        </div>
                        <div className="font-bold text-red-600 text-sm">
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>

                      {quantityInCart > 0 ? (
                        <div className="flex items-center justify-between space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, quantityInCart - 1);
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded-lg"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-medium">{quantityInCart}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, quantityInCart + 1);
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-lg"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item);
                          }}
                          className="w-full bg-red-500 text-white py-1.5 rounded-lg flex items-center justify-center space-x-1 text-xs font-medium"
                        >
                          <Plus size={12} />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sin resultados */}
              {currentItems.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-3xl text-gray-300 mb-2">🔍</div>
                  <div className="text-gray-500 text-sm">No se encontraron productos</div>
                </div>
              )}
            </div>
          </div>

          {/* LAYOUT COMPACTO PARA ESCRITORIO */}
          <div className="hidden lg:block">
            {/* Información del Cliente con Autocompletado */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Información del Pedido</h2>
                {selectedCustomer && (
                  <button
                    onClick={clearCustomerSelection}
                    className="text-sm text-red-500 hover:text-red-700 flex items-center space-x-1"
                  >
                    <X size={14} />
                    <span>Cambiar cliente</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Tipo de Pedido */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Pedido</label>
                  <div className="space-y-2">
                    {[
                      { type: 'phone', label: '📞 Teléfono' },
                      { type: 'walk-in', label: '👤 Paso por Local' },
                      { type: 'delivery', label: '📍 Delivery' }
                    ].map(({ type, label }) => (
                      <button
                        key={type}
                        onClick={() => setActiveTab(type as any)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          activeTab === type
                            ? 'border-red-500 bg-red-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-sm">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulario del Cliente */}
                <div className="md:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Campo de Nombre con Autocompletado CORREGIDO */}
                    <div className="relative md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Cliente *
                      </label>
                      <div className="relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={customerName}
                          onChange={handleInputChange}
                          onFocus={handleInputFocus}
                          onBlur={handleInputBlur}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-10"
                          placeholder="Buscar cliente..."
                          required
                        />
                        {customersLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                          </div>
                        )}
                      </div>

                      {/* Lista de Sugerencias Desktop CORREGIDA */}
                      {showSuggestions && customerSuggestions.length > 0 && (
                        <div 
                          ref={suggestionsRef}
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          {customerSuggestions.map((customer) => (
                            <div
                              key={customer.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectCustomer(customer);
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                selectCustomer(customer);
                              }}
                              className="p-3 hover:bg-red-50 active:bg-red-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-amber-500 rounded-full flex items-center justify-center">
                                  <User size={14} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm truncate">
                                    {customer.name}
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    📞 {customer.phone}
                                  </div>
                                  {customer.address && (
                                    <div className="text-gray-500 text-xs truncate">
                                      📍 {customer.address}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-semibold text-green-600">
                                    {customer.orders_count} pedidos
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    S/ {customer.total_spent.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Campo de Teléfono */}
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Número de teléfono"
                        required
                      />
                    </div>

                    {/* Campo de Dirección (solo para delivery) */}
                    {activeTab === 'delivery' && (
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dirección de Envío *
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Dirección completa"
                          required
                        />
                      </div>
                    )}

                    {/* Indicador de Cliente Seleccionado */}
                    {selectedCustomer && (
                      <div className="md:col-span-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <User size={16} className="text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-green-800">
                                  {selectedCustomer.name}
                                </div>
                                <div className="text-green-600 text-sm">
                                  Cliente frecuente • {selectedCustomer.orders_count} pedidos
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-800">
                                Total gastado: S/ {selectedCustomer.total_spent.toFixed(2)}
                              </div>
                              <div className="text-green-600 text-xs">
                                Último pedido: {selectedCustomer.last_order ? 
                                  new Date(selectedCustomer.last_order).toLocaleDateString() : 
                                  'Nunca'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notas del Pedido */}
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas del Pedido
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Instrucciones especiales..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Menú y Carrito - LADO A LADO */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Menú del Día - Ocupa 2/3 del espacio */}
              <div className="xl:col-span-2">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Menú del Día</h2>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Grid de Productos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentItems.map((item: MenuItem) => {
                      const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
                      const quantityInCart = cartItem ? cartItem.quantity : 0;
                      
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-4 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200 cursor-pointer relative"
                          onClick={() => addToCart(item)}
                        >
                          {/* Badge de cantidad en carrito */}
                          {quantityInCart > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                              {quantityInCart}
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-gray-600 text-xs mb-2 line-clamp-2">
                                {item.description}
                              </div>
                            )}
                            <div className="font-bold text-red-600 text-sm">
                              S/ {item.price.toFixed(2)}
                            </div>
                          </div>

                          {/* Botones de cantidad */}
                          <div className="flex items-center justify-between">
                            {quantityInCart > 0 ? (
                              <div className="flex items-center space-x-2 w-full">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, quantityInCart - 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-1"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {quantityInCart}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, quantityInCart + 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-1"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(item);
                                }}
                                className="w-full bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
                              >
                                <Plus size={14} />
                                <span>Agregar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resultados de Búsqueda */}
                  {searchTerm && currentItems.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl text-gray-300 mb-3">🔍</div>
                      <div className="text-gray-500 text-sm">No se encontraron productos</div>
                      <div className="text-gray-400 text-xs">Intenta con otros términos</div>
                    </div>
                  )}

                  {/* Estado vacío cuando no hay productos en la categoría */}
                  {!searchTerm && currentItems.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl text-gray-300 mb-3">🍽️</div>
                      <div className="text-gray-500 text-sm">No hay productos en esta categoría</div>
                      <div className="text-gray-400 text-xs">Selecciona otra categoría</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Carrito - Ocupa 1/3 del espacio */}
              <div className="xl:col-span-1">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Tu Pedido</h2>
                      <p className="text-sm text-gray-600">{totalItems} productos</p>
                    </div>
                    <div className="bg-red-500 text-white p-2 rounded-lg">
                      <ShoppingBag size={20} />
                    </div>
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
                    <div className="space-y-4">
                      {/* Lista de Items */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {cart.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0 mr-3">
                                <div className="font-medium text-gray-900 text-sm break-words">
                                  {item.menuItem.name}
                                </div>
                                <div className="text-gray-600 text-xs mt-1">
                                  S/ {item.menuItem.price.toFixed(2)} c/u
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
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
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="text-right text-sm font-semibold text-red-600">
                              S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total y Acciones */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-red-600">
                            S/ {getTotal().toFixed(2)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={() => setCart([])}
                            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            Vaciar Carrito
                          </button>
                          <button
                            onClick={createOrder}
                            disabled={!customerName || !phone}
                            className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white py-3 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 font-semibold"
                          >
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
        </div>

        {/* Ticket oculto para impresión */}
        {lastOrder && <OrderTicket order={lastOrder} />}
      </div>
    </>
  );
};

export default OrderReception;
