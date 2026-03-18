// ============================================================
// ARCHIVO: src/components/oep/OEPPaymentModal.tsx
// ACTUALIZADO: Sin "No Aplica" + soporte PAGO MIXTO
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, PieChart } from 'lucide-react';
import { OEPOrder, OEPPaymentMethod } from '../../types/oep';

// Extendemos el tipo localmente para soportar null y MIXTO
type OEPPaymentMethodExtended = OEPPaymentMethod | 'MIXTO' | null;

interface OEPSplitPaymentDetails { efectivo: number; yapePlin: number; tarjeta: number; }

interface OEPPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OEPOrder | null;
  onSave: (orderId: string, paymentMethod: OEPPaymentMethodExtended, splitDetails?: OEPSplitPaymentDetails) => Promise<void>;
  onPaymentUpdated?: (orderId: string, newMethod: OEPPaymentMethodExtended, splitDetails?: OEPSplitPaymentDetails) => void;
}

type FieldName = 'efectivo' | 'yapePlin' | 'tarjeta';

export const OEPPaymentModal: React.FC<OEPPaymentModalProps> = ({
  isOpen, onClose, order, onSave, onPaymentUpdated
}) => {
  const [selectedMethod, setSelectedMethod] = useState<OEPPaymentMethodExtended>(null);
  const [loading, setLoading] = useState(false);
  const [showSplitInputs, setShowSplitInputs] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ efectivo: '', yapePlin: '', tarjeta: '' });
  const [splitError, setSplitError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setSelectedMethod(order.payment_method);
      setShowSplitInputs((order.payment_method as string) === 'MIXTO');
      const sp = (order as any).split_payment;
      setSplitAmounts(sp
        ? { efectivo: sp.efectivo.toString(), yapePlin: sp.yapePlin.toString(), tarjeta: sp.tarjeta.toString() }
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

  const validateSplit = (): boolean => {
    const v = getNumericValues();
    const sum = v.efectivo + v.yapePlin + v.tarjeta;
    if (Math.abs(sum - total) > 0.01) {
      setSplitError(`La suma (S/ ${sum.toFixed(2)}) debe ser igual al total (S/ ${total.toFixed(2)})`);
      return false;
    }
    setSplitError(null);
    return true;
  };

  const handleSelectMethod = (value: string) => {
    if (value === 'MIXTO') { setSelectedMethod('MIXTO'); setShowSplitInputs(true); }
    else { setSelectedMethod(value as OEPPaymentMethodExtended); setShowSplitInputs(false); }
  };

  const handleSplitChange = (field: FieldName, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) { setSplitAmounts(prev => ({ ...prev, [field]: value })); setSplitError(null); }
  };

  const handleBlur = (field: FieldName) => {
    const v = splitAmounts[field];
    if (v !== '' && !isNaN(parseFloat(v))) {
      setSplitAmounts(prev => ({ ...prev, [field]: parseFloat(v).toFixed(2) }));
      setTimeout(() => autoCompleteRemaining(field), 0);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedMethod === 'MIXTO') {
        if (!validateSplit()) { setLoading(false); return; }
        const values = getNumericValues();
        await onSave(order.id, selectedMethod, values);
        if (onPaymentUpdated) onPaymentUpdated(order.id, selectedMethod, values);
      } else {
        await onSave(order.id, selectedMethod);
        if (onPaymentUpdated) onPaymentUpdated(order.id, selectedMethod);
      }
      onClose();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Sin "No Aplica" ──────────────────────────────────────────────────────
  const paymentOptions = [
    { value: 'EFECTIVO',  label: 'Efectivo',   icon: DollarSign, bg: 'bg-green-50',  border: 'border-green-500',  text: 'text-green-700'  },
    { value: 'YAPE/PLIN', label: 'Yape/Plin',  icon: Smartphone, bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
    { value: 'TARJETA',   label: 'Tarjeta',    icon: CreditCard, bg: 'bg-blue-50',   border: 'border-blue-500',   text: 'text-blue-700'   },
    { value: 'MIXTO',     label: 'Pago Mixto', icon: PieChart,   bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700' },
  ];

  const values    = getNumericValues();
  const sumDisplay = (values.efectivo + values.yapePlin + values.tarjeta).toFixed(2);
  const remaining  = (total - (values.efectivo + values.yapePlin + values.tarjeta)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg"><CreditCard size={22} className="text-white"/></div>
              <div>
                <h2 className="text-lg font-bold">Cambiar Método de Pago</h2>
                <p className="text-xs text-blue-100 mt-0.5">Pedido #{order.order_number} · 📦 OEP</p>
              </div>
            </div>
            <button onClick={onClose} disabled={loading} className="p-1.5 hover:bg-white/20 rounded-lg"><X size={20}/></button>
          </div>
        </div>

        <div className="p-5">
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="font-semibold text-gray-900">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="text-xl font-bold text-blue-600">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-5">
            <span className="text-sm font-medium text-gray-700 block mb-3">Seleccionar método de pago:</span>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map(opt => {
                const Icon = opt.icon;
                const sel = selectedMethod === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={()=>handleSelectMethod(opt.value)} disabled={loading}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${sel?`${opt.bg} ${opt.border} shadow-md scale-105`:'border-gray-200 bg-white hover:shadow-md'} ${loading?'opacity-50 cursor-not-allowed':'cursor-pointer'}`}>
                    <Icon size={20} className={sel ? opt.text : 'text-gray-500'}/>
                    <span className={`text-xs font-medium ${sel ? opt.text : 'text-gray-700'}`}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pago mixto */}
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
                    onChange={e=>handleSplitChange(field,e.target.value)} onBlur={()=>handleBlur(field)}
                    placeholder="0.00" disabled={loading}
                    className={`w-full px-3 py-2 border-2 ${border} rounded-lg text-sm focus:ring-2 ${ring} bg-white`}/>
                </div>
              ))}
              <div className="bg-white rounded-lg p-3 border border-orange-200 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Suma:</span>
                  <span className={`font-semibold ${Math.abs(parseFloat(sumDisplay)-total)<0.01?'text-green-600':'text-orange-600'}`}>S/ {sumDisplay}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total:</span>
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
            <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={!selectedMethod||loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold flex items-center justify-center space-x-2">
              {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/><span>Guardando...</span></>
                       : <><CreditCard size={18}/><span>Actualizar</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
