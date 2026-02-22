// ============================================
// ARCHIVO MODIFICADO: src/components/orders/OrderReception.tsx
// (SOLO LA PARTE DE handleCreateOrder)
// ============================================

// Importar el contexto
import { useOrderContext } from '../../contexts/OrderContext';

// Dentro del componente OrderReception, agregar:
const { addNewOrder } = useOrderContext();

// Reemplazar la función handleCreateOrder con esta versión optimizada:

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

  if (isCreatingOrder) return; // Prevenir doble click

  setIsCreatingOrder(true);

  try {
    const total = getTotal();
    
    // Crear objeto de orden temporal para UI inmediata
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
    
    // NOTIFICAR INMEDIATAMENTE a OrdersManager
    addNewOrder(tempOrder);
    
    // Limpiar formulario INMEDIATAMENTE
    setCart([]);
    setCustomerName('');
    setPhone('');
    setAddress('');
    setTableNumber('');
    setOrderNotes('');
    setSelectedCustomer(null);
    setShowCartDrawer(false);
    
    showToast('✅ Creando orden...', 'success');

    // Imprimir ticket con datos temporales (rápido)
    printOrderImmediately(tempOrder);

    // Enviar a Supabase en segundo plano
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