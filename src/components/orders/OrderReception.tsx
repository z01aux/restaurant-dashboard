import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Minus, X, ShoppingBag, Trash2, Edit2, Check, DollarSign } from 'lucide-react';
import { MenuItem, OrderItem, Order } from '../../types';
import OrderTicket from './OrderTicket';
import { useMenu } from '../../hooks/useMenu';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrders } from '../../hooks/useOrders';
import { useOrderContext } from '../../contexts/OrderContext';

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

// Componente de Notificación Toast - Memoizado
const ToastNotification: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}> = React.memo(({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      isVisible 
        ? 'animate-in slide-in-from-right-full opacity-100' 
        : 'animate-out slide-out-to-right-full opacity-0'
    }`}>
      <div className="font-medium text-sm">{message}</div>
    </div>
  );
});

// Componente de Item del Carrito con Edición de Precio
const CartItem: React.FC<{
  item: OrderItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onPriceChange: (itemId: string, newPrice: number) => void;
}> = React.memo(({
  item,
  onUpdateQuantity,
  onRemove,
  onPriceChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrice, setTempPrice] = useState(item.menuItem.price.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempPrice(item.menuItem.price.toString());
  }, [item.menuItem.price]);

  const handleCancelEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setTempPrice(item.menuItem.price.toString());
  }, [item.menuItem.price]);

  const handleSavePrice = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceChange(item.menuItem.id, newPrice);
      setIsEditing(false);
    }
  }, [tempPrice, item.menuItem.id, onPriceChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const newPrice = parseFloat(tempPrice);
      if (!isNaN(newPrice) && newPrice > 0) {
        onPriceChange(item.menuItem.id, newPrice);
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempPrice(item.menuItem.price.toString());
    }
  }, [tempPrice, item.menuItem.id, item.menuItem.price, onPriceChange]);

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-2">
          <div className="font-medium text-gray-900 text-sm break-words flex items-center gap-2">
            {item.menuItem.name}
            <button
              onClick={handleStartEdit}
              className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
              title="Editar precio"
            >
              <Edit2 size={12} />
            </button>
          </div>
          
          <div className="mt-1">
            {isEditing ? (
              <div className="flex items-center space-x-1 bg-blue-50 p-1 rounded-lg border border-blue-200">
                <DollarSign size={14} className="text-blue-600" />
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-20 px-1 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Precio"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={handleSavePrice}
                  className="text-green-600 hover:text-green-800 p-1 hover:bg-green-100 rounded transition-colors"
                  title="Guardar"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded transition-colors"
                  title="Cancelar"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className="text-gray-600 text-xs">
                S/ {item.menuItem.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-1 py-1">
            <button
              onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center font-medium text-xs">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          <button
            onClick={() => onRemove(item.menuItem.id)}
            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="text-right text-sm font-bold text-red-600 mt-1">
        S/ {(item.menuItem.price * item.quantity).toFixed(2)}
      </div>
    </div>
  );
});

// Componente de Producto del Menú
const MenuProduct: React.FC<{
  item: MenuItem;
  quantityInCart: number;
  onAddToCart: (menuItem: MenuItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}> = React.memo(({ item, quantityInCart, onAddToCart, onUpdateQuantity }) => {
  const handleAdd = useCallback(() => {
    onAddToCart(item);
  }, [item, onAddToCart]);

  const handleDecrement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(item.id, quantityInCart - 1);
  }, [item.id, quantityInCart, onUpdateQuantity]);

  const handleIncrement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(item.id, quantityInCart + 1);
  }, [item.id, quantityInCart, onUpdateQuantity]);

  return (
    <div
      className="bg-white rounded-lg p-2 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all relative cursor-pointer group"
      onClick={handleAdd}
    >
      {quantityInCart > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
          {quantityInCart}
        </div>
      )}
      
      <div className="mb-1">
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
            onClick={handleDecrement}
            className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="text-xs font-medium w-6 text-center">{quantityInCart}</span>
          <button
            onClick={handleIncrement}
            className="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleAdd}
          className="w-full bg-red-500 text-white py-1.5 rounded-lg flex items-center justify-center space-x-1 text-xs font-medium hover:bg-red-600 transition-colors"
        >
          <Plus size={12} />
          <span>Agregar</span>
        </button>
      )}
    </div>
  );
});

const OrderReception: React.FC = React.memo(() => {
  const [activeTab, setActiveTab] = useState<'phone' | 'walk-in' | 'delivery'>('phone');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Entradas');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA'>('EFECTIVO');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  // Estado para autocompletado
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Refs para manejar clicks
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { customers } = useCustomers();
  const { getDailySpecialsByCategory, getAllDailySpecials } = useMenu();
  const { createOrder } = useOrders();
  const { addNewOrder } = useOrderContext();

  // Memoizar datos del menú
  const allMenuItems = useMemo(() => getAllDailySpecials(), [getAllDailySpecials]);
  
  // Definir categorías
  const categories = useMemo(() => ['Entradas', 'Platos de Fondo', 'Bebidas'], []);

  // Memoizar items filtrados
  const currentItems = useMemo(() => {
    if (searchTerm) {
      return allMenuItems.filter((item: MenuItem) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return getDailySpecialsByCategory(activeCategory) || [];
  }, [allMenuItems, searchTerm, activeCategory, getDailySpecialsByCategory]);

  // Memoizar sugerencias de clientes
  useEffect(() => {
    if (customerName.trim().length > 1) {
      const searchLower = customerName.toLowerCase();
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phone.includes(customerName)
      ).slice(0, 5);
      
      setCustomerSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  }, [customerName, customers]);

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

  // Callbacks optimizados
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const selectCustomer = useCallback((customer: any) => {
    setCustomerName(customer.name);
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setSelectedCustomer(customer);
    setShowSuggestions(false);
    showToast(`Cliente seleccionado`, 'success');
  }, [showToast]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    setSelectedCustomer(null);
    
    if (value.length > 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  // Funciones del carrito
  const addToCart = useCallback((menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      
      if (existing) {
        showToast(`${menuItem.name} +1`, 'success');
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1, menuItem }
            : item
        );
      }
      showToast(`${menuItem.name} añadido`, 'success');
      return [...prev, { menuItem, quantity: 1, notes: '' }];
    });
  }, [showToast]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => {
      const itemToRemove = prev.find(item => item.menuItem.id === itemId);
      if (itemToRemove) {
        showToast(`${itemToRemove.menuItem.name} eliminado`, 'info');
      }
      return prev.filter(item => item.menuItem.id !== itemId);
    });
  }, [showToast]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
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
  }, [removeFromCart]);

  const handlePriceChange = useCallback((itemId: string, newPrice: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.menuItem.id === itemId) {
          return {
            ...item,
            menuItem: {
              ...item.menuItem,
              price: newPrice
            }
          };
        }
        return item;
      })
    );
    showToast(`Precio actualizado`, 'info');
  }, [showToast]);

  // Cálculos memoizados
  const getTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  }, [cart]);

  const totalItems = useMemo(() => 
    cart.reduce((total, item) => total + item.quantity, 0), 
    [cart]
  );

  // Handlers
  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handlePaymentMethodChange = useCallback((method: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA') => {
    setPaymentMethod(method);
  }, []);

  const handleShowCartDrawer = useCallback((show: boolean) => {
    setShowCartDrawer(show);
  }, []);

  const clearCart = useCallback(() => {
    if (cart.length > 0 && window.confirm('¿Vaciar carrito?')) {
      setCart([]);
      showToast('Carrito vaciado', 'info');
    }
  }, [cart.length, showToast]);

  // Función para imprimir
  const printOrderImmediately = useCallback((order: Order) => {
    const isPhoneOrder = order.source.type === 'phone';
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);

    const generateTicketContent = () => {
      if (isPhoneOrder) {
        return `
          <div class="ticket">
            <div class="center">
              <div class="header-title uppercase" style="font-size: 16px;">${order.customerName.toUpperCase()}</div>
              <div class="header-title">** COCINA **</div>
              <div class="divider"></div>
            </div>
            <div class="info-row">
              <span class="label">CLIENTE:</span>
              <span class="customer-name-bold">${order.customerName.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="label">COMANDA:</span>
              <span class="value">#${order.kitchenNumber || `COM-${order.id.slice(-8)}`}</span>
            </div>
            <div class="divider"></div>
            <div class="products-header">PRODUCTOS</div>
            ${order.items.map(item => `
              <div class="product-row">
                <div class="quantity">${item.quantity}x</div>
                <div class="product-name">${item.menuItem.name.toUpperCase()}</div>
              </div>
            `).join('')}
            <div class="divider"></div>
          </div>
        `;
      } else {
        return `
          <div class="ticket">
            <div class="center">
              <div class="header-title">MARY'S RESTAURANT</div>
              <div class="header-subtitle">RUC: 20505262086</div>
              <div class="divider"></div>
            </div>
            <div class="info-row">
              <span class="label">ORDEN:</span>
              <span class="value">${order.orderNumber || `ORD-${order.id.slice(-8)}`}</span>
            </div>
            <div class="info-row">
              <span class="label">CLIENTE:</span>
              <span class="customer-name-bold">${order.customerName.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="label">TOTAL:</span>
              <span class="label">S/ ${order.total.toFixed(2)}</span>
            </div>
            <div class="center">¡GRACIAS!</div>
          </div>
        `;
      }
    };
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket</title>
            <style>
              @media print {
                @page { size: 80mm auto; margin: 0; }
                body { width: 80mm; margin: 0; padding: 5px; font-size: 12px; }
              }
            </style>
          </head>
          <body>
            ${generateTicketContent()}
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 500);
      }, 50);
    }
  }, []);

  // Crear orden
  const handleCreateOrder = useCallback(async () => {
    if (cart.length === 0) {
      showToast('El pedido está vacío', 'error');
      return;
    }

    if (!customerName || !phone) {
      showToast('Completa los datos del cliente', 'error');
      return;
    }

    if (activeTab === 'walk-in' && !tableNumber) {
      showToast('Ingresa el número de mesa', 'error');
      return;
    }

    if (isCreatingOrder) return;

    setIsCreatingOrder(true);

    try {
      const total = getTotal();
      
      const tempOrder: Order = {
        id: 'temp-' + Date.now(),
        orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
        kitchenNumber: activeTab === 'phone' ? `COM-${Date.now().toString().slice(-8)}` : undefined,
        items: cart,
        status: 'pending',
        createdAt: new Date(),
        total: total,
        customerName: customerName,
        phone: phone,
        address: activeTab === 'delivery' ? address : undefined,
        tableNumber: activeTab === 'walk-in' ? tableNumber : undefined,
        source: {
          type: activeTab,
          ...(activeTab === 'delivery' && { deliveryAddress: address })
        },
        notes: orderNotes,
        paymentMethod: activeTab !== 'phone' ? paymentMethod : undefined,
      };

      setLastOrder(tempOrder);
      
      // NOTIFICAR INMEDIATAMENTE
      addNewOrder(tempOrder);
      
      // Limpiar formulario
      setCart([]);
      setCustomerName('');
      setPhone('');
      setAddress('');
      setTableNumber('');
      setOrderNotes('');
      setSelectedCustomer(null);
      setShowCartDrawer(false);
      
      showToast('✅ Creando orden...', 'success');
      printOrderImmediately(tempOrder);

      const result = await createOrder({
        customerName,
        phone,
        address: activeTab === 'delivery' ? address : undefined,
        tableNumber: activeTab === 'walk-in' ? tableNumber : undefined,
        source: {
          type: activeTab,
          ...(activeTab === 'delivery' && { deliveryAddress: address })
        },
        notes: orderNotes,
        paymentMethod: activeTab !== 'phone' ? paymentMethod : undefined,
        items: cart.map(item => ({
          menuItem: {
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
          },
          quantity: item.quantity,
          notes: item.notes,
        }))
      });

      if (result.success) {
        showToast('✅ Orden guardada', 'success');
      } else {
        showToast('❌ Error al guardar', 'error');
      }
      
    } catch (error: any) {
      showToast('❌ Error: ' + error.message, 'error');
    } finally {
      setIsCreatingOrder(false);
    }
  }, [
    cart, customerName, phone, activeTab, tableNumber, address, orderNotes, 
    paymentMethod, createOrder, getTotal, showToast, printOrderImmediately, 
    isCreatingOrder, addNewOrder
  ]);

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
                  <h1 className="text-xl font-bold text-gray-900">Recepción</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as any)}
                      className="text-xs bg-gray-100 rounded-lg px-2 py-1 border border-gray-300"
                    >
                      <option value="phone">📞 Cocina</option>
                      <option value="walk-in">👤 Local</option>
                      <option value="delivery">🚚 Delivery</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={() => handleShowCartDrawer(true)}
                  className="relative bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2"
                >
                  <ShoppingBag size={20} />
                  <div className="text-left">
                    <div className="text-xs font-medium">Pedido</div>
                    <div className="text-xs opacity-90">{totalItems} items</div>
                  </div>
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Contenido Móvil */}
          <div className="lg:hidden px-3 pt-4">
            {/* Formulario de cliente móvil */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Datos del Cliente</h3>
              
              <div className="space-y-3">
                {/* Nombre con autocompletado */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Nombre del cliente *"
                    required
                  />
                  
                  {showSuggestions && customerSuggestions.length > 0 && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {customerSuggestions.map((customer) => (
                        <div
                          key={customer.id}
                          onMouseDown={() => selectCustomer(customer)}
                          className="p-3 hover:bg-red-50 cursor-pointer border-b border-gray-100"
                        >
                          <div className="font-medium text-gray-900 text-sm">{customer.name}</div>
                          <div className="text-gray-600 text-xs">📞 {customer.phone}</div>
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

                {/* Mesa (solo Local) */}
                {activeTab === 'walk-in' && (
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Número de mesa *"
                    required
                  />
                )}

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

                {/* Método de pago */}
                {(activeTab === 'walk-in' || activeTab === 'delivery') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'EFECTIVO', label: '💵', color: 'bg-green-500' },
                        { value: 'YAPE/PLIN', label: '📱', color: 'bg-purple-500' },
                        { value: 'TARJETA', label: '💳', color: 'bg-blue-500' }
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => handlePaymentMethodChange(method.value as any)}
                          className={`p-2 rounded-lg text-white font-medium text-xs transition-all ${
                            paymentMethod === method.value 
                              ? `${method.color} shadow-md transform scale-105` 
                              : 'bg-gray-300 text-gray-600'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Menú */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-20">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Menú del Día</h3>
              
              {/* Buscador */}
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                placeholder="Buscar productos..."
              />

              {/* Categorías */}
              {!searchTerm && (
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
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

              {/* Grid de productos */}
              <div className="grid grid-cols-2 gap-3">
                {currentItems.map((item: MenuItem) => {
                  const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  
                  return (
                    <MenuProduct
                      key={item.id}
                      item={item}
                      quantityInCart={quantityInCart}
                      onAddToCart={addToCart}
                      onUpdateQuantity={updateQuantity}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drawer del Carrito Móvil */}
          {showCartDrawer && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => handleShowCartDrawer(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Tu Pedido</h3>
                      <p className="text-sm text-gray-600">{totalItems} productos</p>
                    </div>
                    <button
                      onClick={() => handleShowCartDrawer(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Tu pedido está vacío</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {cart.map((item, index) => (
                          <CartItem
                            key={`${item.menuItem.id}-${index}`}
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                            onPriceChange={handlePriceChange}
                          />
                        ))}
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-red-600">
                            S/ {getTotal().toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={clearCart}
                          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                        >
                          Vaciar Carrito
                        </button>
                        <button
                          onClick={handleCreateOrder}
                          disabled={!customerName || !phone || (activeTab === 'walk-in' && !tableNumber)}
                          className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white py-4 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                        >
                          Confirmar Pedido
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Versión Desktop (simplificada) */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-3 gap-6">
              {/* Columna izquierda: Formulario */}
              <div className="col-span-1">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Nuevo Pedido</h2>
                  
                  <div className="space-y-4">
                    {/* Tipo de pedido */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                      <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="phone">📞 Cocina</option>
                        <option value="walk-in">👤 Local</option>
                        <option value="delivery">🚚 Delivery</option>
                      </select>
                    </div>

                    {/* Cliente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={handleInputChange}
                        placeholder="Nombre *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Teléfono *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Datos adicionales */}
                    {activeTab === 'walk-in' && (
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Mesa *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    )}

                    {activeTab === 'delivery' && (
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Dirección *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    )}

                    {/* Método de pago */}
                    {(activeTab === 'walk-in' || activeTab === 'delivery') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pago</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['EFECTIVO', 'YAPE/PLIN', 'TARJETA'].map(method => (
                            <button
                              key={method}
                              onClick={() => handlePaymentMethodChange(method as any)}
                              className={`p-2 rounded-lg text-xs font-medium ${
                                paymentMethod === method
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {method === 'EFECTIVO' ? '💵' : method === 'YAPE/PLIN' ? '📱' : '💳'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna central: Menú */}
              <div className="col-span-1">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Menú</h2>
                  
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Buscar..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                  />

                  {!searchTerm && (
                    <div className="flex space-x-2 mb-4 overflow-x-auto">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
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

                  <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                    {currentItems.map((item: MenuItem) => {
                      const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
                      const quantityInCart = cartItem ? cartItem.quantity : 0;
                      
                      return (
                        <MenuProduct
                          key={item.id}
                          item={item}
                          quantityInCart={quantityInCart}
                          onAddToCart={addToCart}
                          onUpdateQuantity={updateQuantity}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Columna derecha: Carrito */}
              <div className="col-span-1">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Pedido</h2>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Carrito vacío</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                        {cart.map((item, index) => (
                          <CartItem
                            key={`${item.menuItem.id}-${index}`}
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                            onPriceChange={handlePriceChange}
                          />
                        ))}
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Total:</span>
                          <span className="text-xl font-bold text-red-600">
                            S/ {getTotal().toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={clearCart}
                          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mb-2"
                        >
                          Vaciar
                        </button>
                        <button
                          onClick={handleCreateOrder}
                          disabled={!customerName || !phone || (activeTab === 'walk-in' && !tableNumber)}
                          className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white py-3 rounded-lg hover:shadow-md disabled:opacity-50 font-semibold"
                        >
                          Confirmar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket oculto */}
        {lastOrder && <OrderTicket order={lastOrder} />}
      </div>
    </>
  );
});

export default OrderReception;