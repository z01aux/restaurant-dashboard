// ============================================
// ARCHIVO: src/components/billing/EmitirComprobanteModal.tsx
// ACTUALIZADO:
//  - Items ordenados alfabéticamente
//  - Prop yaEmitido: bloquea y muestra estado cuando ya se emitió
// ============================================

import React, { useState } from 'react';
import { X, FileText, Receipt, Loader, CheckCircle } from 'lucide-react';
import { Order } from '../../types';
import { useNubefact } from '../../hooks/useNubefact';
import type { NubefactRespuestaComprobante } from '../../types/nubefact';

interface EmitirComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  proximoNumeroBoleta: number;
  proximoNumeroFactura: number;
  onEmitido?: (respuesta: NubefactRespuestaComprobante, tipo: 'boleta' | 'factura') => void;
  /** Si ya tiene comprobante emitido, bloquea la emisión */
  yaEmitido?: boolean;
}

type TipoComprobante = 'boleta' | 'factura';

export const EmitirComprobanteModal: React.FC<EmitirComprobanteModalProps> = ({
  isOpen,
  onClose,
  order,
  proximoNumeroBoleta,
  proximoNumeroFactura,
  onEmitido,
  yaEmitido = false,
}) => {
  const [tipo, setTipo]               = useState<TipoComprobante>('boleta');
  const [clienteDni, setClienteDni]   = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteRuc, setClienteRuc]   = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [direccion, setDireccion]     = useState('');
  const [email, setEmail]             = useState('');

  const { loading, emitirBoleta, emitirFactura } = useNubefact();

  if (!isOpen || !order) return null;

  const handleEmitir = async () => {
    if (yaEmitido) return;
    if (tipo === 'boleta') {
      const res = await emitirBoleta(order, {
        numero:        proximoNumeroBoleta,
        clienteDni:    clienteDni || '-',
        clienteNombre: clienteNombre || 'CLIENTES VARIOS',
        clienteEmail:  email || undefined,
      });
      if (res && onEmitido) onEmitido(res, 'boleta');
      if (res) onClose();
    } else {
      if (!clienteRuc.trim() || clienteRuc.length !== 11) {
        alert('❌ El RUC debe tener exactamente 11 dígitos');
        return;
      }
      if (!razonSocial.trim()) {
        alert('❌ La razón social es obligatoria para facturas');
        return;
      }
      const res = await emitirFactura(order, {
        numero:             proximoNumeroFactura,
        clienteRuc:         clienteRuc.trim(),
        clienteRazonSocial: razonSocial,
        clienteDireccion:   direccion || undefined,
        clienteEmail:       email || undefined,
      });
      if (res && onEmitido) onEmitido(res, 'factura');
      if (res) onClose();
    }
  };

  const medioPago = order.paymentMethod || 'NO APLICA';

  // ── Items ordenados alfabéticamente ──────────────────────────────────────
  const itemsOrdenados = [...order.items].sort((a, b) =>
    a.menuItem.name.localeCompare(b.menuItem.name, 'es')
  );

  const isBlocked = yaEmitido || loading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              yaEmitido
                ? 'bg-green-100'
                : 'bg-gradient-to-r from-red-500 to-amber-500'
            }`}>
              {yaEmitido
                ? <CheckCircle className="h-5 w-5 text-green-600" />
                : <Receipt className="h-5 w-5 text-white" />
              }
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {yaEmitido ? 'Comprobante ya emitido' : 'Emitir Comprobante'}
              </h3>
              <p className="text-sm text-gray-500">
                Orden #{order.orderNumber || order.id.slice(-6).toUpperCase()} — S/ {order.total.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Banner bloqueado ── */}
        {yaEmitido && (
          <div className="mx-5 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Esta orden ya tiene un comprobante electrónico emitido. No se puede emitir otro.
            </p>
          </div>
        )}

        {/* ── Resumen de la orden ── */}
        <div className="mx-5 mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium text-gray-900">{order.customerName || 'Sin nombre'}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Pago:</span>
            <span className="font-medium text-gray-900">{medioPago}</span>
          </div>
          {/* Items ordenados */}
          <div className="border-t border-gray-200 pt-2 space-y-0.5">
            {itemsOrdenados.map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-gray-600">
                <span>{item.quantity}× {item.menuItem.name}</span>
                <span className="font-medium text-gray-800">
                  S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
              <span>Total</span>
              <span>S/ {order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── Contenido (bloqueado si yaEmitido) ── */}
        <div className={`p-5 ${yaEmitido ? 'opacity-40 pointer-events-none select-none' : ''}`}>

          {/* Selector tipo */}
          <p className="text-sm font-medium text-gray-700 mb-3">Tipo de comprobante</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setTipo('boleta')}
              disabled={isBlocked}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                tipo === 'boleta'
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Receipt size={18} />
              <span>Boleta B001-{String(proximoNumeroBoleta).padStart(8, '0')}</span>
            </button>
            <button
              onClick={() => setTipo('factura')}
              disabled={isBlocked}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                tipo === 'factura'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <FileText size={18} />
              <span>Factura F001-{String(proximoNumeroFactura).padStart(8, '0')}</span>
            </button>
          </div>

          {/* Campos Boleta */}
          {tipo === 'boleta' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input type="text" value={clienteDni}
                  onChange={(e) => setClienteDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Sin DNI → ventas menores a S/ 700"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 text-sm"
                  disabled={isBlocked} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input type="text" value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="CLIENTES VARIOS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 text-sm"
                  disabled={isBlocked} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400 font-normal">(para enviar PDF)</span>
                </label>
                <input type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 text-sm"
                  disabled={isBlocked} />
              </div>
            </div>
          )}

          {/* Campos Factura */}
          {tipo === 'factura' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUC <span className="text-red-500">*</span>
                </label>
                <input type="text" value={clienteRuc}
                  onChange={(e) => setClienteRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="20XXXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 text-sm"
                  disabled={isBlocked} />
                {clienteRuc && clienteRuc.length !== 11 && (
                  <p className="text-xs text-red-500 mt-1">El RUC debe tener 11 dígitos</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón Social <span className="text-red-500">*</span>
                </label>
                <input type="text" value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="EMPRESA S.A.C."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 text-sm"
                  disabled={isBlocked} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input type="text" value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Ejemplo 123, Lima"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 text-sm"
                  disabled={isBlocked} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400 font-normal">(para enviar PDF)</span>
                </label>
                <input type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contabilidad@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 text-sm"
                  disabled={isBlocked} />
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {yaEmitido ? 'Cerrar' : 'Cancelar'}
            </button>
            <button
              onClick={handleEmitir}
              disabled={isBlocked}
              className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-3 rounded-xl hover:shadow-md transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <><Loader className="h-4 w-4 animate-spin" /><span>Emitiendo...</span></>
              ) : (
                <><Receipt size={16} /><span>Emitir {tipo === 'boleta' ? 'Boleta' : 'Factura'}</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
