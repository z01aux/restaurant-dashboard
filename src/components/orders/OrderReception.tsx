import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, X, ShoppingBag, ArrowRight, Search, Trash2, User } from 'lucide-react';
import { MenuItem, OrderItem, Order } from '../../types';
import OrderTicket from './OrderTicket';
import { useMenu } from '../../hooks/useMenu';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrders } from '../../hooks/useOrders';

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
  const [tableNumber, setTableNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Entradas');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA'>('EFECTIVO');
  
  // Estado para autocompletado
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Estado para edición de precios
  const [editingPrices, setEditingPrices] = useState<{ [key: string]: boolean }>({});
  const [tempPrices, setTempPrices] = useState<{ [key: string]: number }>({});

  // Refs para manejar clicks
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { customers, loading: customersLoading } = useCustomers();
  const { getDailySpecialsByCategory, getAllDailySpecials } = useMenu();
  const { createOrder } = useOrders();

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

  // Función para seleccionar un cliente
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
    setTableNumber('');
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

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 300);
  };

  // Obtener items del menú
  const allMenuItems = getAllDailySpecials();
  
  // Definir categorías en el orden deseado
  const categories = ['Entradas', 'Platos de Fondo', 'Bebidas'];

  const getItemsToShow = () => {
    if (searchTerm) {
      return allMenuItems.filter((item: MenuItem) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
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
    
    const updatedMenuItem = allMenuItems.find((item: MenuItem) => item.id === itemId);
    
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

  // Funciones para edición de precios
  const enablePriceEdit = (itemId: string, currentPrice: number) => {
    setEditingPrices(prev => ({ ...prev, [itemId]: true }));
    setTempPrices(prev => ({ ...prev, [itemId]: currentPrice }));
  };

  const savePriceEdit = (itemId: string) => {
    setCart(prev =>
      prev.map(item =>
        item.menuItem.id === itemId
          ? {
              ...item,
              menuItem: {
                ...item.menuItem,
                price: tempPrices[itemId]
              }
            }
          : item
      )
    );
    setEditingPrices(prev => ({ ...prev, [itemId]: false }));
    showToast('Precio actualizado', 'success');
  };

  const cancelPriceEdit = (itemId: string) => {
    setEditingPrices(prev => ({ ...prev, [itemId]: false }));
  };

  const handleTempPriceChange = (itemId: string, value: string) => {
    const price = parseFloat(value) || 0;
    setTempPrices(prev => ({ ...prev, [itemId]: price }));
  };

  // Funciones auxiliares para obtener números de display
  const getDisplayOrderNumber = (order: Order) => {
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  };

  const getDisplayKitchenNumber = (order: Order) => {
    return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener texto del método de pago
  const getPaymentText = (paymentMethod?: string) => {
    const paymentMap = {
      'EFECTIVO': 'EFECTIVO',
      'YAPE/PLIN': 'YAPE/PLIN', 
      'TARJETA': 'TARJETA'
    };
    return paymentMethod ? paymentMap[paymentMethod as keyof typeof paymentMap] : 'NO APLICA';
  };

  // Función para obtener texto del tipo de origen
  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': 'COCINA',
      'walk-in': 'LOCAL', 
      'delivery': 'DELIVERY',
    };
    return sourceMap[sourceType] || sourceType;
  };

  // Función para generar contenido HTML del ticket - OPTIMIZADA
  const generateTicketContent = (order: Order, isKitchenTicket: boolean) => {
    if (isKitchenTicket) {
      // Obtener el nombre del usuario actual desde localStorage
      const getCurrentUserName = () => {
        try {
          const savedUser = localStorage.getItem('restaurant-user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            return userData.name || 'Sistema';
          }
        } catch (error) {
          console.error('Error obteniendo usuario:', error);
        }
        return 'Sistema';
      };

      return `
        <div class="ticket">
          <div class="center">
            <div class="bold uppercase" style="font-size: 16px; margin-bottom: 5px;">${order.customerName.toUpperCase()}</div>
            <div class="bold">** COCINA **</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="bold">CLIENTE:</span>
            <span>${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="bold">AREA:</span>
            <span>COCINA</span>
          </div>
          <div class="info-row">
            <span class="bold">COMANDA:</span>
            <span>#${getDisplayKitchenNumber(order)}</span>
          </div>
          <div class="info-row">
            <span class="bold">FECHA:</span>
            <span>${order.createdAt.toLocaleDateString('es-ES')} - ${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span class="bold">ATENDIDO POR:</span>
            <span>${getCurrentUserName().toUpperCase()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="products-header">DESCRIPCION</div>
          
          <div class="divider"></div>
          
          ${order.items.map(item => `
            <div class="product-row">
              <div class="quantity">${item.quantity}x</div>
              <div class="product-name">${item.menuItem.name.toUpperCase()}</div>
            </div>
            ${item.notes && item.notes.trim() !== '' ? `<div class="notes">- ${item.notes}</div>` : ''}
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="asterisk-line">********************************</div>
          </div>
        </div>
      `;
    } else {
      const subtotal = order.total / 1.18;
      const igv = order.total - subtotal;
      
      return `
        <div class="ticket">
          <div class="center">
            <div class="bold" style="font-size: 14px;">MARY'S RESTAURANT</div>
            <div class="bold">Av. Isabel La Católica 1254</div>
            <div class="bold">Tel: 941 778 599</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="bold">ORDEN:</span>
            <span>${getDisplayOrderNumber(order)}</span>
          </div>
          <div class="info-row">
            <span class="bold">TIPO:</span>
            <span>${getSourceText(order.source.type)}</span>
          </div>
          <div class="info-row">
            <span class="bold">FECHA:</span>
            <span>${order.createdAt.toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="bold">HORA:</span>
            <span>${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span class="bold">PAGO:</span>
            <span>${getPaymentText(order.paymentMethod)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-row bold">
            <span>CLIENTE:</span>
            <span style="max-width: 60%; word-wrap: break-word;">${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="bold">TELÉFONO:</span>
            <span>${order.phone}</span>
          </div>
          ${order.address ? `
          <div class="info-row">
            <span class="bold">DIRECCIÓN:</span>
            <span style="max-width: 60%; word-wrap: break-word;">${order.address}</span>
          </div>
          ` : ''}
          ${order.tableNumber ? `
          <div class="info-row">
            <span class="bold">MESA:</span>
            <span>${order.tableNumber}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Cant</th>
                <th>Descripción</th>
                <th style="text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td style="font-weight: bold; vertical-align: top;">${item.quantity}x</td>
                  <td style="vertical-align: top;">
                    <div style="font-weight: bold; text-transform: uppercase;">${item.menuItem.name}</div>
                    ${item.notes && item.notes.trim() !== '' ? `<div class="table-notes">Nota: ${item.notes}</div>` : ''}
                  </td>
                  <td style="text-align: right; vertical-align: top;">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div style="font-size: 11px;">
            <div class="info-row">
              <span>Subtotal:</span>
              <span>S/ ${subtotal.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span>IGV (18%):</span>
              <span>S/ ${igv.toFixed(2)}</span>
            </div>
            <div class="info-row" style="border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; font-weight: bold;">
              <span>TOTAL:</span>
              <span>S/ ${order.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="bold">¡GRACIAS POR SU PEDIDO!</div>
            <div>*** ${getSourceText(order.source.type)} ***</div>
            <div style="margin-top: 10px; font-size: 10px;">
              ${new Date().toLocaleString('es-ES', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      `;
    }
  };

  // Función optimizada para imprimir inmediatamente
  const printOrderImmediately = (order: Order) => {
    const isPhoneOrder = order.source.type === 'phone';
    
    // Crear iframe para impresión
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);

    // Generar contenido del ticket
    const ticketContent = generateTicketContent(order, isPhoneOrder);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket ${isPhoneOrder ? getDisplayKitchenNumber(order) : getDisplayOrderNumber(order)}</title>
            <style>
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                  padding: 0;
                }
                body {
                  width: 80mm !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                  font-size: 12px !important;
                }
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                width: 80mm;
                margin: 0 auto;
                padding: 8px;
                background: white;
                color: black;
              }
              .ticket {
                width: 100%;
                max-width: 80mm;
              }
              .center {
                text-align: center;
              }
              .bold {
                font-weight: bold;
              }
              .uppercase {
                text-transform: uppercase;
              }
              .divider {
                border-top: 1px solid #000;
                margin: 6px 0;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
              }
              .notes {
                font-style: italic;
                font-size: 10px;
                margin-left: 15%;
                margin-bottom: 3px;
                display: block;
                width: 85%;
              }
              .table-notes {
                font-style: italic;
                font-size: 10px;
                margin-left: 0;
                margin-top: 2px;
                display: block;
              }
              .products-header {
                text-align: center;
                font-weight: bold;
                margin: 6px 0;
                text-transform: uppercase;
                border-bottom: 1px solid #000;
                padding-bottom: 3px;
              }
              .product-row {
                display: flex;
                margin-bottom: 4px;
              }
              .quantity {
                width: 15%;
                font-weight: bold;
              }
              .product-name {
                width: 85%;
                font-weight: bold;
                text-transform: uppercase;
              }
              .asterisk-line {
                text-align: center;
                font-size: 9px;
                letter-spacing: 1px;
                margin: 3px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
              }
              th, td {
                padding: 2px 0;
                text-align: left;
                vertical-align: top;
              }
              th {
                border-bottom: 1px solid #000;
                font-weight: bold;
              }
              .notes-row td {
                padding-top: 0;
                padding-bottom: 3px;
              }
            </style>
          </head>
          <body>
            ${ticketContent}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Imprimir inmediatamente
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Limpiar el iframe después de un tiempo
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 50);
    }
  };

  // Crear orden en Supabase - VERSIÓN SUPER OPTIMIZADA
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      showToast('El pedido está vacío', 'error');
      return;
    }

    if (!customerName || !phone) {
      showToast('Por favor completa los datos del cliente', 'error');
      return;
    }

    if (activeTab === 'walk-in' && !tableNumber) {
      showToast('Por favor ingresa el número de mesa', 'error');
      return;
    }

    try {
      const result = await createOrder({
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
        showToast('✅ Orden creada exitosamente', 'success');
        
        // Crear objeto Order inmediatamente
        const newOrder: Order = {
          id: result.order.id,
          orderNumber: result.order.order_number,
          kitchenNumber: result.order.kitchen_number,
          items: cart,
          status: 'pending',
          createdAt: new Date(),
          total: getTotal(),
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

        setLastOrder(newOrder);
        
        // GUARDAR TEMPORALMENTE PARA IMPRIMIR
        const tempOrderForPrint = { ...newOrder };
        
        // Limpiar formulario inmediatamente
        setCart([]);
        setCustomerName('');
        setPhone('');
        setAddress('');
        setTableNumber('');
        setOrderNotes('');
        setSelectedCustomer(null);
        setEditingPrices({});
        setTempPrices({});
        setShowCartDrawer(false);
        setPaymentMethod('EFECTIVO');

        // IMPRIMIR INMEDIATAMENTE usando el objeto temporal
        printOrderImmediately(tempOrderForPrint);
        
      } else {
        showToast('❌ Error al crear orden: ' + result.error, 'error');
      }
    } catch (error: any) {
      showToast('❌ Error: ' + error.message, 'error');
    }
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
                      {activeTab === 'phone' ? 'Cocina' : activeTab === 'walk-in' ? 'Local' : 'Delivery'}
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
                      {/* Información de precios ajustables */}
                      {activeTab === 'walk-in' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-blue-800 text-sm">
                            <strong>💡 Precios ajustables:</strong> Puedes modificar el precio de Entradas y Platos de Fondo.
                          </div>
                        </div>
                      )}

                      {/* Método de Pago - SOLO para Local y Delivery */}
                      {(activeTab === 'walk-in' || activeTab === 'delivery') && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <label className="block text-sm font-medium text-purple-800 mb-2">
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
                                onClick={() => setPaymentMethod(method.value as any)}
                                className={`p-2 rounded-lg text-white font-medium text-sm transition-all ${
                                  paymentMethod === method.value 
                                    ? `${method.color} shadow-md transform scale-105` 
                                    : 'bg-gray-300 text-gray-600'
                                }`}
                              >
                                {method.label}
                              </button>
                            ))}
                          </div>
                          <div className="text-center text-purple-700 font-semibold mt-2">
                            {paymentMethod}
                          </div>
                        </div>
                      )}

                      {cart.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {item.menuItem.name}
                              </div>
                              
                              {/* Controles de precio móvil - SOLO para Entradas y Platos de Fondo en Local */}
                              {activeTab === 'walk-in' && 
                              (item.menuItem.category === 'Entradas' || item.menuItem.category === 'Platos de Fondo') ? (
                                <div className="mt-2">
                                  {editingPrices[item.menuItem.id] ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={tempPrices[item.menuItem.id] || item.menuItem.price}
                                        onChange={(e) => handleTempPriceChange(item.menuItem.id, e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500"
                                        placeholder="Precio"
                                      />
                                      <button
                                        onClick={() => savePriceEdit(item.menuItem.id)}
                                        className="text-green-600 hover:text-green-800 text-sm font-medium px-2"
                                      >
                                        ✅
                                      </button>
                                      <button
                                        onClick={() => cancelPriceEdit(item.menuItem.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium px-2"
                                      >
                                        ❌
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600 text-xs">
                                        S/ {item.menuItem.price.toFixed(2)} c/u
                                      </span>
                                      <button
                                        onClick={() => enablePriceEdit(item.menuItem.id, item.menuItem.price)}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                      >
                                        ✏️ Editar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-600 text-xs">
                                  S/ {item.menuItem.price.toFixed(2)} c/u
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3 ml-3">
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
                          onClick={handleCreateOrder}
                          disabled={!customerName || !phone || (activeTab === 'walk-in' && !tableNumber)}
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
                    { type: 'phone', label: '📞', title: 'Cocina' },
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

                {/* Nombre con Autocompletado */}
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
                  
                  {/* Lista de Sugerencias Móvil */}
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

                {/* Mesa (solo para Local) */}
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

                {/* Método de Pago - SOLO para Local y Delivery */}
                {(activeTab === 'walk-in' || activeTab === 'delivery') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'EFECTIVO', label: '💵 Efectivo', color: 'bg-green-500' },
                        { value: 'YAPE/PLIN', label: '📱 Yape/Plin', color: 'bg-purple-500' },
                        { value: 'TARJETA', label: '💳 Tarjeta', color: 'bg-blue-500' }
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value as any)}
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
                      { type: 'phone', label: '📞 Cocina' },
                      { type: 'walk-in', label: '👤 Local' },
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

                  {/* Método de Pago - SOLO para Local y Delivery */}
                  {(activeTab === 'walk-in' || activeTab === 'delivery') && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pago *
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'EFECTIVO', label: '💵 Efectivo', color: 'border-green-500 bg-green-50 text-green-700' },
                          { value: 'YAPE/PLIN', label: '📱 Yape/Plin', color: 'border-purple-500 bg-purple-50 text-purple-700' },
                          { value: 'TARJETA', label: '💳 Tarjeta', color: 'border-blue-500 bg-blue-50 text-blue-700' }
                        ].map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setPaymentMethod(method.value as any)}
                            className={`w-full p-2 rounded-lg border-2 text-left transition-all ${
                              paymentMethod === method.value 
                                ? `${method.color} shadow-sm` 
                                : 'border-gray-200 text-gray-700'
                            }`}
                          >
                            <div className="font-semibold text-sm">{method.label}</div>
                          </button>
                        ))}
                      </div>
                      <div className="text-center text-lg font-bold text-gray-900 mt-2">
                        {paymentMethod}
                      </div>
                    </div>
                  )}
                </div>

                {/* Formulario del Cliente */}
                <div className="md:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Campo de Nombre con Autocompletado */}
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

                      {/* Lista de Sugerencias Desktop */}
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

                    {/* Campo de Mesa (solo para Local) */}
                    {activeTab === 'walk-in' && (
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mesa *
                        </label>
                        <input
                          type="text"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Número de mesa"
                          required
                        />
                      </div>
                    )}

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
                      {/* Información de precios ajustables */}
                      {activeTab === 'walk-in' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-blue-800 text-sm">
                            <strong>💡 Precios ajustables:</strong> Puedes modificar el precio de Entradas y Platos de Fondo para pedidos en local.
                          </div>
                        </div>
                      )}

                      {/* Método de Pago - SOLO para Local y Delivery */}
                      {(activeTab === 'walk-in' || activeTab === 'delivery') && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <label className="block text-sm font-medium text-purple-800 mb-2">
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
                                onClick={() => setPaymentMethod(method.value as any)}
                                className={`p-2 rounded-lg text-white font-medium text-sm transition-all ${
                                  paymentMethod === method.value 
                                    ? `${method.color} shadow-md transform scale-105` 
                                    : 'bg-gray-300 text-gray-600'
                                }`}
                              >
                                {method.label}
                              </button>
                            ))}
                          </div>
                          <div className="text-center text-purple-700 font-semibold mt-2">
                            {paymentMethod}
                          </div>
                        </div>
                      )}

                      {/* Lista de Items */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {cart.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0 mr-3">
                                <div className="font-medium text-gray-900 text-sm break-words">
                                  {item.menuItem.name}
                                </div>
                                
                                {/* Controles de precio - SOLO para Entradas y Platos de Fondo en Local */}
                                {activeTab === 'walk-in' && 
                                (item.menuItem.category === 'Entradas' || item.menuItem.category === 'Platos de Fondo') ? (
                                  <div className="mt-2">
                                    {editingPrices[item.menuItem.id] ? (
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={tempPrices[item.menuItem.id] || item.menuItem.price}
                                          onChange={(e) => handleTempPriceChange(item.menuItem.id, e.target.value)}
                                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500"
                                          placeholder="Precio"
                                        />
                                        <button
                                          onClick={() => savePriceEdit(item.menuItem.id)}
                                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                                        >
                                          ✅
                                        </button>
                                        <button
                                          onClick={() => cancelPriceEdit(item.menuItem.id)}
                                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                          ❌
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 text-xs">
                                          Precio: S/ {item.menuItem.price.toFixed(2)}
                                        </span>
                                        <button
                                          onClick={() => enablePriceEdit(item.menuItem.id, item.menuItem.price)}
                                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                        >
                                          ✏️ Editar
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-600 text-xs mt-1">
                                    S/ {item.menuItem.price.toFixed(2)} c/u
                                  </div>
                                )}
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
                            onClick={handleCreateOrder}
                            disabled={!customerName || !phone || (activeTab === 'walk-in' && !tableNumber)}
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
