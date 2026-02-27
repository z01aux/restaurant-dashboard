// ==================================================================
// ARCHIVO: src/components/sales_fullday/FullDayCashRegisterModal.tsx
// ==================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { FullDayOrder } from '../../types/fullday';

interface FullDayCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'open' | 'close';
  cashRegister: any;
  orders: FullDayOrder[];
  onConfirm: (data: { initialCash?: number; finalCash?: number; notes?: string }) => Promise<void>;
  loading: boolean;
}

export const FullDayCashRegisterModal: React.FC<FullDayCashRegisterModalProps> = ({
  isOpen,
  onClose,
  type,
  cashRegister,
  orders,
  onConfirm,
  loading,
}) => {
  const [initialCash, setInitialCash] = useState('');
  const [finalCash,   setFinalCash]   = useState('');
  const [notes,       setNotes]       = useState('');
  const [error,       setError]       = useState('');

  // Resumen del dia calculado desde los pedidos recibidos
  const todaySummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    const totalAmount = todayOrders.reduce((s, o) => s + o.total, 0);
    const totalOrders = todayOrders.length;
    const efectivo    = todayOrders.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
    const yapePlin    = todayOrders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
    const tarjeta     = todayOrders.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
    const noAplica    = todayOrders.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);

    const productMap = new Map<string, { name: string; quantity: number }>();
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const ex = productMap.get(item.name);
        if (ex) { ex.quantity += item.quantity; }
        else { productMap.set(item.name, { name: item.name, quantity: item.quantity }); }
      });
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { totalAmount, totalOrders, efectivo, yapePlin, tarjeta, noAplica, topProducts };
  }, [orders]);

  useEffect(() => {
    if (isOpen) {
      setInitialCash('');
      setFinalCash('');
      setNotes('');
      setError('');
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (type === 'open') {
      const cash = parseFloat(initialCash);
      if (isNaN(cash) || cash < 0) { setError('Ingresa un monto inicial valido'); return; }
      await onConfirm({ initialCash: cash });
    } else {
      const cash = parseFloat(finalCash);
      if (isNaN(cash) || cash < 0) { setError('Ingresa un monto final valido'); return; }
      await onConfirm({ finalCash: cash, notes });
    }
  };

  const expectedTotal = (cashRegister?.initial_cash || 0) + todaySummary.totalAmount;
  const difference    = finalCash !== '' ? parseFloat(finalCash) - expectedTotal : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header - igual que CashRegisterModal de Ordenes */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {type === 'open' ? 'Abrir Caja FullDay' : 'Cerrar Caja FullDay'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {type === 'open'
                ? 'Registra el monto inicial para comenzar las operaciones del dia'
                : 'Revisa el resumen del dia y registra el cierre de caja'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">

          {/* Resumen del dia - solo al cerrar */}
          {type === 'close' && (
            <div className="mb-6 space-y-4">

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                  <Clock size={18} className="mr-2" />
                  Resumen del Dia - FullDay
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-purple-600">Total Pedidos</div>
                    <div className="text-2xl font-bold text-purple-800">{todaySummary.totalOrders}</div>
                  </div>
                  <div>
                    <div className="text-sm text-purple-600">Total Ventas</div>
                    <div className="text-2xl font-bold text-purple-800">S/ {todaySummary.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Por Metodo de Pago</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Efectivo:</span>
                      <span className="font-semibold text-green-600">S/ {todaySummary.efectivo.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Yape/Plin:</span>
                      <span className="font-semibold text-purple-600">S/ {todaySummary.yapePlin.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tarjeta:</span>
                      <span className="font-semibold text-blue-600">S/ {todaySummary.tarjeta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">No Aplica:</span>
                      <span className="font-semibold text-gray-600">S/ {todaySummary.noAplica.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Top Productos Hoy</h4>
                  {todaySummary.topProducts.length === 0 ? (
                    <p className="text-xs text-gray-500">Sin pedidos hoy</p>
                  ) : (
                    <div className="space-y-2">
                      {todaySummary.topProducts.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate max-w-[65%]">{p.name}</span>
                          <span className="font-semibold text-indigo-600">{p.quantity} uds</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {type === 'open' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Inicial en Caja *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="0.00"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el dinero con el que empiezas el turno FullDay
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Final en Caja *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={finalCash}
                      onChange={(e) => setFinalCash(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="0.00"
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas / Observaciones
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Diferencia en caja, incidencias, etc."
                    disabled={loading}
                  />
                </div>

                {/* Diferencia esperada */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">Diferencia Esperada</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monto inicial:</span>
                      <span className="font-semibold">S/ {cashRegister?.initial_cash?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">+ Ventas del dia:</span>
                      <span className="font-semibold text-green-600">+ S/ {todaySummary.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 my-2 pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total esperado:</span>
                        <span className="text-purple-600">S/ {expectedTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    {difference !== null && (
                      <div className="flex justify-between text-sm font-bold">
                        <span>Diferencia:</span>
                        <span className={difference === 0 ? 'text-green-600' : 'text-red-600'}>
                          {difference >= 0 ? '+' : ''}S/ {difference.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>{type === 'open' ? 'Abrir Caja' : 'Cerrar Caja'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
