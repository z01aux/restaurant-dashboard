import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, Minus } from 'lucide-react';
import { Order } from '../../types';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (orderId: string, paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | undefined) => Promise<void>;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Resetear cuando se abre con una nueva orden
  useEffect(() => {
    if (order) {
      setSelectedMethod(order.paymentMethod);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSave = async () => {
    if (selectedMethod === order.paymentMethod) {
      onClose(); // No hay cambios, solo cerrar
      return;
    }

    setSaving(true);
    try {
      await onSave(order.id, selectedMethod);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Definir las opciones de pago con tipos explícitos
  const paymentOptions: Array<{
    value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none';
    label: string;
    icon: any;
    color: string;
  }> = [
    { value: 'EFECTIVO', label: 'Efectivo', icon: DollarSign, color: 'green' },
    { value: 'YAPE/PLIN', label: 'Yape/Plin', icon: Smartphone, color: 'purple' },
    { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
    { value: 'none', label: 'No Aplica', icon: Minus, color: 'gray' }
  ];

  // Función para manejar la selección
  const handleSelectMethod = (value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none') => {
    if (value === 'none') {
      setSelectedMethod(undefined);
    } else {
      setSelectedMethod(value);
    }
  };

  // Función para determinar si una opción está seleccionada
  const isSelected = (value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none') => {
    if (value === 'none') {
      return selectedMethod === undefined;
    }
    return selectedMethod === value;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard size={20} />
              <h2 className="text-lg font-bold">Cambiar Método de Pago</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Información de la orden */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Orden:</span>
              <span className="font-semibold text-gray-900">
                {order.orderNumber || `ORD-${order.id.slice(-8)}`}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="font-semibold text-gray-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className="font-bold text-red-600">S/ {order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Método actual */}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Método actual:</span>
            <div className="mt-1 p-3 bg-gray-100 rounded-lg flex items-center space-x-2">
              {order.paymentMethod === 'EFECTIVO' && <DollarSign size={18} className="text-green-600" />}
              {order.paymentMethod === 'YAPE/PLIN' && <Smartphone size={18} className="text-purple-600" />}
              {order.paymentMethod === 'TARJETA' && <CreditCard size={18} className="text-blue-600" />}
              {!order.paymentMethod && <Minus size={18} className="text-gray-600" />}
              <span className="font-medium">
                {order.paymentMethod || 'NO APLICA'}
              </span>
            </div>
          </div>

          {/* Selección de nuevo método */}
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Nuevo método de pago:
          </label>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              const selected = isSelected(option.value);
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectMethod(option.value)}
                  disabled={saving}
                  className={`
                    p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2
                    ${selected 
                      ? `border-${option.color}-500 bg-${option.color}-50` 
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }
                    ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Icon size={24} className={`text-${option.color}-600`} />
                  <span className={`text-sm font-medium text-${option.color}-800`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selectedMethod === order.paymentMethod}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Actualizar Pago</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};