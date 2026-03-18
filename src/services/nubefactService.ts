// ============================================
// ARCHIVO: src/services/nubefactService.ts
// Llama a la Edge Function de Supabase (proxy),
// que a su vez llama a Nubefact desde el servidor.
// Esto evita el error de CORS al llamar directamente desde el navegador.
// ============================================

import { supabase } from '../lib/supabase';
import type {
  NubefactComprobante,
  NubefactConsulta,
  NubefactAnulacion,
  NubefactConsultaAnulacion,
  NubefactRespuestaComprobante,
  NubefactRespuestaAnulacion,
  NubefactError,
} from '../types/nubefact';

// ─── Helper: invocar la Edge Function ────────────────────────────────────────

async function callProxy<TResponse>(payload: object): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke('nubefact-proxy', {
    body: payload,
  });

  // Error de red real (la Edge Function no respondió)
  if (error && !data) {
    throw new NubefactApiError(
      error.message || 'Error al conectar con el proxy de Nubefact',
      0,
      0,
    );
  }

  // Nubefact devolvió un error estructurado (siempre llega en data ahora)
  if (data?.codigo !== undefined) {
    const err = data as NubefactError;
    throw new NubefactApiError(err.errors, err.codigo, 400);
  }

  return data as TResponse;
}

// ─── Clase de error personalizada ────────────────────────────────────────────

export class NubefactApiError extends Error {
  public readonly codigo: number;
  public readonly httpStatus: number;

  constructor(message: string, codigo: number, httpStatus: number) {
    super(message);
    this.name = 'NubefactApiError';
    this.codigo = codigo;
    this.httpStatus = httpStatus;
  }

  get descripcionCodigo(): string {
    const CODIGOS: Record<number, string> = {
      10: 'Token incorrecto o eliminado.',
      11: 'URL de Nubefact incorrecta.',
      12: 'Content-Type incorrecto.',
      20: 'El JSON enviado no cumple con el formato establecido.',
      21: 'No se pudo completar la operación.',
      22: 'Documento enviado fuera del plazo permitido.',
      23: 'Este número correlativo ya existe en Nubefact.',
      24: 'El documento no existe en Nubefact.',
      40: 'Error interno en Nubefact.',
      50: 'Cuenta Nubefact suspendida.',
      51: 'Cuenta Nubefact suspendida por falta de pago.',
    };
    return CODIGOS[this.codigo] || this.message;
  }
}

// ─── Operación 1: Generar Comprobante ────────────────────────────────────────

export async function generarComprobante(
  payload: NubefactComprobante,
): Promise<NubefactRespuestaComprobante> {
  return callProxy<NubefactRespuestaComprobante>(payload);
}

// ─── Operación 2: Consultar Comprobante ──────────────────────────────────────

export async function consultarComprobante(
  payload: NubefactConsulta,
): Promise<NubefactRespuestaComprobante> {
  return callProxy<NubefactRespuestaComprobante>(payload);
}

// ─── Operación 3: Anular Comprobante ─────────────────────────────────────────

export async function anularComprobante(
  payload: NubefactAnulacion,
): Promise<NubefactRespuestaAnulacion> {
  return callProxy<NubefactRespuestaAnulacion>(payload);
}

// ─── Operación 4: Consultar Anulación ────────────────────────────────────────

export async function consultarAnulacion(
  payload: NubefactConsultaAnulacion,
): Promise<NubefactRespuestaAnulacion> {
  return callProxy<NubefactRespuestaAnulacion>(payload);
}
