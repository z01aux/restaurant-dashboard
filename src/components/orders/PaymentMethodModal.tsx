import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, PieChart, ArrowRight } from 'lucide-react';
import { Order, PaymentMethod, SplitPaymentDetails } from '../../types';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (orderId: string, paymentMethod: PaymentMethod | undefined, splitDetails?: SplitPaymentDetails) => Promise<void>;
}

type FieldName = 'efectivo' | 'yapePlin' | 'tarjeta';

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({
    efectivo: '',
    yapePlin: '',
    tarjeta: '',
  });
  const [splitError, setSplitError] = useState<string | null>(null);
  const [showSplitInputs, setShowSplitInputs] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedMethod(order.paymentMethod);
      if (order.splitPayment) {
        setSplitAmounts({
          efectivo: order.splitPayment.efectivo.toString(),
          yapePlin: order.splitPayment.yapePlin.toString(),
          tarjeta: order.splitPayment.tarjeta.toString(),
        });
      } else {
        setSplitAmounts({ efectivo: '', yapePlin: '', tarjeta: '' });
      }
      setSplitError(null);
      setShowSplitInputs(order.paymentMethod === 'MIXTO');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const total = order.total;

  // Función para obtener valores numéricos (0 si está vacío)
  const getNumericValues = () => ({
    efectivo: splitAmounts.efectivo === '' ? 0 : parseFloat(splitAmounts.efectivo) || 0,
    yapePlin: splitAmounts.yapePlin === '' ? 0 : parseFloat(splitAmounts.yapePlin) || 0,
    tarjeta: splitAmounts.tarjeta === '' ? 0 : parseFloat(splitAmounts.tarjeta) || 0,
  });

  // Función para contar cuántos campos tienen valor
  const getFilledFieldsCount = () => {
    const values = getNumericValues();
    return [
      values.efectivo > 0,
      values.yapePlin > 0,
      values.tarjeta > 0
    ].filter(Boolean).length;
  };

  // Función para autocompletar el campo restante
  const autoCompleteRemaining = (changedField: FieldName) => {
    const values = getNumericValues();
    const filledCount = getFilledFieldsCount();
    
    // Si hay exactamente 2 campos llenos (valores > 0), autocompletar el tercero
    if (filledCount === 2) {
      const sum = values.efectivo + values.yapePlin + values.tarjeta;
      const remaining = total - sum;
      
      // Solo autocompletar si el restante es positivo o cero
      if (remaining >= 0 && remaining <= total) {
        const fields: FieldName[] = ['efectivo', 'yapePlin', 'tarjeta'];
        const emptyField = fields.find(f => 
          f !== changedField && values[f] === 0
        ) || fields.find(f => values[f] === 0);
        
        if (emptyField) {
          setSplitAmounts(prev => ({
            ...prev,
            [emptyField]: remaining.toFixed(2)
          }));
        }
      }
    }
  };

  const validateSplitTotal = (): boolean => {
    const values = getNumericValues();
    const sum = values.efectivo + values.yapePlin + values.tarjeta;
    
    if (Math.abs(sum - total) > 0.01) {
      setSplitError(`La suma (S/ ${sum.toFixed(2)}) debe ser igual al total (S/ ${total.toFixed(2)})`);
      return false;
    }
    setSplitError(null);
    return true;
  };

  const handleSelectMethod = (value: string) => {
    if (value === 'MIXTO') {
      setSelectedMethod('MIXTO');
      setShowSplitInputs(true);
    } else {
      setSelectedMethod(value as PaymentMethod);
      setShowSplitInputs(false);
    }
  };

  const handleSave = async () => {
    try {
      if (selectedMethod === 'MIXTO') {
        if (!validateSplitTotal()) {
          return;
        }
        const values = getNumericValues();
        setSaving(true);
        await onSave(order.id, selectedMethod, values);
      } else {
        setSaving(true);
        await onSave(order.id, selectedMethod);
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSplitAmountChange = (field: FieldName, value: string) => {
    // Permitir solo números, punto decimal y vacío
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSplitAmounts(prev => ({ ...prev, [field]: value }));
      setSplitError(null);
    }
  };

  const handleBlur = (field: FieldName) => {
    const value = splitAmounts[field];
    if (value !== '' && !isNaN(parseFloat(value))) {
      const numValue = parseFloat(value);
      setSplitAmounts(prev => ({ 
        ...prev, 
        [field]: numValue.toFixed(2) 
      }));
      
      // Intentar autocompletar después de formatear
      setTimeout(() => autoCompleteRemaining(field), 0);
    }
  };

  // Función para limpiar todos los campos
  const handleClearAll = () => {
    setSplitAmounts({ efectivo: '', yapePlin: '', tarjeta: '' });
    setSplitError(null);
  };

  const paymentOptions = [
    { value: 'EFECTIVO', label: 'Efectivo', icon: DollarSign },
    { value: 'YAPE/PLIN', label: 'Yape/Plin', icon: Smartphone },
    { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
    { value: 'MIXTO', label: 'Pago Mixto', icon: PieChart }
  ];

  const isSelected = (value: string) => selectedMethod === value;

  const getOptionClasses = (value: string) => {
    const selected = isSelected(value);
    let colorClass = '';
    
    if (value === 'EFECTIVO') colorClass = selected ? 'bg-green-50 border-green-500' : 'border-gray-200 hover:border-green-300';
    else if (value === 'YAPE/PLIN') colorClass = selected ? 'bg-purple-50 border-purple-500' : 'border-gray-200 hover:border-purple-300';
    else if (value === 'TARJETA') colorClass = selected ? 'bg-blue-50 border-blue-500' : 'border-gray-200 hover:border-blue-300';
    else if (value === 'MIXTO') colorClass = selected ? 'bg-orange-50 border-orange-500' : 'border-gray-200 hover:border-orange-300';
    
    return `
      p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-1 sm:space-y-2
      ${colorClass}
      ${selected ? 'shadow-lg scale-105' : 'bg-white hover:shadow-md'}
      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `;
  };

  const getIconColor = (value: string, selected: boolean) => {
    if (!selected) return 'text-gray-600';
    if (value === 'EFECTIVO') return 'text-green-600';
    if (value === 'YAPE/PLIN') return 'text-purple-600';
    if (value === 'TARJETA') return 'text-blue-600';
    if (value === 'MIXTO') return 'text-orange-600';
    return 'text-gray-600';
  };

  const getTextColor = (value: string, selected: boolean) => {
    if (!selected) return 'text-gray-700';
    if (value === 'EFECTIVO') return 'text-green-700';
    if (value === 'YAPE/PLIN') return 'text-purple-700';
    if (value === 'TARJETA') return 'text-blue-700';
    if (value === 'MIXTO') return 'text-orange-700';
    return 'text-gray-700';
  };

  const values = getNumericValues();
  const sumDisplay = (values.efectivo + values.yapePlin + values.tarjeta).toFixed(2);
  const remainingTotal = (total - (values.efectivo + values.yapePlin + values.tarjeta)).toFixed(2);
  const filledCount = getFilledFieldsCount();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-amber-500 p-4 sm:p-5 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
                <CreditCard size={20} className="sm:w-[22px] sm:h-[22px] text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">Cambiar Método de Pago</h2>
                <p className="text-xs text-red-100 mt-0.5 truncate max-w-[180px] sm:max-w-full">
                  Orden #{order.orderNumber || order.id.slice(-8)}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              disabled={saving}
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6">
          {/* Información de la orden */}
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-gray-600">Cliente:</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-[250px]">
                {order.customerName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Monto:</span>
              <span className="text-lg sm:text-xl font-bold text-red-600">
                S/ {order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Método actual */}
          <div className="mb-4 sm:mb-5">
            <span className="text-xs sm:text-sm font-medium text-gray-700 block mb-1 sm:mb-2">
              Método actual:
            </span>
            <div className="p-2 sm:p-3 bg-gray-100 rounded-lg flex items-center space-x-2 sm:space-x-3 border border-gray-200">
              {!order.paymentMethod && (
                <>
                  <div className="bg-gray-200 p-1.5 sm:p-2 rounded-full">
                    <PieChart size={16} className="sm:w-[18px] sm:h-[18px] text-gray-600" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-600">SIN PAGO</span>
                </>
              )}
              {order.paymentMethod === 'EFECTIVO' && (
                <>
                  <div className="bg-green-100 p-1.5 sm:p-2 rounded-full">
                    <DollarSign size={16} className="sm:w-[18px] sm:h-[18px] text-green-600" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-green-700">EFECTIVO</span>
                </>
              )}
              {order.paymentMethod === 'YAPE/PLIN' && (
                <>
                  <div className="bg-purple-100 p-1.5 sm:p-2 rounded-full">
                    <Smartphone size={16} className="sm:w-[18px] sm:h-[18px] text-purple-600" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-purple-700">YAPE/PLIN</span>
                </>
              )}
              {order.paymentMethod === 'TARJETA' && (
                <>
                  <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full">
                    <CreditCard size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-blue-700">TARJETA</span>
                </>
              )}
              {order.paymentMethod === 'MIXTO' && (
                <>
                  <div className="bg-orange-100 p-1.5 sm:p-2 rounded-full">
                    <PieChart size={16} className="sm:w-[18px] sm:h-[18px] text-orange-600" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-orange-700">PAGO MIXTO</span>
                </>
              )}
            </div>
          </div>

          {/* Selección de nuevo método */}
          <div className="mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm font-medium text-gray-700 block mb-2 sm:mb-3">
              Seleccionar nuevo método:
            </span>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const selected = isSelected(option.value);
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectMethod(option.value)}
                    disabled={saving}
                    className={getOptionClasses(option.value)}
                  >
                    <div className={`p-1.5 sm:p-2 rounded-full ${selected ? 'bg-white' : 'bg-gray-100'}`}>
                      <Icon size={18} className={`sm:w-6 sm:h-6 ${getIconColor(option.value, selected)}`} />
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${getTextColor(option.value, selected)}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* INTERFAZ PARA PAGO MIXTO - CON AUTOCOMPLETADO */}
          {showSplitInputs && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-orange-800">
                  Distribuir pago de S/ {total.toFixed(2)}
                </h3>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-orange-600 hover:text-orange-800 px-2 py-1 bg-orange-100 rounded"
                >
                  Limpiar
                </button>
              </div>

              {/* Indicador de autocompletado */}
              {filledCount === 2 && (
                <div className="mb-3 p-2 bg-green-100 text-green-700 rounded-lg text-xs flex items-center">
                  <ArrowRight size={14} className="mr-1" />
                  El campo restante se autocompletará automáticamente
                </div>
              )}

              {/* Monto restante por asignar */}
              {parseFloat(remainingTotal) > 0 && filledCount < 3 && (
                <div className="mb-3 p-2 bg-blue-100 text-blue-700 rounded-lg text-xs">
                  Por asignar: S/ {remainingTotal}
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">
                    Efectivo (S/)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={splitAmounts.efectivo}
                    onChange={(e) => handleSplitAmountChange('efectivo', e.target.value)}
                    onBlur={() => handleBlur('efectivo')}
                    className="w-full px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">
                    Yape/Plin (S/)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={splitAmounts.yapePlin}
                    onChange={(e) => handleSplitAmountChange('yapePlin', e.target.value)}
                    onBlur={() => handleBlur('yapePlin')}
                    className="w-full px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">
                    Tarjeta (S/)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={splitAmounts.tarjeta}
                    onChange={(e) => handleSplitAmountChange('tarjeta', e.target.value)}
                    onBlur={() => handleBlur('tarjeta')}
                    className="w-full px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
                {splitError && (
                  <div className="text-xs text-red-600 font-medium mt-1">
                    {splitError}
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm font-medium pt-2 border-t border-orange-200">
                  <span>Total distribuido:</span>
                  <span className={splitError ? 'text-red-600' : 'text-green-600'}>
                    S/ {sumDisplay}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedMethod || selectedMethod === order.paymentMethod}
              className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-1.5 sm:space-x-2 text-sm sm:text-base font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Actualizar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};