// =======================================================
// ARCHIVO: src/components/fullday/FullDayPaymentModal.tsx
// ACTUALIZADO: Sin "No Aplica" — solo EFECTIVO, YAPE/PLIN, TARJETA, MIXTO
// =======================================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, PieChart } from 'lucide-react';
import { FullDayOrder, FullDayPaymentMethod, FullDaySplitPaymentDetails } from '../../types/fullday';

type FieldName = 'efectivo' | 'yapePlin' | 'tarjeta';

interface FullDayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: FullDayOrder | null;
  onSave: (orderId: string, paymentMethod: FullDayPaymentMethod, splitDetails?: FullDaySplitPaymentDetails) => Promise<void>;
  onPaymentUpdated?: (orderId: string, newMethod: FullDayPaymentMethod, splitDetails?: FullDaySplitPaymentDetails) => void;
}

export const FullDayPaymentModal: React.FC<FullDayPaymentModalProps> = ({
  isOpen, onClose, order, onSave, onPaymentUpdated
}) => {
  const [selectedMethod, setSelectedMethod] = useState<FullDayPaymentMethod>(null);
  const [saving, setSaving] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ efectivo: '', yapePlin: '', tarjeta: '' });
  const [splitError, setSplitError] = useState<string | null>(null);
  const [showSplitInputs, setShowSplitInputs] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedMethod(order.payment_method);
      setShowSplitInputs(order.payment_method === 'MIXTO');
      setSplitAmounts(order.split_payment
        ? { efectivo: order.split_payment.efectivo.toString(), yapePlin: order.split_payment.yapePlin.toString(), tarjeta: order.split_payment.tarjeta.toString() }
        : { efectivo: '', yapePlin: '', tarjeta: '' }
      );
      setSplitError(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const total = order.total;

  const getNumericValues = () => ({
    efectivo: parseFloat(splitAmounts.efectivo) || 0,
    yapePlin: parseFloat(splitAmounts.yapePlin) || 0,
    tarjeta:  parseFloat(splitAmounts.tarjeta)  || 0,
  });

  const autoCompleteRemaining = (changedField: FieldName) => {
    const values = getNumericValues();
    const filled = [values.efectivo > 0, values.yapePlin > 0, values.tarjeta > 0].filter(Boolean).length;
    if (filled === 2) {
      const sum = values.efectivo + values.yapePlin + values.tarjeta;
      const remaining = total - sum;
      if (remaining >= 0 && remaining <= total) {
        const fields: FieldName[] = ['efectivo', 'yapePlin', 'tarjeta'];
        const emptyField = fields.find(f => f !== changedField && values[f] === 0) || fields.find(f => values[f] === 0);
        if (emptyField) setSplitAmounts(prev => ({ ...prev, [emptyField]: remaining.toFixed(2) }));
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
    if (value === 'MIXTO') { setSelectedMethod('MIXTO'); setShowSplitInputs(true); }
    else { setSelectedMethod(value as FullDayPaymentMethod); setShowSplitInputs(false); }
  };

  const handleSave = async () => {
    try {
      if (selectedMethod === 'MIXTO') {
        if (!validateSplitTotal()) return;
        const values = getNumericValues();
        setSaving(true);
        await onSave(order.id, selectedMethod, values);
        if (onPaymentUpdated) onPaymentUpdated(order.id, selectedMethod, values);
      } else {
        setSaving(true);
        await onSave(order.id, selectedMethod);
        if (onPaymentUpdated) onPaymentUpdated(order.id, selectedMethod);
      }
      onClose();
    } catch (error) { console.error('Error:', error); }
    finally { setSaving(false); }
  };

  const handleSplitAmountChange = (field: FieldName, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) { setSplitAmounts(prev => ({ ...prev, [field]: value })); setSplitError(null); }
  };

  const handleBlur = (field: FieldName) => {
    const value = splitAmounts[field];
    if (value !== '' && !isNaN(parseFloat(value))) {
      setSplitAmounts(prev => ({ ...prev, [field]: parseFloat(value).toFixed(2) }));
      setTimeout(() => autoCompleteRemaining(field), 0);
    }
  };

  // ── Sin "No Aplica" ───────────────────────────────────────────────────────
  const paymentOptions = [
    { value: 'EFECTIVO',  label: 'Efectivo',   icon: DollarSign, bgSel: 'bg-green-50',  borderSel: 'border-green-500',  textSel: 'text-green-700',  hoverBorder: 'hover:border-green-300'  },
    { value: 'YAPE/PLIN', label: 'Yape/Plin',  icon: Smartphone, bgSel: 'bg-purple-50', borderSel: 'border-purple-500', textSel: 'text-purple-700', hoverBorder: 'hover:border-purple-300' },
    { value: 'TARJETA',   label: 'Tarjeta',    icon: CreditCard, bgSel: 'bg-blue-50',   borderSel: 'border-blue-500',   textSel: 'text-blue-700',   hoverBorder: 'hover:border-blue-300'   },
    { value: 'MIXTO',     label: 'Pago Mixto', icon: PieChart,   bgSel: 'bg-orange-50', borderSel: 'border-orange-500', textSel: 'text-orange-700', hoverBorder: 'hover:border-orange-300' },
  ];

  const isSelected = (value: string) => selectedMethod === value;

  const getOptionClasses = (opt: typeof paymentOptions[0]) => {
    const sel = isSelected(opt.value);
    return `p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-1
      ${sel ? `${opt.bgSel} ${opt.borderSel} shadow-lg scale-105` : `border-gray-200 ${opt.hoverBorder} bg-white hover:shadow-md`}
      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
  };

  const values = getNumericValues();
  const sumDisplay = (values.efectivo + values.yapePlin + values.tarjeta).toFixed(2);
  const remaining  = (total - (values.efectivo + values.yapePlin + values.tarjeta)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-5 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg"><CreditCard size={22} className="text-white"/></div>
              <div>
                <h2 className="text-lg font-bold">Cambiar Método de Pago</h2>
                <p className="text-xs text-purple-100 mt-0.5">Pedido #{order.order_number} · 🎒 FullDay</p>
              </div>
            </div>
            <button onClick={onClose} disabled={saving} className="p-1.5 hover:bg-white/20 rounded-lg"><X size={20}/></button>
          </div>
        </div>

        <div className="p-5">
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Alumno:</span>
              <span className="font-semibold text-gray-900">{order.student_name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Grado:</span>
              <span className="text-sm text-gray-700">{order.grade} - Sec. {order.section}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="text-xl font-bold text-purple-600">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-5">
            <span className="text-sm font-medium text-gray-700 block mb-3">Seleccionar método de pago:</span>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map(opt => {
                const Icon = opt.icon;
                const sel = isSelected(opt.value);
                return (
                  <button key={opt.value} type="button" onClick={()=>handleSelectMethod(opt.value)} disabled={saving} className={getOptionClasses(opt)}>
                    <Icon size={20} className={sel ? opt.textSel : 'text-gray-500'}/>
                    <span className={`text-xs font-medium ${sel ? opt.textSel : 'text-gray-700'}`}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {showSplitInputs && (
            <div className="mb-5 bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-orange-800">🔄 Desglose Pago Mixto</span>
                <button onClick={()=>setSplitAmounts({efectivo:'',yapePlin:'',tarjeta:''})} className="text-xs text-orange-600 underline">Limpiar</button>
              </div>
              {[{field:'efectivo' as FieldName,label:'💵 Efectivo',border:'border-green-300',ring:'focus:ring-green-400'},{field:'yapePlin' as FieldName,label:'📱 Yape/Plin',border:'border-purple-300',ring:'focus:ring-purple-400'},{field:'tarjeta' as FieldName,label:'💳 Tarjeta',border:'border-blue-300',ring:'focus:ring-blue-400'}].map(({field,label,border,ring})=>(
                <div key={field} className="mb-3">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">{label} (S/)</label>
                  <input type="text" inputMode="decimal" value={splitAmounts[field]}
                    onChange={e=>handleSplitAmountChange(field,e.target.value)} onBlur={()=>handleBlur(field)}
                    placeholder="0.00" disabled={saving}
                    className={`w-full px-3 py-2 border-2 ${border} rounded-lg text-sm focus:ring-2 ${ring} bg-white`}/>
                </div>
              ))}
              <div className="bg-white rounded-lg p-3 border border-orange-200 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Suma ingresada:</span>
                  <span className={`font-semibold ${Math.abs(parseFloat(sumDisplay)-total)<0.01?'text-green-600':'text-orange-600'}`}>S/ {sumDisplay}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total a pagar:</span>
                  <span className="font-bold text-gray-900">S/ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Restante:</span>
                  <span className={`font-semibold ${parseFloat(remaining)===0?'text-green-600':parseFloat(remaining)<0?'text-red-600':'text-orange-600'}`}>S/ {remaining}</span>
                </div>
              </div>
              {splitError && <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2 border border-red-200">⚠️ {splitError}</div>}
              <p className="text-xs text-orange-600 mt-2 text-center">💡 Completa 2 campos y el tercero se autocompletará</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={saving||(!selectedMethod&&selectedMethod!==order.payment_method)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold">
              {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/><span>Guardando...</span></>
                      : <><CreditCard size={18}/><span>Actualizar Pago</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
