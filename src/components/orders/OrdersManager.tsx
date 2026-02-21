// ============================================
// ARCHIVO ULTRA-OPTIMIZADO: src/components/orders/OrdersManager.tsx
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Order } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination, isDesktopPagination, isMobilePagination } from '../../hooks/usePagination';
import { PaginationControls } from '../ui/PaginationControls';
import { OrderPreview } from './OrderPreview';
import OrderTicket from './OrderTicket';
import { exportOrdersToExcel, exportOrdersWithSummary } from '../../utils/exportUtils';
import { useSalesClosure } from '../../hooks/useSalesClosure';
import { CashRegisterModal } from '../sales/CashRegisterModal';
import { SalesHistory } from '../sales/SalesHistory';
import { PaymentSummarySimple } from './PaymentSummarySimple';

// Componente de fila memoizado
const OrderRow = React.memo(({ 
  order, 
  onMouseEnter, 
  onMouseLeave,
  onDelete,
  user,
}: {
  order: Order;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onDelete: (orderId: string, displayNumber: string) => void;
  user: any;
}) => {
  const displayNumber = order.source.type === 'phone' 
    ? order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`
    : order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;

  const getPaymentColor = (method?: string) => {
    const colors: Record<string, string> = {
      'EFECTIVO': 'bg-green-100 text-green-800 border-green-200',
      'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'TARJETA': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[method || ''] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <tr 
      className="hover:bg-gray-50 cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <td className="px-4 py-4">
        <div className="font-medium text-gray-900">{order.customerName}</div>
        <div className="text-sm font-bold text-red-600">
          S/ {order.total.toFixed(2)}
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.paymentMethod)}`}>
          {order.paymentMethod || 'NO APLICA'}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm text-gray-900">
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex space-x-2">
          <OrderTicket order={order} />
          {user?.role === 'admin' && (
            <button
              onClick={() => onDelete(order.id, displayNumber)}
              className="text-red-600 hover:text-red-800 p-2"
            >
              🗑️
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// Componente principal
const OrdersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  
  const { user } = useAuth();
  const { orders, loading, deleteOrder, exportOrdersToCSV, getTodayOrders } = useOrders();
  const { cashRegister, openCashRegister, closeCashRegister } = useSalesClosure();

  // Filtrar órdenes
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName?.toLowerCase().includes(term) ||
        order.phone?.includes(term)
      );
    }
    
    if (paymentFilter) {
      filtered = filtered.filter(order => order.paymentMethod === paymentFilter);
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, searchTerm, paymentFilter]);

  const pagination = usePagination({
    items: filteredOrders,
    itemsPerPage,
    mobileBreakpoint: 768
  });

  // Handlers
  const handleDelete = useCallback(async (id: string, number: string) => {
    if (window.confirm(`¿Eliminar orden ${number}?`)) {
      await deleteOrder(id);
    }
  }, [deleteOrder]);

  const handleOpenCash = useCallback(() => {
    setCashModalType('open');
    setShowCashModal(true);
  }, []);

  const handleCloseCash = useCallback(() => {
    setCashModalType('close');
    setShowCashModal(true);
  }, []);

  const handleCashConfirm = useCallback(async (data: any) => {
    if (cashModalType === 'open') {
      await openCashRegister(data.initialCash!);
    } else {
      await closeCashRegister(orders, data.finalCash!, data.notes || '');
    }
    setShowCashModal(false);
  }, [cashModalType, openCashRegister, closeCashRegister, orders]);

  const desktopProps = isDesktopPagination(pagination) ? {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    startIndex: pagination.startIndex,
    endIndex: pagination.endIndex,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
  } : {};

  const mobileProps = isMobilePagination(pagination) ? {
    hasMoreItems: pagination.hasMoreItems,
    loadedItems: pagination.loadedItems,
    onLoadMore: pagination.loadMore,
  } : {};

  return (
    <div className="space-y-4">
      {/* Header simple */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Órdenes</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}</span>
          {!cashRegister?.is_open ? (
            <button onClick={handleOpenCash} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
              Abrir
            </button>
          ) : (
            <button onClick={handleCloseCash} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
              Cerrar
            </button>
          )}
          <button onClick={() => setShowHistory(!showHistory)} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">
            {showHistory ? 'Ocultar' : 'Historial'}
          </button>
        </div>
      </div>

      {/* RESUMEN DE PAGOS - COMPONENTE INDEPENDIENTE */}
      <PaymentSummarySimple orders={orders} />

      {/* Botones de exportación simples */}
      <div className="flex gap-2">
        <button onClick={() => exportOrdersToCSV(getTodayOrders())} className="bg-green-500 text-white px-3 py-1 rounded text-sm">
          CSV Hoy
        </button>
        <button onClick={() => exportOrdersToExcel(getTodayOrders(), 'today')} className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">
          Excel Hoy
        </button>
        <button onClick={() => exportOrdersWithSummary(orders)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">
          Resumen
        </button>
      </div>

      <CashRegisterModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        type={cashModalType}
        cashRegister={cashRegister}
        onConfirm={handleCashConfirm}
        loading={false}
      />

      {showHistory && <SalesHistory />}

      {/* Filtros */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar..."
          className="flex-1 px-3 py-1 border rounded"
        />
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-3 py-1 border rounded">
          <option value="">Todos</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="YAPE/PLIN">Yape/Plin</option>
          <option value="TARJETA">Tarjeta</option>
        </select>
      </div>

      <PaginationControls
        {...desktopProps}
        onPageChange={pagination.goToPage}
        {...mobileProps}
        isMobile={pagination.isMobile}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        onSortChange={() => {}}
        currentSort=""
        sortOptions={[]}
      />

      {/* Tabla */}
      <div className="bg-white rounded border overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : pagination.currentItems.length === 0 ? (
          <div className="text-center py-8">No hay órdenes</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Pago</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagination.currentItems.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                  onDelete={handleDelete}
                  user={user}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrdersManager;
