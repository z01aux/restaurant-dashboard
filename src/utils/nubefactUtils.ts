// ============================================
// ARCHIVO: src/utils/nubefactUtils.ts
// Constructores de payload adaptados a las órdenes de Mary's Restaurant
// ============================================

import { Order } from '../types';
import type { NubefactComprobante, NubefactItem, TipoDocumentoCliente } from '../types/nubefact';

// ─── Constantes del restaurante ───────────────────────────────────────────────

export const RESTAURANT_INFO = {
  ruc: '20505262086',            // RUC de Inversiones Aromo S.A.C.
  razon_social: "INVERSIONES AROMO S.A.C.",
  nombre_comercial: "MARY'S RESTAURANT",
  igv_rate: 0.18,
  serie_boleta: 'B001',
  serie_factura: 'F001',
} as const;

// ─── Utilidades de fecha ──────────────────────────────────────────────────────

/** Devuelve la fecha actual en formato DD-MM-YYYY requerido por Nubefact */
export function getFechaEmision(date: Date = new Date()): string {
  const dd   = String(date.getDate()).padStart(2, '0');
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// ─── Sanitizador de texto para SUNAT ──────────────────────────────────────────

/**
 * Elimina caracteres que rompen el formato JSON para SUNAT:
 * comillas dobles, saltos de línea, tabulaciones y caracteres de control.
 */
export function sanitizarTexto(texto: string): string {
  return texto
    .replace(/"/g, "'")       // Comillas dobles → simples
    .replace(/\n|\r/g, ' ')   // Saltos de línea → espacio
    .replace(/\t/g, ' ')      // Tabulaciones → espacio
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '') // Eliminar control chars fuera de rango
    .trim()
    .toUpperCase()
    .slice(0, 250);            // Máximo 250 chars por campo String
}

// ─── Constructor de ítems desde OrderItem[] ───────────────────────────────────

export function buildNubefactItems(order: Order): NubefactItem[] {
  const { igv_rate } = RESTAURANT_INFO;

  return order.items.map((item) => {
    const precioConIGV  = item.menuItem.price;
    const valorSinIGV   = precioConIGV / (1 + igv_rate);
    const subtotal      = parseFloat((valorSinIGV * item.quantity).toFixed(2));
    const igvMonto      = parseFloat((subtotal * igv_rate).toFixed(2));
    const total         = parseFloat((subtotal + igvMonto).toFixed(2));

    return {
      unidad_de_medida: 'NIU',                              // NIU = producto físico
      codigo: item.menuItem.id.slice(0, 20),                // Código interno
      descripcion: sanitizarTexto(item.menuItem.name),
      cantidad: item.quantity,
      valor_unitario: parseFloat(valorSinIGV.toFixed(6)),
      precio_unitario: parseFloat(precioConIGV.toFixed(6)),
      descuento: '',
      subtotal,
      tipo_de_igv: 1,                                       // 1 = Gravado Oneroso
      igv: igvMonto,
      total,
      anticipo_regularizacion: false,
      anticipo_documento_serie: '',
      anticipo_documento_numero: '',
    };
  });
}

// ─── Builder: Boleta de Venta ─────────────────────────────────────────────────

export interface BoletaOptions {
  /** Número correlativo (sin ceros a la izquierda) */
  numero: number;
  /** Nombre del cliente (por defecto: 'CLIENTES VARIOS') */
  clienteNombre?: string;
  /** DNI del cliente (por defecto: '-' para ventas menores a S/700) */
  clienteDni?: string;
  /** Email del cliente para envío automático */
  clienteEmail?: string;
  /** Observaciones adicionales */
  observaciones?: string;
  /** Método de pago visible en el comprobante */
  medioDePago?: string;
}

export function buildBoletaPayload(
  order: Order,
  options: BoletaOptions,
): NubefactComprobante {
  const items      = buildNubefactItems(order);

  const totalGravada     = parseFloat(items.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2));
  const totalIGV         = parseFloat(items.reduce((acc, i) => acc + i.igv, 0).toFixed(2));
  const totalComprobante = parseFloat((totalGravada + totalIGV).toFixed(2));

  // Detectar tipo de documento del cliente
  const clienteDni      = options.clienteDni?.trim() || '-';
  const tipoDoc: TipoDocumentoCliente = clienteDni === '-' ? '-' : '1'; // '-'=varios, '1'=DNI

  const clienteNombre   = sanitizarTexto(options.clienteNombre || 'CLIENTES VARIOS');
  const observaciones   = options.observaciones
    ? sanitizarTexto(options.observaciones)
    : sanitizarTexto(`ORDEN #${order.orderNumber || order.id.slice(-6).toUpperCase()} - ${order.tableNumber ? 'MESA ' + order.tableNumber : order.source.type.toUpperCase()}`);

  const medioPago = options.medioDePago || order.paymentMethod || 'EFECTIVO';

  return {
    operacion: 'generar_comprobante',
    tipo_de_comprobante: 2,                        // 2 = BOLETA DE VENTA
    serie: RESTAURANT_INFO.serie_boleta,
    numero: options.numero,
    sunat_transaction: 1,                          // Venta Interna
    cliente_tipo_de_documento: tipoDoc,
    cliente_numero_de_documento: clienteDni,
    cliente_denominacion: clienteNombre,
    cliente_direccion: '',
    cliente_email: options.clienteEmail || '',
    cliente_email_1: '',
    cliente_email_2: '',
    fecha_de_emision: getFechaEmision(),
    fecha_de_vencimiento: '',
    moneda: 1,                                     // Soles
    tipo_de_cambio: '',
    porcentaje_de_igv: 18.00,
    descuento_global: '',
    total_descuento: '',
    total_anticipo: '',
    total_gravada: totalGravada,
    total_inafecta: '',
    total_exonerada: '',
    total_igv: totalIGV,
    total_gratuita: '',
    total_otros_cargos: '',
    total: totalComprobante,
    percepcion_tipo: '',
    percepcion_base_imponible: '',
    total_percepcion: '',
    total_incluido_percepcion: '',
    retencion_tipo: '',
    retencion_base_imponible: '',
    total_retencion: '',
    total_impuestos_bolsas: '',
    detraccion: false,
    observaciones,
    documento_que_se_modifica_tipo: '',
    documento_que_se_modifica_serie: '',
    documento_que_se_modifica_numero: '',
    tipo_de_nota_de_credito: '',
    tipo_de_nota_de_debito: '',
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: !!options.clienteEmail,
    condiciones_de_pago: '',
    medio_de_pago: medioPago,
    placa_vehiculo: '',
    orden_compra_servicio: '',
    formato_de_pdf: 'TICKET',                      // Ideal para restaurante
    generado_por_contingencia: '',
    bienes_region_selva: '',
    servicios_region_selva: '',
    items,
    guias: [],
    venta_al_credito: [],
  };
}

// ─── Builder: Factura ─────────────────────────────────────────────────────────

export interface FacturaOptions {
  /** Número correlativo (sin ceros a la izquierda) */
  numero: number;
  /** RUC del cliente (obligatorio para facturas) */
  clienteRuc: string;
  /** Razón social del cliente */
  clienteRazonSocial: string;
  /** Dirección del cliente */
  clienteDireccion?: string;
  /** Email del cliente */
  clienteEmail?: string;
  /** Observaciones adicionales */
  observaciones?: string;
  /** Método de pago */
  medioDePago?: string;
}

export function buildFacturaPayload(
  order: Order,
  options: FacturaOptions,
): NubefactComprobante {
  const items = buildNubefactItems(order);

  const totalGravada     = parseFloat(items.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2));
  const totalIGV         = parseFloat(items.reduce((acc, i) => acc + i.igv, 0).toFixed(2));
  const totalComprobante = parseFloat((totalGravada + totalIGV).toFixed(2));

  const razonSocial   = sanitizarTexto(options.clienteRazonSocial);
  const direccion     = options.clienteDireccion ? sanitizarTexto(options.clienteDireccion) : '';
  const observaciones = options.observaciones
    ? sanitizarTexto(options.observaciones)
    : sanitizarTexto(`ORDEN #${order.orderNumber || order.id.slice(-6).toUpperCase()}`);

  const medioPago = options.medioDePago || order.paymentMethod || 'EFECTIVO';

  return {
    operacion: 'generar_comprobante',
    tipo_de_comprobante: 1,                        // 1 = FACTURA
    serie: RESTAURANT_INFO.serie_factura,
    numero: options.numero,
    sunat_transaction: 1,                          // Venta Interna
    cliente_tipo_de_documento: '6',                // 6 = RUC
    cliente_numero_de_documento: options.clienteRuc,
    cliente_denominacion: razonSocial,
    cliente_direccion: direccion,
    cliente_email: options.clienteEmail || '',
    cliente_email_1: '',
    cliente_email_2: '',
    fecha_de_emision: getFechaEmision(),
    fecha_de_vencimiento: '',
    moneda: 1,
    tipo_de_cambio: '',
    porcentaje_de_igv: 18.00,
    descuento_global: '',
    total_descuento: '',
    total_anticipo: '',
    total_gravada: totalGravada,
    total_inafecta: '',
    total_exonerada: '',
    total_igv: totalIGV,
    total_gratuita: '',
    total_otros_cargos: '',
    total: totalComprobante,
    percepcion_tipo: '',
    percepcion_base_imponible: '',
    total_percepcion: '',
    total_incluido_percepcion: '',
    retencion_tipo: '',
    retencion_base_imponible: '',
    total_retencion: '',
    total_impuestos_bolsas: '',
    detraccion: false,
    observaciones,
    documento_que_se_modifica_tipo: '',
    documento_que_se_modifica_serie: '',
    documento_que_se_modifica_numero: '',
    tipo_de_nota_de_credito: '',
    tipo_de_nota_de_debito: '',
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: !!options.clienteEmail,
    condiciones_de_pago: '',
    medio_de_pago: medioPago,
    placa_vehiculo: '',
    orden_compra_servicio: '',
    formato_de_pdf: 'A4',                          // Facturas en A4
    generado_por_contingencia: '',
    bienes_region_selva: '',
    servicios_region_selva: '',
    items,
    guias: [],
    venta_al_credito: [],
  };
}

// ─── Formateador del número de serie ──────────────────────────────────────────

/** Devuelve el número formateado, ej: B001-00000123 */
export function formatNumeroComprobante(serie: string, numero: number): string {
  return `${serie}-${String(numero).padStart(8, '0')}`;
}
