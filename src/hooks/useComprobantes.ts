// ============================================
// ARCHIVO: src/hooks/useComprobantes.ts
// Hook centralizado para emitir y gestionar comprobantes Nubefact.
// Usado tanto en OrdersManager como en BillingManager.
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNubefact } from './useNubefact';
import type { ComprobanteEmitido, NubefactRespuestaComprobante } from '../types/nubefact';
import { Order } from '../types';

export function useComprobantes() {
  const [comprobantes, setComprobantes]       = useState<ComprobanteEmitido[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [proximoNumeroBoleta, setProximoNumeroBoleta]   = useState(1);
  const [proximoNumeroFactura, setProximoNumeroFactura] = useState(1);

  const nubefact = useNubefact();

  // ── Cargar todos los comprobantes de Supabase ──────────────────────────────

  const cargarComprobantes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comprobantes_emitidos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      const lista = (data || []) as ComprobanteEmitido[];
      setComprobantes(lista);

      // Calcular próximos correlativos
      const boletas  = lista.filter(c => c.tipo_comprobante === 2);
      const facturas = lista.filter(c => c.tipo_comprobante === 1);
      setProximoNumeroBoleta(
        boletas.length > 0 ? Math.max(...boletas.map(c => c.numero)) + 1 : 1
      );
      setProximoNumeroFactura(
        facturas.length > 0 ? Math.max(...facturas.map(c => c.numero)) + 1 : 1
      );
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarComprobantes();
  }, [cargarComprobantes]);

  // ── Guardar comprobante en Supabase tras emisión exitosa ───────────────────

  const guardarComprobante = useCallback(async (
    order: Order,
    res: NubefactRespuestaComprobante,
    clienteNombre?: string,
    clienteDocumento?: string,
  ) => {
    try {
      const { error } = await supabase
        .from('comprobantes_emitidos')
        .insert([{
          order_id:           order.id,
          tipo_comprobante:   res.tipo_de_comprobante,
          serie:              res.serie,
          numero:             res.numero,
          total:              order.total,
          cliente_nombre:     clienteNombre || order.customerName || 'CLIENTES VARIOS',
          cliente_documento:  clienteDocumento || '-',
          aceptada_por_sunat: res.aceptada_por_sunat,
          enlace_pdf:         res.enlace_del_pdf || res.enlace || '',
          enlace_xml:         res.enlace_del_xml || '',
          sunat_description:  res.sunat_description || '',
          anulado:            false,
        }]);
      if (error) console.error('Error guardando comprobante:', error);
      else await cargarComprobantes();
    } catch (err) {
      console.error('Error inesperado guardando comprobante:', err);
    }
  }, [cargarComprobantes]);

  // ── Anular comprobante ─────────────────────────────────────────────────────

  const anularComprobante = useCallback(async (
    comprobante: ComprobanteEmitido,
    motivo: string,
  ): Promise<boolean> => {
    const res = await nubefact.anular(
      comprobante.serie,
      comprobante.numero,
      comprobante.tipo_comprobante,
      motivo,
    );
    if (res) {
      await supabase
        .from('comprobantes_emitidos')
        .update({ anulado: true, motivo_anulacion: motivo })
        .eq('id', comprobante.id);
      await cargarComprobantes();
      return true;
    }
    return false;
  }, [nubefact, cargarComprobantes]);

  // ── Consultar estado en SUNAT ──────────────────────────────────────────────

  const consultarSunat = useCallback(async (
    comprobante: ComprobanteEmitido,
  ) => {
    const res = await nubefact.consultarEstado(
      comprobante.serie,
      comprobante.numero,
      comprobante.tipo_comprobante,
    );
    if (res) {
      await supabase
        .from('comprobantes_emitidos')
        .update({ aceptada_por_sunat: res.aceptada_por_sunat })
        .eq('id', comprobante.id);
      await cargarComprobantes();
    }
    return res;
  }, [nubefact, cargarComprobantes]);

  // ── Set de order_ids con comprobante (para marcar en OrdersManager) ────────

  const orderIdsConComprobante = new Set(
    comprobantes.filter(c => !c.anulado).map(c => c.order_id)
  );

  return {
    comprobantes,
    loading,
    proximoNumeroBoleta,
    proximoNumeroFactura,
    orderIdsConComprobante,
    cargarComprobantes,
    guardarComprobante,
    anularComprobante,
    consultarSunat,
    // Exponer también el hook nubefact por si se necesita emitirBoleta/Factura
    nubefact,
  };
}
