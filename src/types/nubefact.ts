// ============================================
// ARCHIVO: src/types/nubefact.ts
// Tipos TypeScript para la integración con Nubefact API
// ============================================

/** Tipo de comprobante */
export type TipoComprobante = 1 | 2 | 3 | 4;
// 1 = FACTURA, 2 = BOLETA, 3 = NOTA DE CRÉDITO, 4 = NOTA DE DÉBITO

/** Tipo de documento del cliente */
export type TipoDocumentoCliente = '6' | '1' | '-' | '4' | '7' | 'A' | 'B' | '0' | 'G';
// 6=RUC, 1=DNI, -=VARIOS (ventas menores a S/700), 4=CARNET EXTRANJERÍA, 7=PASAPORTE

/** Moneda */
export type Moneda = 1 | 2 | 3 | 4;
// 1=SOLES, 2=DÓLARES, 3=EUROS, 4=LIBRA ESTERLINA

/** Tipo de IGV por ítem */
export type TipoIGV =
  | 1   // Gravado - Operación Onerosa
  | 2   // Gravado – Retiro por premio
  | 3   // Gravado – Retiro por donación
  | 4   // Gravado – Retiro
  | 5   // Gravado – Retiro por publicidad
  | 6   // Gravado – Bonificaciones
  | 7   // Gravado – Retiro por entrega a trabajadores
  | 8   // Exonerado - Operación Onerosa
  | 9   // Inafecto - Operación Onerosa
  | 16; // Exportación

// ─── Item / Línea del comprobante ─────────────────────────────────────────────

export interface NubefactItem {
  unidad_de_medida: string;           // 'NIU' = producto, 'ZZ' = servicio
  codigo?: string;                     // Código interno del producto
  codigo_producto_sunat?: string;      // Código SUNAT (hasta 8 chars), ej: '10000000'
  descripcion: string;                 // Descripción del producto/servicio
  cantidad: number;                    // Ej: 1.00
  valor_unitario: number;              // Sin IGV
  precio_unitario: number;             // Con IGV
  descuento?: number | string;
  subtotal: number;                    // valor_unitario × cantidad − descuento
  tipo_de_igv: TipoIGV;
  igv: number;                         // Total IGV de la línea
  total: number;                       // Total de la línea (con IGV)
  anticipo_regularizacion: boolean;
  anticipo_documento_serie?: string;
  anticipo_documento_numero?: string | number;
  impuesto_bolsas?: number;
  tipo_de_isc?: number;
  isc?: number;
}

// ─── Cabecera del comprobante ──────────────────────────────────────────────────

export interface NubefactComprobante {
  operacion: 'generar_comprobante';
  tipo_de_comprobante: TipoComprobante;
  serie: string;                         // 'F001' para facturas, 'B001' para boletas
  numero: number;                        // Correlativo sin ceros a la izquierda
  sunat_transaction: number;             // 1 = Venta Interna (más común)
  cliente_tipo_de_documento: TipoDocumentoCliente;
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion?: string;
  cliente_email?: string;
  cliente_email_1?: string;
  cliente_email_2?: string;
  fecha_de_emision: string;              // Formato: 'DD-MM-YYYY'
  fecha_de_vencimiento?: string;
  moneda: Moneda;
  tipo_de_cambio?: number | string;
  porcentaje_de_igv: number;             // 18.00
  descuento_global?: number | string;
  total_descuento?: number | string;
  total_anticipo?: number | string;
  total_gravada?: number | string;
  total_inafecta?: number | string;
  total_exonerada?: number | string;
  total_igv?: number | string;
  total_gratuita?: number | string;
  total_otros_cargos?: number | string;
  total: number;
  percepcion_tipo?: number | string;
  percepcion_base_imponible?: number | string;
  total_percepcion?: number | string;
  total_incluido_percepcion?: number | string;
  retencion_tipo?: number | string;
  retencion_base_imponible?: number | string;
  total_retencion?: number | string;
  total_impuestos_bolsas?: number | string;
  detraccion: boolean;
  observaciones?: string;
  documento_que_se_modifica_tipo?: number | string;
  documento_que_se_modifica_serie?: string;
  documento_que_se_modifica_numero?: number | string;
  tipo_de_nota_de_credito?: number | string;
  tipo_de_nota_de_debito?: number | string;
  enviar_automaticamente_a_la_sunat: boolean;
  enviar_automaticamente_al_cliente: boolean;
  condiciones_de_pago?: string;
  medio_de_pago?: string;
  placa_vehiculo?: string;
  orden_compra_servicio?: string;
  formato_de_pdf?: 'A4' | 'A5' | 'TICKET' | '';
  generado_por_contingencia?: boolean | string;
  bienes_region_selva?: boolean | string;
  servicios_region_selva?: boolean | string;
  nubecont_tipo_de_venta_codigo?: string;
  items: NubefactItem[];
  guias?: Array<{ guia_tipo: 1 | 2; guia_serie_numero: string }>;
  venta_al_credito?: Array<{
    cuota: number;
    fecha_de_pago: string;
    importe: number;
  }>;
}

// ─── Consulta de comprobante ───────────────────────────────────────────────────

export interface NubefactConsulta {
  operacion: 'consultar_comprobante';
  tipo_de_comprobante: TipoComprobante;
  serie: string;
  numero: number;
}

// ─── Anulación ────────────────────────────────────────────────────────────────

export interface NubefactAnulacion {
  operacion: 'generar_anulacion';
  tipo_de_comprobante: TipoComprobante;
  serie: string;
  numero: number;
  motivo: string;
  codigo_unico?: string;
}

// ─── Consulta de anulación ────────────────────────────────────────────────────

export interface NubefactConsultaAnulacion {
  operacion: 'consultar_anulacion';
  tipo_de_comprobante: TipoComprobante;
  serie: string;
  numero: number;
}

// ─── Respuesta de la API ──────────────────────────────────────────────────────

export interface NubefactRespuestaComprobante {
  tipo_de_comprobante: TipoComprobante;
  serie: string;
  numero: number;
  enlace: string;
  enlace_del_pdf?: string;
  enlace_del_xml?: string;
  enlace_del_cdr?: string;
  aceptada_por_sunat: boolean;
  sunat_description: string | null;
  sunat_note: string | null;
  sunat_responsecode: string;
  sunat_soap_error: string;
  cadena_para_codigo_qr?: string;
  codigo_hash?: string;
  pdf_zip_base64?: string;
  xml_zip_base64?: string;
  cdr_zip_base64?: string;
  codigo_de_barras?: string;
  // Solo aparece en consultar_comprobante
  anulado?: boolean;
}

export interface NubefactRespuestaAnulacion {
  numero: number;
  enlace: string;
  sunat_ticket_numero: string;
  aceptada_por_sunat: boolean;
  sunat_description: string | null;
  sunat_note: string | null;
  sunat_responsecode: string | null;
  sunat_soap_error: string;
  enlace_del_pdf?: string;
  enlace_del_xml?: string;
  enlace_del_cdr?: string;
  pdf_zip_base64?: string;
  xml_zip_base64?: string;
  cdr_zip_base64?: string;
}

// ─── Respuesta de error ────────────────────────────────────────────────────────

export interface NubefactError {
  errors: string;
  codigo: number;
}

// ─── Registro local de comprobantes (Supabase) ────────────────────────────────

export interface ComprobanteEmitido {
  id: string;
  order_id: string;
  tipo_comprobante: TipoComprobante;
  serie: string;
  numero: number;
  total: number;
  cliente_nombre: string;
  cliente_documento: string;
  aceptada_por_sunat: boolean;
  enlace_pdf?: string;
  enlace_xml?: string;
  sunat_description?: string;
  anulado: boolean;
  motivo_anulacion?: string;
  created_at: string;
  updated_at: string;
}
