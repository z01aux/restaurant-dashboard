// ============================================
// FUNCIÓN handleCreateOrder EN OrderReception.tsx (COMPLETA)
// ============================================

const handleCreateOrder = useCallback(async () => {
  if (cart.length === 0) {
    showToast('El pedido está vacío', 'error');
    return;
  }

  if (activeTab === 'fullDay') {
    if (!studentName || !guardianName) {
      showToast('Completa los datos del alumno', 'error');
      return;
    }
  } else {
    if (!customerName || !phone) {
      showToast('Completa los datos del cliente', 'error');
      return;
    }
  }

  if (activeTab === 'walk-in' && !tableNumber) {
    showToast('Ingresa el número de mesa', 'error');
    return;
  }

  if ((activeTab === 'walk-in' || activeTab === 'delivery' || activeTab === 'fullDay') && !paymentMethod) {
    showToast('Selecciona un método de pago', 'error');
    return;
  }

  if (isCreatingOrder) return;

  setIsCreatingOrder(true);

  try {
    const total = getTotal();
    
    if (activeTab === 'fullDay') {
      // Crear pedido en tabla fullday
      const result = await createFullDayOrder({
        student_id: selectedStudentId,
        student_name: studentName,
        grade: selectedGrade,
        section: selectedSection,
        guardian_name: guardianName,
        phone: phone || undefined,
        items: cart.map(item => ({
          menuItem: {
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
          },
          quantity: item.quantity,
          notes: item.notes,
        })),
        payment_method: paymentMethod,
        notes: orderNotes
      });

      if (result.success) {
        showToast('✅ Pedido FullDay guardado', 'success');
        
        // Crear orden temporal solo para imprimir ticket - CON IGV 10%
        const tempOrder: Order = {
          id: 'temp-' + Date.now(),
          orderNumber: `FLD-${Date.now().toString().slice(-8)}`,
          items: cart,
          status: 'pending',
          createdAt: new Date(),
          total: total,
          customerName: studentName,
          phone: phone || 'Sin teléfono',
          source: { type: 'fullDay' },
          notes: orderNotes,
          paymentMethod: paymentMethod,
          studentInfo: {
            fullName: studentName,
            grade: selectedGrade,
            section: selectedSection,
            guardianName: guardianName,
            phone: phone
          },
          orderType: 'fullday',
          igvRate: 10 // NUEVO: Indicar que el IGV es 10%
        };
        
        printOrderImmediately(tempOrder);
      } else {
        showToast('❌ Error al guardar: ' + result.error, 'error');
      }
    } else {
      // Crear pedido regular en tabla orders
      const orderData: any = {
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
        })),
        orderType: 'regular'
      };

      // Crear orden temporal para imprimir ticket - CON IGV 10%
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
        address: address,
        tableNumber: tableNumber,
        source: orderData.source,
        notes: orderNotes,
        paymentMethod: orderData.paymentMethod,
        orderType: 'regular',
        igvRate: 10 // NUEVO: Indicar que el IGV es 10%
      };

      printOrderImmediately(tempOrder);

      const result = await createOrder(orderData);

      if (result.success) {
        showToast('✅ Orden guardada', 'success');
      } else {
        showToast('❌ Error al guardar: ' + result.error, 'error');
      }
    }
    
    // Limpiar todo después de crear el pedido
    setCart([]);
    setCustomerName('');
    setPhone('');
    setAddress('');
    setTableNumber('');
    setOrderNotes('');
    setCustomerSearchTerm('');
    setStudentName('');
    setGuardianName('');
    setStudentSearchTerm('');
    setSelectedStudentId(null);
    setShowCartDrawer(false);
    
  } catch (error: any) {
    showToast('❌ Error: ' + error.message, 'error');
    console.error('Error in handleCreateOrder:', error);
  } finally {
    setIsCreatingOrder(false);
  }
}, [
  cart, customerName, phone, activeTab, tableNumber, address, orderNotes, 
  paymentMethod, createOrder, createFullDayOrder, getTotal, showToast, 
  printOrderImmediately, isCreatingOrder, studentName, guardianName, 
  selectedGrade, selectedSection, selectedStudentId
]);