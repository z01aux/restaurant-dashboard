// ============================================
// ARCHIVO: src/components/billing/BillingManager.tsx
// ACTUALIZADO: usa useComprobantes (lógica compartida con OrdersManager)
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { Receipt, Search, RotateCcw, AlertCircle } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { useComprobantes } from '../../hooks/useComprobantes';
import { EmitirComprobanteModal } from './EmitirComprobanteModal';
import { ComprobanteCard } from './ComprobanteCard';
import type { ComprobanteEmitido, NubefactRespuestaComprobante } from '../../types/nubefact';
import { Order } from '../../types';

const BillingManager: React.FC = () => {
  const { user }             = useAuth();
  const { getRegularOrders } = useOrders();

  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedOrder, setSelectedOrder]     = useState<Order | null>(null);
  const [showEmitirModal, setShowEmitirModal] = useState(false);

  const {
    comprobantes,
    loading,
    proximoNumeroBoleta,
    proximoNumeroFactura,
    cargarComprobantes,
    guardarComprobante,
    anularComprobante,
    consultarSunat,
    nubefact,
  } = useComprobantes();

  const regularOrders = getRegularOrders();

  const handleEmitido = useCallback(async (
    respuesta: NubefactRespuestaComprobante,
    _tipo: 'boleta' | 'factura',
  ) => {
    if (selectedOrder) await guardarComprobante(selectedOrder, respuesta);
    setShowEmitirModal(false);
    setSelectedOrder(null);
  }, [selectedOrder, guardarComprobante]);

  const handleAnular = useCallback(async (comprobante: ComprobanteEmitido) => {
    const motivo = window.prompt(
      `Motivo de anulación para ${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}:`
    );
    if (!motivo) return;
    await anularComprobante(comprobante, motivo);
  }, [anularComprobante]);

  const handleConsultarSunat = useCallback(async (comprobante: ComprobanteEmitido) => {
    const res = await consultarSunat(comprobante);
    if (res) {
      const estado = res.aceptada_por_sunat ? '✅ Aceptado' : `⚠️ ${res.sunat_description}`;
      alert(`Estado SUNAT: ${estado}${res.anulado ? '\n🗑️ Anulado' : ''}`);
    }
  }, [consultarSunat]);

  const comprobantesHoy = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return comprobantes.filter(c => new Date(c.created_at) >= hoy);
  }, [comprobantes]);

  const filteredComprobantes = useMemo(() => {
    if (!searchTerm) return comprobantesHoy;
    const term = searchTerm.toLowerCase();
    return comprobantesHoy.filter(c =>
      c.cliente_nombre.toLowerCase().includes(term) ||
      c.serie.toLowerCase().includes(term) ||
      String(c.numero).includes(term)
    );
  }, [comprobantesHoy, searchTerm]);

  const idsConComprobante = useMemo(
    () => new Set(comprobantesHoy.filter(c => !c.anulado).map(c => c.order_id)),
    [comprobantesHoy]
  );

  const ordenesSinComprobante = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return regularOrders.filter(o => {
      const f = new Date(o.createdAt); f.setHours(0, 0, 0, 0);
      return (
        f.getTime() === hoy.getTime() &&
        !idsConComprobante.has(o.id) &&
        (o.status === 'delivered' || o.status === 'ready')
      );
    });
  }, [regularOrders, idsConComprobante]);

  const stats = useMemo(() => {
    const boletas      = comprobantesHoy.filter(c => c.tipo_comprobante === 2 && !c.anulado);
    const facturas     = comprobantesHoy.filter(c => c.tipo_comprobante === 1 && !c.anulado);
    const anulados     = comprobantesHoy.filter(c => c.anulado);
    const totalEmitido = [...boletas, ...facturas].reduce((s, c) => s + c.total, 0);
    return { boletas: boletas.length, facturas: facturas.length, anulados: anulados.length, totalEmitido };
  }, [comprobantesHoy]);

  return (
    <div className="space-y-4 sm:space-y-6">

      <EmitirComprobanteModal
        isOpen={showEmitirModal}
        onClose={() => { setShowEmitirModal(false); setSelectedOrder(null); }}
        order={selectedOrder}
        proximoNumeroBoleta={proximoNumeroBoleta}
        proximoNumeroFactura={proximoNumeroFactura}
        onEmitido={handleEmitido}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturación Electrónica</h2>
          <p className="text-sm text-gray-500 mt-1">Emisión de boletas y facturas ante SUNAT</p>
        </div>
        <button onClick={cargarComprobantes} disabled={loading}
          className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.boletas}</div>
          <div className="text-xs text-gray-500 mt-1">Boletas Hoy</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.facturas}</div>
          <div className="text-xs text-gray-500 mt-1">Facturas Hoy</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{stats.anulados}</div>
          <div className="text-xs text-gray-500 mt-1">Anulados</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-xl font-bold text-green-600">S/ {stats.totalEmitido.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Total Facturado</div>
        </div>
      </div>

      {/* ── Órdenes pendientes ── */}
      {ordenesSinComprobante.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle size={18} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800">
              {ordenesSinComprobante.length} orden(es) sin comprobante hoy
            </h3>
          </div>
          <div className="space-y-2">
            {ordenesSinComprobante.slice(0, 5).map(order => (
              <div key={order.id}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-amber-200">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">{order.customerName}</span>
                  <span className="text-sm font-semibold text-red-600 ml-2">S/ {order.total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setSelectedOrder(order); setShowEmitirModal(true); }}
                  disabled={nubefact.loading}
                  className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:shadow-md transition-all disabled:opacity-50"
                >
                  🧾 Emitir
                </button>
              </div>
            ))}
            {ordenesSinComprobante.length > 5 && (
              <p className="text-xs text-amber-600 text-center">
                +{ordenesSinComprobante.length - 5} más. Ve a 📋 Órdenes para emitirlas.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Buscador ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, serie o número..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400" />
        </div>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
          <p className="text-gray-500 mt-2 text-sm">Cargando comprobantes...</p>
        </div>
      ) : filteredComprobantes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Receipt size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay comprobantes emitidos hoy</p>
          <p className="text-gray-400 text-sm mt-1">
            Emite desde la pestaña 📋 Órdenes usando el botón <strong>CPE</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComprobantes.map(comprobante => (
            <ComprobanteCard
              key={comprobante.id}
              comprobante={comprobante}
              onAnular={user?.role === 'admin' ? handleAnular : undefined}
              onConsultarSunat={handleConsultarSunat}
              loading={nubefact.loading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingManager;
