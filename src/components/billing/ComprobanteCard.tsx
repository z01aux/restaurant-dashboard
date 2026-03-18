// ============================================
// ARCHIVO: src/components/billing/ComprobanteCard.tsx
// Card individual para cada comprobante emitido
// ============================================

import React from 'react';
import { ExternalLink, RefreshCw, Trash2, CheckCircle, Clock } from 'lucide-react';
import type { ComprobanteEmitido } from '../../types/nubefact';
import { formatNumeroComprobante } from '../../utils/nubefactUtils';

interface ComprobanteCardProps {
  comprobante: ComprobanteEmitido;
  onAnular?: (comprobante: ComprobanteEmitido) => void;
  onConsultarSunat: (comprobante: ComprobanteEmitido) => void;
  loading?: boolean;
}

export const ComprobanteCard: React.FC<ComprobanteCardProps> = ({
  comprobante,
  onAnular,
  onConsultarSunat,
  loading = false,
}) => {
  const numero = formatNumeroComprobante(comprobante.serie, comprobante.numero);
  const esBoleta  = comprobante.tipo_comprobante === 2;
  const esFactura = comprobante.tipo_comprobante === 1;
  const esNota    = comprobante.tipo_comprobante === 3 || comprobante.tipo_comprobante === 4;

  const labelTipo = esBoleta ? 'BOLETA' : esFactura ? 'FACTURA' : esNota ? 'NOTA' : 'DOC';
  const colorTipo = esBoleta
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : esFactura
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-gray-100 text-gray-800 border-gray-200';

  const fecha = new Date(comprobante.created_at).toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={`bg-white rounded-xl border transition-colors ${
      comprobante.anulado
        ? 'border-gray-200 opacity-60'
        : comprobante.aceptada_por_sunat
        ? 'border-green-200'
        : 'border-yellow-200'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">

          {/* ── Info principal ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${colorTipo}`}>
                {labelTipo}
              </span>
              <span className="text-sm font-bold text-gray-900">{numero}</span>
              {comprobante.anulado && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-200 text-gray-600">
                  ANULADO
                </span>
              )}
            </div>

            <div className="text-sm text-gray-700 font-medium truncate">
              {comprobante.cliente_nombre}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {fecha} — <span className="font-semibold text-red-600">S/ {comprobante.total.toFixed(2)}</span>
            </div>

            {/* Estado SUNAT */}
            <div className="flex items-center space-x-1.5 mt-1.5">
              {comprobante.aceptada_por_sunat ? (
                <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
              ) : (
                <Clock size={13} className="text-yellow-500 flex-shrink-0" />
              )}
              <span className={`text-xs ${
                comprobante.aceptada_por_sunat ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {comprobante.aceptada_por_sunat ? 'Aceptado por SUNAT' : 'Pendiente SUNAT'}
              </span>
            </div>
          </div>

          {/* ── Acciones ── */}
          <div className="flex flex-col space-y-1.5 flex-shrink-0">
            {/* Ver PDF */}
            {comprobante.enlace_pdf && (
              <a
                href={comprobante.enlace_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-blue-200"
              >
                <ExternalLink size={12} />
                <span>PDF</span>
              </a>
            )}

            {/* Consultar SUNAT */}
            {!comprobante.anulado && (
              <button
                onClick={() => onConsultarSunat(comprobante)}
                disabled={loading}
                className="flex items-center space-x-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-gray-200 disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Verificar</span>
              </button>
            )}

            {/* Anular (solo admin) */}
            {onAnular && !comprobante.anulado && (
              <button
                onClick={() => onAnular(comprobante)}
                disabled={loading}
                className="flex items-center space-x-1.5 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-red-200 disabled:opacity-50"
              >
                <Trash2 size={12} />
                <span>Anular</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
