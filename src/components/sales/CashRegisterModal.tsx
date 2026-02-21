// ============================================
// ARCHIVO COMPLETO: src/components/sales/CashRegisterModal.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Order } from '../../types';
import { DailySummary } from '../../types/sales';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'open' | 'close';
  cashRegister: any;
  todaySummary?: DailySummary;
  onConfirm: (data: { initialCash?: number; finalCash?: number; notes?: string }) => Promise<void>;
  loading: boolean;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose,
  type,
  cashRegister,
  todaySummary,
  onConfirm,
  loading,
}) => {
  const [initialCash, setInitialCash] = useState('');
  const [finalCash, setFinalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

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
      if (isNaN(cash) || cash < 0) {
        setError('Ingresa un monto inicial válido');
        return;
      }
      await onConfirm({ initialCash: cash });
    } else {
      const cash = parseFloat(finalCash);
      if (isNaN(cash) || cash < 0) {
        setError('Ingresa un monto final válido');
        return;
      }
      await onConfirm({ finalCash: cash, notes });
    }
  };

  const calculateExpectedTotal = () => {
    if (!cashRegister || !todaySummary) return 0;
    return (cashRegister.initial_cash || 0) + todaySummary.total_amount;
  };

  const calculateDifference = () => {
    if (!finalCash || !cashRegister || !todaySummary) return 0;
    const expected = calculateExpectedTotal();
    return parseFloat(finalCash) - expected;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {type === 'open' ? '🔓 Abrir Caja' : '🔒 Cerrar Caja'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {type === 'open' 
                ? 'Registra el monto inicial para comenzar las operaciones del día'
                : 'Revisa el resumen del día y registra el cierre de caja'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Resumen si es cierre */}
          {type === 'close' && todaySummary && (
            <div className="mb-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <Clock size={18} className="mr-2" />
                  Resumen del Día
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-blue-600">Total Órdenes</div>
                    <div className="text-2xl font-bold text-blue-800">
                      {todaySummary.total_orders}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">Total Ventas</div>
                    <div className="text-2xl font-bold text-blue-800">
                      S/ {todaySummary.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Por método de pago */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">💰 Por Método de Pago</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Efectivo:</span>
                      <span className="font-semibold text-green-600">
                        S/ {todaySummary.by_payment_method.EFECTIVO.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Yape/Plin:</span>
                      <span className="font-semibold text-purple-600">
                        S/ {todaySummary.by_payment_method.YAPE_PLIN.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tarjeta:</span>
                      <span className="font-semibold text-blue-600">
                        S/ {todaySummary.by_payment_method.TARJETA.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">No Aplica:</span>
                      <span className="font-semibold text-gray-600">
                        S/ {todaySummary.by_payment_method.NO_APLICA.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Por tipo de pedido */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">📋 Por Tipo de Pedido</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-semibold text-orange-600">
                        S/ {todaySummary.by_order_type.delivery.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Local:</span>
                      <span className="font-semibold text-green-600">
                        S/ {todaySummary.by_order_type.walk_in.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cocina:</span>
                      <span className="font-semibold text-blue-600">
                        S/ {todaySummary.by_order_type.phone.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top productos */}
              {todaySummary.top_products.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="font-medium text-amber-700 mb-3">🔥 Productos Más Vendidos</h4>
                  <div className="space-y-2">
                    {todaySummary.top_products.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex justify-between text-sm">
                        <span className="text-amber-800">
                          {index + 1}. {product.name}
                        </span>
                        <span className="font-semibold text-amber-900">
                          {product.quantity} und • S/ {product.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.00"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el dinero con el que empiezas el turno
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0.00"
                      required
                      disabled={loading}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Ej: Diferencia en caja, incidencias, etc."
                    disabled={loading}
                  />
                </div>

                {/* Diferencia esperada */}
                {todaySummary && cashRegister && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">📊 Diferencia Esperada</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monto inicial:</span>
                        <span className="font-semibold">S/ {cashRegister.initial_cash?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">+ Ventas del día:</span>
                        <span className="font-semibold text-green-600">
                          + S/ {todaySummary.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 my-2 pt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total esperado:</span>
                          <span className="text-blue-600">
                            S/ {calculateExpectedTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {finalCash && (
                        <div className="flex justify-between text-sm font-bold">
                          <span>Diferencia:</span>
                          <span className={calculateDifference() === 0 ? 'text-green-600' : 'text-red-600'}>
                            S/ {calculateDifference().toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

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
                className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-3 rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
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