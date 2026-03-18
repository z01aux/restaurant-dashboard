// ============================================
// ARCHIVO: src/hooks/useNubefact.ts
// Hook de React para emitir comprobantes electrónicos con Nubefact
// ============================================

import { useState, useCallback } from 'react';
import {
  generarComprobante,
  consultarComprobante,
  anularComprobante,
  NubefactApiError,
} from '../services/nubefactService';
import {
  buildBoletaPayload,
  buildFacturaPayload,
  formatNumeroComprobante,
  BoletaOptions,
  FacturaOptions,
} from '../utils/nubefactUtils';
import type { NubefactRespuestaComprobante, NubefactRespuestaAnulacion, TipoComprobante } from '../types/nubefact';
import { Order } from '../types';

// ─── Toast helper (mismo patrón que el proyecto) ─────────────────────────────

function showToast(message: string, color: 'green' | 'red' | 'blue') {
  const colors: Record<string, string> = {
    green: 'bg-green-500',
    red:   'bg-red-500',
    blue:  'bg-blue-600',
  };
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 ${colors[color]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full`;
  toast.innerHTML = `<div>${message}</div>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (document.body.contains(toast)) document.body.removeChild(toast);
  }, 4000);
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useNubefact() {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [respuesta, setRespuesta]   = useState<NubefactRespuestaComprobante | null>(null);

  // ── Emitir Boleta ──────────────────────────────────────────────────────────

  const emitirBoleta = useCallback(async (
    order: Order,
    options: BoletaOptions,
  ): Promise<NubefactRespuestaComprobante | null> => {
    setLoading(true);
    setError(null);

    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
    loadingToast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Emitiendo boleta...</span></div>';
    document.body.appendChild(loadingToast);

    try {
      const payload = buildBoletaPayload(order, options);
      const res     = await generarComprobante(payload);
      setRespuesta(res);

      const numFormateado = formatNumeroComprobante(res.serie, res.numero);
      if (res.aceptada_por_sunat) {
        showToast(`✅ Boleta ${numFormateado} aceptada por SUNAT`, 'green');
      } else {
        showToast(`⚠️ Boleta ${numFormateado} emitida (pendiente SUNAT)`, 'blue');
      }
      return res;
    } catch (err: any) {
      const msg = err instanceof NubefactApiError
        ? `[${err.codigo}] ${err.descripcionCodigo}`
        : err.message || 'Error desconocido al emitir boleta';
      setError(msg);
      showToast(`❌ ${msg}`, 'red');
      return null;
    } finally {
      if (document.body.contains(loadingToast)) document.body.removeChild(loadingToast);
      setLoading(false);
    }
  }, []);

  // ── Emitir Factura ─────────────────────────────────────────────────────────

  const emitirFactura = useCallback(async (
    order: Order,
    options: FacturaOptions,
  ): Promise<NubefactRespuestaComprobante | null> => {
    setLoading(true);
    setError(null);

    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
    loadingToast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Emitiendo factura...</span></div>';
    document.body.appendChild(loadingToast);

    try {
      const payload = buildFacturaPayload(order, options);
      const res     = await generarComprobante(payload);
      setRespuesta(res);

      const numFormateado = formatNumeroComprobante(res.serie, res.numero);
      if (res.aceptada_por_sunat) {
        showToast(`✅ Factura ${numFormateado} aceptada por SUNAT`, 'green');
      } else {
        showToast(`⚠️ Factura ${numFormateado} emitida (pendiente SUNAT)`, 'blue');
      }
      return res;
    } catch (err: any) {
      const msg = err instanceof NubefactApiError
        ? `[${err.codigo}] ${err.descripcionCodigo}`
        : err.message || 'Error desconocido al emitir factura';
      setError(msg);
      showToast(`❌ ${msg}`, 'red');
      return null;
    } finally {
      if (document.body.contains(loadingToast)) document.body.removeChild(loadingToast);
      setLoading(false);
    }
  }, []);

  // ── Consultar estado ───────────────────────────────────────────────────────

  const consultarEstado = useCallback(async (
    serie: string,
    numero: number,
    tipo: TipoComprobante = 2,
  ): Promise<NubefactRespuestaComprobante | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultarComprobante({ operacion: 'consultar_comprobante', tipo_de_comprobante: tipo, serie, numero });
      setRespuesta(res);
      return res;
    } catch (err: any) {
      const msg = err instanceof NubefactApiError
        ? `[${err.codigo}] ${err.descripcionCodigo}`
        : err.message;
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Anular comprobante ─────────────────────────────────────────────────────

  const anular = useCallback(async (
    serie: string,
    numero: number,
    tipo: TipoComprobante,
    motivo: string,
  ): Promise<NubefactRespuestaAnulacion | null> => {
    setLoading(true);
    setError(null);

    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    loadingToast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Anulando comprobante...</span></div>';
    document.body.appendChild(loadingToast);

    try {
      const res = await anularComprobante({
        operacion: 'generar_anulacion',
        tipo_de_comprobante: tipo,
        serie,
        numero,
        motivo: motivo.toUpperCase().slice(0, 100),
        codigo_unico: '',
      });
      showToast(`🗑️ Anulación enviada a SUNAT. Ticket: ${res.sunat_ticket_numero}`, 'green');
      return res;
    } catch (err: any) {
      const msg = err instanceof NubefactApiError
        ? `[${err.codigo}] ${err.descripcionCodigo}`
        : err.message;
      setError(msg);
      showToast(`❌ ${msg}`, 'red');
      return null;
    } finally {
      if (document.body.contains(loadingToast)) document.body.removeChild(loadingToast);
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    respuesta,
    emitirBoleta,
    emitirFactura,
    consultarEstado,
    anular,
    clearError,
  };
}
