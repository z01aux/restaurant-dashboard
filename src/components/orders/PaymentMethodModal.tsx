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
      onClose();
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

  const paymentOptions = [
    { value: 'EFECTIVO', label: 'Efectivo', icon: DollarSign, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-700' },
    { value: 'YAPE/PLIN', label: 'Yape/Plin', icon: Smartphone, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-500', textColor: 'text-purple-700' },
    { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-500', textColor: 'text-blue-700' },
    { value: 'none', label: 'No Aplica', icon: Minus, color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-400', textColor: 'text-gray-600' }
  ];

  const handleSelectMethod = (value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none') => {
    if (value === 'none') {
      setSelectedMethod(undefined);
    } else {
      setSelectedMethod(value);
    }
  };

  const isSelected = (value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none') => {
    if (value === 'none') {
      return selectedMethod === undefined;
    }
    return selectedMethod === value;
  };

  const getOptionClasses = (option: typeof paymentOptions[0]) => {
    const selected = isSelected(option.value as any);
    return `
      p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2
      ${selected 
        ? `${option.bgColor} ${option.borderColor} shadow-lg scale-105` 
        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
      }
      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      {/* Modal centrado */}
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all duration-300 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-red-500 to-amber-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CreditCard size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Cambiar Método de Pago</h2>
                <p className="text-xs text-red-100 mt-0.5">Orden #{order.orderNumber || order.id.slice(-8)}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Información de la orden */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="font-semibold text-gray-900">{order.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className="text-xl font-bold text-red-600">S/ {order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Método actual */}
          <div className="mb-5">
            <span className="text-sm font-medium text-gray-700 block mb-2">Método actual:</span>
            <div className="p-3 bg-gray-100 rounded-lg flex items-center space-x-3 border border-gray-200">
              {order.paymentMethod === 'EFECTIVO' && (
                <>
                  <div className="bg-green-100 p-2 rounded-full">
                    <DollarSign size={18} className="text-green-600" />
                  </div>
                  <span className="font-semibold text-green-700">EFECTIVO</span>
                </>
              )}
              {order.paymentMethod === 'YAPE/PLIN' && (
                <>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Smartphone size={18} className="text-purple-600" />
                  </div>
                  <span className="font-semibold text-purple-700">YAPE/PLIN</span>
                </>
              )}
              {order.paymentMethod === 'TARJETA' && (
                <>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <CreditCard size={18} className="text-blue-600" />
                  </div>
                  <span className="font-semibold text-blue-700">TARJETA</span>
                </>
              )}
              {!order.paymentMethod && (
                <>
                  <div className="bg-gray-200 p-2 rounded-full">
                    <Minus size={18} className="text-gray-600" />
                  </div>
                  <span className="font-semibold text-gray-600">NO APLICA</span>
                </>
              )}
            </div>
          </div>

          {/* Selección de nuevo método */}
          <div className="mb-6">
            <span className="text-sm font-medium text-gray-700 block mb-3">Seleccionar nuevo método:</span>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const selected = isSelected(option.value as any);
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectMethod(option.value as any)}
                    disabled={saving}
                    className={getOptionClasses(option)}
                  >
                    <div className={`p-2 rounded-full ${selected ? option.bgColor : 'bg-gray-100'}`}>
                      <Icon size={24} className={selected ? option.textColor : 'text-gray-600'} />
                    </div>
                    <span className={`text-sm font-medium ${selected ? option.textColor : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selectedMethod === order.paymentMethod}
              className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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