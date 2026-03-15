// ============================================
// ARCHIVO: src/components/orders/SalesReportPDF.tsx
// Reporte PDF profesional de ventas por fechas
// Uso: importar generateSalesReportPDF y llamarla
//      con los mismos parámetros que exportOrdersByDateRange
// ============================================

import React from 'react';
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { Order } from '../../types';
import { supabase } from '../../lib/supabase';
import {
  formatDateForDisplay,
  getStartOfDay,
  getEndOfDay,
  toLocalDateString,
} from '../../utils/dateUtils';

// ─────────────────────────────────────────
// TIPOS INTERNOS
// ─────────────────────────────────────────

interface ProductSold {
  name: string;
  quantity: number;
  total: number;
  category: string;
}

interface CategoryGroup {
  category: string;
  products: ProductSold[];
  totalQty: number;
  totalAmount: number;
}

interface DaySummary {
  date: string;
  orders: number;
  efectivo: number;
  yapePlin: number;
  tarjeta: number;
  noAplica: number;
  total: number;
}

interface ReportData {
  period: string;
  generatedAt: string;
  closureNumber?: string;
  totalOrders: number;
  totalAmount: number;
  efectivo: number;
  yapePlin: number;
  tarjeta: number;
  noAplica: number;
  bestDay: { date: string; total: number };
  totalProductsQty: number;
  dailyBreakdown: DaySummary[];
  productsSold: ProductSold[];
  categoryGroups: CategoryGroup[];
}

// ─────────────────────────────────────────
// PALETA DE COLORES  (rojo/ámbar del restaurante)
// ─────────────────────────────────────────
const C = {
  red:        '#DC2626',
  redDark:    '#991B1B',
  redLight:   '#FEE2E2',
  amber:      '#D97706',
  amberLight: '#FEF3C7',
  teal:       '#0F766E',
  tealLight:  '#CCFBF1',
  gray50:     '#F9FAFB',
  gray100:    '#F3F4F6',
  gray200:    '#E5E7EB',
  gray400:    '#9CA3AF',
  gray600:    '#4B5563',
  gray800:    '#1F2937',
  white:      '#FFFFFF',
};

// ─────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        9,
    color:           C.gray800,
    backgroundColor: C.white,
    paddingHorizontal: 32,
    paddingVertical:   28,
  },

  // ── ENCABEZADO ──
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    marginBottom:    18,
    paddingBottom:   14,
    borderBottomWidth: 2,
    borderBottomColor: C.red,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width:  52,
    height: 52,
    marginRight: 14,
    borderRadius: 4,
  },
  restaurantName: {
    fontSize:   18,
    fontFamily: 'Helvetica-Bold',
    color:      C.red,
    letterSpacing: 0.5,
  },
  restaurantSub: {
    fontSize: 8,
    color:    C.gray600,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize:   13,
    fontFamily: 'Helvetica-Bold',
    color:      C.gray800,
    marginBottom: 3,
  },
  reportMeta: {
    fontSize: 8,
    color:    C.gray600,
    marginBottom: 1,
  },
  reportMetaBold: {
    fontSize:   8,
    fontFamily: 'Helvetica-Bold',
    color:      C.red,
  },

  // ── TARJETAS KPI ──
  kpiRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  14,
  },
  kpiCard: {
    flex:             1,
    backgroundColor:  C.gray50,
    borderRadius:     6,
    paddingVertical:  10,
    paddingHorizontal: 10,
    borderWidth:      1,
    borderColor:      C.gray200,
  },
  kpiCardAccent: {
    flex:             1,
    backgroundColor:  C.redLight,
    borderRadius:     6,
    paddingVertical:  10,
    paddingHorizontal: 10,
    borderWidth:      1,
    borderColor:      C.red,
  },
  kpiLabel: {
    fontSize:   7.5,
    color:      C.gray600,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize:   14,
    fontFamily: 'Helvetica-Bold',
    color:      C.gray800,
  },
  kpiValueAccent: {
    fontSize:   14,
    fontFamily: 'Helvetica-Bold',
    color:      C.red,
  },
  kpiSub: {
    fontSize:  7.5,
    color:     C.gray400,
    marginTop: 2,
  },

  // ── SECCIONES ──
  sectionTitle: {
    fontSize:    10,
    fontFamily:  'Helvetica-Bold',
    color:       C.white,
    backgroundColor: C.red,
    paddingVertical:   5,
    paddingHorizontal: 10,
    borderRadius:  4,
    marginBottom:  8,
    marginTop:     14,
  },

  // ── MÉTODOS DE PAGO ──
  paymentRow: {
    flexDirection:   'row',
    alignItems:      'center',
    marginBottom:    5,
  },
  paymentDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    marginRight:  6,
  },
  paymentLabel: {
    flex:      1,
    fontSize:  9,
    color:     C.gray600,
  },
  paymentAmount: {
    fontSize:   9,
    fontFamily: 'Helvetica-Bold',
    color:      C.gray800,
    width:      80,
    textAlign:  'right',
  },
  paymentPct: {
    fontSize:   8,
    color:      C.gray400,
    width:      38,
    textAlign:  'right',
  },
  paymentBarBg: {
    height:          5,
    backgroundColor: C.gray200,
    borderRadius:    3,
    flex:            1,
    marginHorizontal: 6,
  },
  paymentBarFill: {
    height:       5,
    borderRadius: 3,
  },

  // ── TABLA DIARIA ──
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: C.gray100,
    borderRadius:    3,
    paddingVertical:  5,
    paddingHorizontal: 8,
    marginBottom:    2,
  },
  tableRow: {
    flexDirection:    'row',
    paddingVertical:  4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tableRowAlt: {
    flexDirection:    'row',
    paddingVertical:  4,
    paddingHorizontal: 8,
    backgroundColor:  C.gray50,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tableRowTotal: {
    flexDirection:    'row',
    paddingVertical:  5,
    paddingHorizontal: 8,
    backgroundColor:  C.redLight,
    borderTopWidth:   1,
    borderTopColor:   C.red,
    marginTop:        2,
  },
  colDate:     { width: '16%', fontSize: 8, color: C.gray600 },
  colOrders:   { width: '10%', fontSize: 8, textAlign: 'center' },
  colEfect:    { width: '17%', fontSize: 8, textAlign: 'right' },
  colYape:     { width: '17%', fontSize: 8, textAlign: 'right' },
  colTarjeta:  { width: '17%', fontSize: 8, textAlign: 'right' },
  colNoAplica: { width: '10%', fontSize: 8, textAlign: 'right' },
  colTotal:    { width: '13%', fontSize: 8, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  colTh:       { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.gray600 },

  // ── TABLA PRODUCTOS ──
  prodHeader: {
    flexDirection:   'row',
    backgroundColor: C.amberLight,
    borderRadius:    3,
    paddingVertical:  5,
    paddingHorizontal: 8,
    marginBottom:    2,
  },
  prodRow: {
    flexDirection:    'row',
    paddingVertical:  4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    alignItems:       'center',
  },
  prodRowAlt: {
    flexDirection:    'row',
    paddingVertical:  4,
    paddingHorizontal: 8,
    backgroundColor:  C.gray50,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    alignItems:       'center',
  },
  prodNum:     { width: '5%',  fontSize: 8, color: C.gray400, textAlign: 'center' },
  prodName:    { flex: 1,      fontSize: 8.5, color: C.gray800 },
  prodQty:     { width: '10%', fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: C.red },
  prodTotal:   { width: '15%', fontSize: 8.5, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.gray800 },
  prodBar:     { width: '20%', paddingLeft: 6, justifyContent: 'center' },
  prodBarBg: {
    height:          5,
    backgroundColor: C.gray200,
    borderRadius:    3,
  },
  prodBarFill: {
    height:       5,
    borderRadius: 3,
    backgroundColor: C.amber,
  },
  prodTotalRow: {
    flexDirection:    'row',
    paddingVertical:  5,
    paddingHorizontal: 8,
    backgroundColor:  C.amberLight,
    borderTopWidth:   1,
    borderTopColor:   C.amber,
    marginTop:        2,
  },

  // ── GRUPOS DE CATEGORÍA ──
  catHeader: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  C.gray800,
    paddingVertical:  5,
    paddingHorizontal: 10,
    borderRadius:     4,
    marginTop:        10,
    marginBottom:     2,
  },
  catHeaderName: {
    flex:       1,
    fontSize:   9,
    fontFamily: 'Helvetica-Bold',
    color:      C.white,
  },
  catHeaderStats: {
    fontSize: 8,
    color:    C.gray200,
  },
  catSubtotal: {
    flexDirection:    'row',
    paddingVertical:  4,
    paddingHorizontal: 8,
    backgroundColor:  C.gray100,
    borderTopWidth:   1,
    borderTopColor:   C.gray200,
    marginBottom:     2,
  },
  catSubtotalText: {
    fontSize:   8,
    fontFamily: 'Helvetica-Bold',
    color:      C.gray600,
  },

  // ── FOOTER ──
  footer: {
    position:    'absolute',
    bottom:      20,
    left:        32,
    right:       32,
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop:  8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color:    C.gray400,
  },
  footerBrand: {
    fontSize:   7,
    color:      C.red,
    fontFamily: 'Helvetica-Bold',
  },

  // ── BADGE CIERRE ──
  closureBadge: {
    backgroundColor: C.tealLight,
    borderWidth:     1,
    borderColor:     C.teal,
    borderRadius:    4,
    paddingVertical:  3,
    paddingHorizontal: 8,
    alignSelf:       'flex-start',
    marginBottom:    12,
  },
  closureBadgeText: {
    fontSize:   8,
    fontFamily: 'Helvetica-Bold',
    color:      C.teal,
  },

  // ── NOTA MIXTO ──
  mixtoNote: {
    flexDirection:   'row',
    alignItems:      'center',
    marginTop:       6,
    paddingVertical:  4,
    paddingHorizontal: 8,
    backgroundColor: '#F0FDF4',
    borderRadius:    4,
    borderWidth:     1,
    borderColor:     '#BBF7D0',
  },
  mixtoNoteText: {
    fontSize: 7.5,
    color:    '#166534',
    flex:     1,
  },

  // ── NOTA ──
  noteBox: {
    backgroundColor: '#FFF7ED',
    borderWidth:     1,
    borderColor:     '#FED7AA',
    borderRadius:    4,
    padding:         8,
    marginTop:       12,
  },
  noteText: {
    fontSize: 7.5,
    color:    '#92400E',
    lineHeight: 1.5,
  },
});

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const fmt = (n: number) => `S/ ${n.toFixed(2)}`;
const pct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) + '%' : '0.0%';

// ─────────────────────────────────────────
// COMPONENTE DOCUMENTO PDF
// ─────────────────────────────────────────
const SalesReportDocument: React.FC<{ data: ReportData }> = ({ data }) => {
  const PAYMENT_COLORS: Record<string, string> = {
    'EFECTIVO':  '#10B981',
    'YAPE/PLIN': '#8B5CF6',
    'TARJETA':   '#3B82F6',
    'NO APLICA': '#9CA3AF',
  };

  const payments = [
    { label: 'Efectivo',  amount: data.efectivo,  key: 'EFECTIVO' },
    { label: 'Yape/Plin', amount: data.yapePlin,  key: 'YAPE/PLIN' },
    { label: 'Tarjeta',   amount: data.tarjeta,   key: 'TARJETA' },
    { label: 'No aplica', amount: data.noAplica,  key: 'NO APLICA' },
  ].filter(p => p.amount > 0);

  return (
    <Document title={`Reporte Ventas – ${data.period}`} author="Mary's Restaurant">
      <Page size="A4" style={S.page}>

        {/* ── ENCABEZADO ── */}
        <View style={S.header}>
          {/* Logo — si no carga simplemente no renderiza */}
          <Image
            src="/logo_marys.png"
            style={S.logo}
            // @ts-ignore — react-pdf acepta onError silencioso
            onError={() => {}}
          />
          <View style={S.headerLeft}>
            <Text style={S.restaurantName}>MARY'S RESTAURANT</Text>
            <Text style={S.restaurantSub}>INVERSIONES AROMO S.A.C. | RUC: 20505262086</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.reportTitle}>Reporte de Ventas</Text>
            <Text style={S.reportMeta}>Período: <Text style={S.reportMetaBold}>{data.period}</Text></Text>
            <Text style={S.reportMeta}>Generado: {data.generatedAt}</Text>
          </View>
        </View>

        {/* Badge de cierre si corresponde */}
        {data.closureNumber && (
          <View style={S.closureBadge}>
            <Text style={S.closureBadgeText}>Datos del cierre oficial: {data.closureNumber}</Text>
          </View>
        )}

        {/* ── KPI CARDS ── */}
        <View style={S.kpiRow}>
          <View style={S.kpiCardAccent}>
            <Text style={S.kpiLabel}>Total Ventas</Text>
            <Text style={S.kpiValueAccent}>{fmt(data.totalAmount)}</Text>
            <Text style={S.kpiSub}>{data.totalOrders} órdenes en total</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Total Productos Vendidos</Text>
            <Text style={S.kpiValue}>{data.totalProductsQty}</Text>
            <Text style={S.kpiSub}>{data.productsSold.length} productos distintos</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Mejor Día</Text>
            <Text style={S.kpiValue}>{fmt(data.bestDay.total)}</Text>
            <Text style={S.kpiSub}>{data.bestDay.date || '—'}</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Producto Estrella</Text>
            <Text style={S.kpiValue}>
              {data.productsSold[0]?.quantity ?? 0} uds
            </Text>
            <Text style={S.kpiSub}>
              {(data.productsSold[0]?.name ?? '—').slice(0, 22)}
            </Text>
          </View>
        </View>

        {/* ── MÉTODOS DE PAGO ── */}
        <Text style={S.sectionTitle}>Métodos de Pago</Text>
        {payments.map(p => {
          const barWidth = data.totalAmount > 0 ? (p.amount / data.totalAmount) * 100 : 0;
          return (
            <View key={p.key} style={S.paymentRow}>
              <View style={[S.paymentDot, { backgroundColor: PAYMENT_COLORS[p.key] }]} />
              <Text style={S.paymentLabel}>{p.label}</Text>
              <View style={S.paymentBarBg}>
                <View style={[S.paymentBarFill, { width: `${barWidth}%`, backgroundColor: PAYMENT_COLORS[p.key] }]} />
              </View>
              <Text style={S.paymentAmount}>{fmt(p.amount)}</Text>
              <Text style={S.paymentPct}>{pct(p.amount, data.totalAmount)}</Text>
            </View>
          );
        })}

        {/* Nota pagos mixtos */}
        <View style={S.mixtoNote}>
          <Text style={S.mixtoNoteText}>
            Los pagos mixtos (efectivo + Yape/Plin + tarjeta en una misma orden) ya están distribuidos en sus métodos correspondientes.
          </Text>
        </View>

        {/* ── DESGLOSE DIARIO ── */}
        {data.dailyBreakdown.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Desglose Diario</Text>
            {/* Cabecera */}
            <View style={S.tableHeader}>
              <Text style={[S.colDate,     S.colTh]}>Fecha</Text>
              <Text style={[S.colOrders,   S.colTh]}>Órdenes</Text>
              <Text style={[S.colEfect,    S.colTh, { textAlign: 'right' }]}>Efectivo</Text>
              <Text style={[S.colYape,     S.colTh, { textAlign: 'right' }]}>Yape/Plin</Text>
              <Text style={[S.colTarjeta,  S.colTh, { textAlign: 'right' }]}>Tarjeta</Text>
              <Text style={[S.colNoAplica, S.colTh, { textAlign: 'right' }]}>N/A</Text>
              <Text style={[S.colTotal,    S.colTh, { textAlign: 'right' }]}>Total</Text>
            </View>
            {data.dailyBreakdown.map((day, i) => {
              const rowStyle = i % 2 === 0 ? S.tableRow : S.tableRowAlt;
              return (
                <View key={day.date} style={rowStyle}>
                  <Text style={S.colDate}>{day.date}</Text>
                  <Text style={[S.colOrders,   { textAlign: 'center' }]}>{day.orders}</Text>
                  <Text style={[S.colEfect,    { textAlign: 'right' }]}>{day.efectivo  > 0 ? fmt(day.efectivo)  : '—'}</Text>
                  <Text style={[S.colYape,     { textAlign: 'right' }]}>{day.yapePlin  > 0 ? fmt(day.yapePlin)  : '—'}</Text>
                  <Text style={[S.colTarjeta,  { textAlign: 'right' }]}>{day.tarjeta   > 0 ? fmt(day.tarjeta)   : '—'}</Text>
                  <Text style={[S.colNoAplica, { textAlign: 'right' }]}>{day.noAplica  > 0 ? fmt(day.noAplica)  : '—'}</Text>
                  <Text style={S.colTotal}>{fmt(day.total)}</Text>
                </View>
              );
            })}
            {/* Fila total */}
            <View style={S.tableRowTotal}>
              <Text style={[S.colDate,     { fontFamily: 'Helvetica-Bold', color: C.redDark }]}>TOTAL</Text>
              <Text style={[S.colOrders,   { textAlign: 'center', fontFamily: 'Helvetica-Bold', color: C.redDark }]}>
                {data.dailyBreakdown.reduce((s, d) => s + d.orders, 0)}
              </Text>
              <Text style={[S.colEfect,    { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.redDark }]}>
                {fmt(data.efectivo)}
              </Text>
              <Text style={[S.colYape,     { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.redDark }]}>
                {fmt(data.yapePlin)}
              </Text>
              <Text style={[S.colTarjeta,  { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.redDark }]}>
                {fmt(data.tarjeta)}
              </Text>
              <Text style={[S.colNoAplica, { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.redDark }]}>
                {fmt(data.noAplica)}
              </Text>
              <Text style={[S.colTotal, { color: C.red }]}>{fmt(data.totalAmount)}</Text>
            </View>
          </>
        )}

        {/* ── PRODUCTOS VENDIDOS POR CATEGORÍA ── */}
        {data.categoryGroups.length > 0 && (
          <>
            <Text style={S.sectionTitle}>
              Productos Vendidos — {data.totalProductsQty} unidades · {data.productsSold.length} productos distintos
            </Text>

            {/* Cabecera de columnas (se repite visualmente por contexto) */}
            <View style={S.prodHeader}>
              <Text style={[S.prodNum,   { fontFamily: 'Helvetica-Bold', color: C.amber }]}>#</Text>
              <Text style={[S.prodName,  { fontFamily: 'Helvetica-Bold', color: C.gray600 }]}>Producto</Text>
              <Text style={[S.prodQty,   { fontFamily: 'Helvetica-Bold', color: C.gray600 }]}>Cant.</Text>
              <View style={S.prodBar} />
              <Text style={[S.prodTotal, { fontFamily: 'Helvetica-Bold', color: C.gray600 }]}>Total</Text>
            </View>

            {data.categoryGroups.map((group) => {
              const maxQtyInGroup = Math.max(...group.products.map(p => p.quantity));
              return (
                <View key={group.category}>
                  {/* Encabezado de categoría */}
                  <View style={S.catHeader}>
                    <Text style={S.catHeaderName}>{group.category.toUpperCase()}</Text>
                    <Text style={S.catHeaderStats}>
                      {group.products.length} producto{group.products.length !== 1 ? 's' : ''} · {group.totalQty} uds · {fmt(group.totalAmount)}
                    </Text>
                  </View>

                  {/* Filas de productos de esta categoría */}
                  {group.products.map((prod, i) => {
                    const rowStyle = i % 2 === 0 ? S.prodRow : S.prodRowAlt;
                    const barFillPct = maxQtyInGroup > 0 ? (prod.quantity / maxQtyInGroup) * 100 : 0;
                    return (
                      <View key={prod.name + i} style={rowStyle}>
                        <Text style={S.prodNum}>{i + 1}</Text>
                        <Text style={S.prodName}>{prod.name}</Text>
                        <Text style={S.prodQty}>{prod.quantity}</Text>
                        <View style={S.prodBar}>
                          <View style={S.prodBarBg}>
                            <View style={[S.prodBarFill, { width: `${barFillPct}%` }]} />
                          </View>
                        </View>
                        <Text style={S.prodTotal}>{fmt(prod.total)}</Text>
                      </View>
                    );
                  })}

                  {/* Subtotal de categoría */}
                  <View style={S.catSubtotal}>
                    <Text style={[S.catSubtotalText, { flex: 1 }]}>
                      Subtotal {group.category}
                    </Text>
                    <Text style={[S.catSubtotalText, { width: '10%', textAlign: 'center' }]}>
                      {group.totalQty}
                    </Text>
                    <View style={S.prodBar} />
                    <Text style={[S.catSubtotalText, { width: '15%', textAlign: 'right' }]}>
                      {fmt(group.totalAmount)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Fila gran total */}
            <View style={S.prodTotalRow}>
              <Text style={[S.prodNum]}></Text>
              <Text style={[S.prodName, { fontFamily: 'Helvetica-Bold', color: C.amber }]}>TOTAL GENERAL</Text>
              <Text style={[S.prodQty,  { fontFamily: 'Helvetica-Bold', color: C.amber }]}>
                {data.totalProductsQty}
              </Text>
              <View style={S.prodBar} />
              <Text style={[S.prodTotal, { color: C.amber }]}>
                {fmt(data.productsSold.reduce((s, p) => s + p.total, 0))}
              </Text>
            </View>
          </>
        )}

        {/* ── NOTA FUENTE DE DATOS ── */}
        {data.closureNumber && (
          <View style={S.noteBox}>
            <Text style={S.noteText}>
              Los totales de este reporte corresponden al cierre oficial {data.closureNumber}.
              En caso de diferencia con las órdenes actuales en sistema, prevalecen los datos del cierre.
            </Text>
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            Generado el {new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}
          </Text>
          <Text style={S.footerBrand}>MARY'S RESTAURANT</Text>
          <Text
            style={S.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
};

// ─────────────────────────────────────────
// HELPERS PARA CONSTRUIR ReportData
// ─────────────────────────────────────────

/** Agrupa productos por categoría, ordenados por cantidad desc dentro de cada grupo */
const buildCategoryGroups = (products: ProductSold[]): CategoryGroup[] => {
  const map = new Map<string, ProductSold[]>();

  products.forEach(p => {
    const cat = p.category || 'Sin categoría';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(p);
  });

  return Array.from(map.entries())
    .map(([category, prods]) => {
      const sorted = [...prods].sort((a, b) => b.quantity - a.quantity);
      return {
        category,
        products: sorted,
        totalQty:    sorted.reduce((s, p) => s + p.quantity, 0),
        totalAmount: sorted.reduce((s, p) => s + p.total,    0),
      };
    })
    // Ordenar grupos: primero por total de unidades desc
    .sort((a, b) => b.totalQty - a.totalQty);
};

/** Construye ReportData a partir de órdenes en vivo (sin cierre) */
const buildReportDataFromOrders = (
  orders: Order[],
  startDate: Date,
  endDate: Date,
): ReportData => {
  const totalAmount = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;

  let efectivo = 0, yapePlin = 0, tarjeta = 0, noAplica = 0;
  orders.forEach(o => {
    if (o.paymentMethod === 'MIXTO' && o.splitPayment) {
      efectivo += o.splitPayment.efectivo || 0;
      yapePlin += o.splitPayment.yapePlin || 0;
      tarjeta  += o.splitPayment.tarjeta  || 0;
    } else {
      switch (o.paymentMethod) {
        case 'EFECTIVO':  efectivo  += o.total; break;
        case 'YAPE/PLIN': yapePlin  += o.total; break;
        case 'TARJETA':   tarjeta   += o.total; break;
        default:          noAplica  += o.total;
      }
    }
  });

  // Desglose diario
  const dailyMap = new Map<string, DaySummary>();
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const key = formatDateForDisplay(cur);
    dailyMap.set(key, { date: key, orders: 0, efectivo: 0, yapePlin: 0, tarjeta: 0, noAplica: 0, total: 0 });
    cur.setDate(cur.getDate() + 1);
  }
  orders.forEach(o => {
    const key = formatDateForDisplay(o.createdAt);
    const day = dailyMap.get(key);
    if (!day) return;
    day.orders++;
    day.total += o.total;
    if (o.paymentMethod === 'MIXTO' && o.splitPayment) {
      day.efectivo += o.splitPayment.efectivo || 0;
      day.yapePlin += o.splitPayment.yapePlin || 0;
      day.tarjeta  += o.splitPayment.tarjeta  || 0;
    } else {
      switch (o.paymentMethod) {
        case 'EFECTIVO':  day.efectivo  += o.total; break;
        case 'YAPE/PLIN': day.yapePlin  += o.total; break;
        case 'TARJETA':   day.tarjeta   += o.total; break;
        default:          day.noAplica  += o.total;
      }
    }
  });
  const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date));

  // Mejor día
  let bestDay = { date: '', total: 0 };
  dailyBreakdown.forEach(d => { if (d.total > bestDay.total) bestDay = { date: d.date, total: d.total }; });

  // Todos los productos vendidos
  const prodMap = new Map<string, ProductSold>();
  orders.forEach(o => {
    o.items?.forEach(item => {
      const id  = item.menuItem?.id ?? item.menuItem?.name ?? 'x';
      const cur = prodMap.get(id);
      const qty = item.quantity ?? 0;
      const tot = (item.menuItem?.price ?? 0) * qty;
      const cat = item.menuItem?.category || 'Sin categoría';
      if (cur) { cur.quantity += qty; cur.total += tot; }
      else      prodMap.set(id, { name: item.menuItem?.name ?? 'Producto', quantity: qty, total: tot, category: cat });
    });
  });
  const productsSold = Array.from(prodMap.values())
    .sort((a, b) => b.quantity - a.quantity);

  const periodLabel = formatDateForDisplay(startDate) === formatDateForDisplay(endDate)
    ? formatDateForDisplay(startDate)
    : `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`;

  return {
    period:           periodLabel,
    generatedAt:      new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    totalOrders,
    totalAmount,
    efectivo,
    yapePlin,
    tarjeta,
    noAplica,
    bestDay,
    totalProductsQty: productsSold.reduce((s, p) => s + p.quantity, 0),
    dailyBreakdown,
    productsSold,
    categoryGroups:   buildCategoryGroups(productsSold),
  };
};

/** Construye ReportData a partir de un cierre guardado */
const buildReportDataFromClosure = (
  closure:    any,
  orders:     Order[],   // para extraer productos (top_products del cierre no tiene todos)
  startDate:  Date,
  endDate:    Date,
): ReportData => {
  const totalAmount = closure.total_amount;
  const totalOrders = closure.total_orders;

  const efectivo = closure.total_efectivo   ?? 0;
  const yapePlin = closure.total_yape_plin  ?? 0;
  const tarjeta  = closure.total_tarjeta    ?? 0;
  const noAplica = closure.total_no_aplica  ?? 0;

  // Desglose diario desde el cierre si existe, sino de las órdenes
  let dailyBreakdown: DaySummary[] = [];
  const db = (closure as any).daily_breakdown;
  if (db && Array.isArray(db) && db.length > 0) {
    dailyBreakdown = db.map((d: any) => ({
      date:     d.date     ?? '',
      orders:   d.orders   ?? 0,
      efectivo: d.efectivo ?? 0,
      yapePlin: d.yapePlin ?? 0,
      tarjeta:  d.tarjeta  ?? 0,
      noAplica: d.noAplica ?? 0,
      total:    d.total    ?? 0,
    }));
  } else {
    // Fallback: construir desde órdenes
    const tempData = buildReportDataFromOrders(orders, startDate, endDate);
    dailyBreakdown = tempData.dailyBreakdown;
  }

  let bestDay = { date: '', total: 0 };
  dailyBreakdown.forEach(d => { if (d.total > bestDay.total) bestDay = { date: d.date, total: d.total }; });

  // Todos los productos desde las órdenes (más completo que top_products del cierre)
  const prodMap = new Map<string, ProductSold>();
  orders.forEach(o => {
    o.items?.forEach(item => {
      const id  = item.menuItem?.id ?? item.menuItem?.name ?? 'x';
      const cur = prodMap.get(id);
      const qty = item.quantity ?? 0;
      const tot = (item.menuItem?.price ?? 0) * qty;
      const cat = item.menuItem?.category || 'Sin categoría';
      if (cur) { cur.quantity += qty; cur.total += tot; }
      else      prodMap.set(id, { name: item.menuItem?.name ?? 'Producto', quantity: qty, total: tot, category: cat });
    });
  });

  // Si no hay órdenes (cierre histórico), usar top_products del cierre
  let productsSold: ProductSold[] = Array.from(prodMap.values()).sort((a, b) => b.quantity - a.quantity);
  if (productsSold.length === 0 && closure.top_products) {
    productsSold = (closure.top_products as any[])
      .map(p => ({ name: p.name ?? 'Producto', quantity: p.quantity ?? 0, total: p.total ?? 0, category: p.category || 'Sin categoría' }))
      .sort((a, b) => b.quantity - a.quantity);
  }

  const periodLabel = formatDateForDisplay(startDate) === formatDateForDisplay(endDate)
    ? formatDateForDisplay(startDate)
    : `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`;

  return {
    period:           periodLabel,
    generatedAt:      new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    closureNumber:    closure.closure_number,
    totalOrders,
    totalAmount,
    efectivo,
    yapePlin,
    tarjeta,
    noAplica,
    bestDay,
    totalProductsQty: productsSold.reduce((s, p) => s + p.quantity, 0),
    dailyBreakdown,
    productsSold,
    categoryGroups:   buildCategoryGroups(productsSold),
  };
};

// ─────────────────────────────────────────
// FUNCIÓN PRINCIPAL (drop-in junto a exportOrdersByDateRange)
// ─────────────────────────────────────────

/**
 * Genera y descarga el PDF de ventas por rango de fechas.
 * Usa datos de cierre si existen, igual que exportOrdersByDateRange.
 *
 * @example
 * // En OrdersManager, junto al botón de Excel:
 * <button onClick={() => generateSalesReportPDF(orders, startDate, endDate)}>
 *   Reporte PDF
 * </button>
 */
export const generateSalesReportPDF = async (
  orders:    Order[],
  startDate: Date,
  endDate:   Date,
): Promise<void> => {
  const startOfDay = getStartOfDay(startDate);
  const endOfDay   = getEndOfDay(endDate);

  // Filtrar órdenes al rango
  const filteredOrders = orders.filter(order => {
    const d   = formatDateForDisplay(new Date(order.createdAt));
    const s   = formatDateForDisplay(startOfDay);
    const e   = formatDateForDisplay(endOfDay);
    return d >= s && d <= e;
  });

  if (filteredOrders.length === 0) {
    alert('No hay órdenes en el rango de fechas seleccionado');
    return;
  }

  let reportData: ReportData;

  try {
    const startStr = toLocalDateString(startDate);
    const endStr   = toLocalDateString(endDate);

    const { data: closures, error } = await supabase
      .from('sales_closures')
      .select('*')
      .gte('closure_date', startStr)
      .lte('closure_date', endStr)
      .order('closure_date', { ascending: true });

    if (error) throw error;

    if (closures && closures.length > 0) {
      // Usar el primer cierre (o el único)
      reportData = buildReportDataFromClosure(
        closures[0],
        filteredOrders,
        startDate,
        endDate,
      );
    } else {
      reportData = buildReportDataFromOrders(filteredOrders, startDate, endDate);
    }
  } catch (_err) {
    // En caso de error con Supabase, usar órdenes directamente
    reportData = buildReportDataFromOrders(filteredOrders, startDate, endDate);
  }

  // Generar blob y descargar
  const blob = await pdf(<SalesReportDocument data={reportData} />).toBlob();

  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr   = endDate.toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `reporte_ventas_${startStr}_al_${endStr}.pdf`;

  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ PDF generado:', fileName);
};

export default SalesReportDocument;