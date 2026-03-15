// ============================================
// ARCHIVO: src/components/fullday/FullDayReportPDF.tsx
// CORREGIDO: Eliminado onError del componente Image
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
import { FullDayOrder } from '../../types/fullday';
import { formatDateForDisplay } from '../../utils/dateUtils';

// ─────────────────────────────────────────
// PALETA — morado/índigo (colores FullDay)
// ─────────────────────────────────────────
const C = {
  primary:      '#7C3AED',
  primaryDark:  '#5B21B6',
  primaryLight: '#EDE9FE',
  indigo:       '#4338CA',
  indigoLight:  '#E0E7FF',
  teal:         '#0F766E',
  tealLight:    '#CCFBF1',
  gray50:       '#F9FAFB',
  gray100:      '#F3F4F6',
  gray200:      '#E5E7EB',
  gray400:      '#9CA3AF',
  gray600:      '#4B5563',
  gray800:      '#1F2937',
  white:        '#FFFFFF',
  green:        '#059669',
  greenLight:   '#D1FAE5',
};

// ─────────────────────────────────────────
// TIPOS INTERNOS
// ─────────────────────────────────────────
interface ProductSold {
  name: string;
  quantity: number;
  total: number;
}

interface GradeGroup {
  grade: string;
  section: string;
  orders: number;
  total: number;
  pct: number;
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

interface FullDayReportData {
  period: string;
  generatedAt: string;
  totalOrders: number;
  totalAmount: number;
  efectivo: number;
  yapePlin: number;
  tarjeta: number;
  noAplica: number;
  totalProductsQty: number;
  bestDay: { date: string; total: number };
  topProduct: { name: string; quantity: number };
  dailyBreakdown: DaySummary[];
  gradeGroups: GradeGroup[];
  productsSold: ProductSold[];
}

// ─────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.gray800,
    backgroundColor: C.white,
    paddingHorizontal: 32,
    paddingVertical: 28,
  },

  // ── HEADER ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  logo: { width: 52, height: 52, marginRight: 14, borderRadius: 4 },
  headerLeft: { flex: 1 },
  restaurantName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.primary, letterSpacing: 0.5 },
  restaurantSub: { fontSize: 8, color: C.gray600, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.gray800, marginBottom: 3 },
  reportMeta: { fontSize: 8, color: C.gray600, marginBottom: 1 },
  reportMetaBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.primary },

  // ── KPI CARDS ──
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    backgroundColor: C.gray50,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  kpiCardAccent: {
    flex: 1,
    backgroundColor: C.primaryLight,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.primary,
  },
  kpiLabel: { fontSize: 7.5, color: C.gray600, marginBottom: 4, textTransform: 'uppercase' },
  kpiValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.gray800 },
  kpiValueAccent: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.primary },
  kpiSub: { fontSize: 7.5, color: C.gray400, marginTop: 2 },

  // ── SECCIÓN TITLE ──
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    backgroundColor: C.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 8,
    marginTop: 14,
  },

  // ── PAGOS ──
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  paymentDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  paymentLabel: { flex: 1, fontSize: 9, color: C.gray600 },
  paymentBarBg: { height: 5, backgroundColor: C.gray200, borderRadius: 3, flex: 1, marginHorizontal: 6 },
  paymentBarFill: { height: 5, borderRadius: 3 },
  paymentAmount: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.gray800, width: 80, textAlign: 'right' },
  paymentPct: { fontSize: 8, color: C.gray400, width: 38, textAlign: 'right' },
  mixtoNote: {
    flexDirection: 'row',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: C.greenLight,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  mixtoNoteText: { fontSize: 7.5, color: '#065F46', flex: 1 },

  // ── TABLA DIARIA ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.gray100,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: C.gray50,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tableRowTotal: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: C.primaryLight,
    borderTopWidth: 1,
    borderTopColor: C.primary,
    marginTop: 2,
  },
  colTh: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.gray600 },
  colDate:     { width: '16%', fontSize: 8, color: C.gray600 },
  colOrders:   { width: '10%', fontSize: 8, textAlign: 'center' },
  colEfect:    { width: '17%', fontSize: 8, textAlign: 'right' },
  colYape:     { width: '17%', fontSize: 8, textAlign: 'right' },
  colTarjeta:  { width: '17%', fontSize: 8, textAlign: 'right' },
  colNoAplica: { width: '10%', fontSize: 8, textAlign: 'right' },
  colTotal:    { width: '13%', fontSize: 8, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  // ── TABLA GRADOS ──
  gradeHeader: {
    flexDirection: 'row',
    backgroundColor: C.indigoLight,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  gradeRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  gradeRowAlt: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: C.gray50,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  gradeRowTotal: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: C.primaryLight,
    borderTopWidth: 1,
    borderTopColor: C.primary,
    marginTop: 2,
  },
  colGrade:   { flex: 1,      fontSize: 8.5 },
  colSection: { width: '10%', fontSize: 8.5, textAlign: 'center' },
  colGOrders: { width: '12%', fontSize: 8.5, textAlign: 'center' },
  colGTotal:  { width: '18%', fontSize: 8.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  colGPct:    { width: '12%', fontSize: 8,   textAlign: 'right', color: C.gray400 },
  colGBar:    { width: '22%', paddingLeft: 6, justifyContent: 'center' },
  gradBarBg:  { height: 5, backgroundColor: C.gray200, borderRadius: 3 },
  gradBarFill:{ height: 5, borderRadius: 3, backgroundColor: C.primary },

  // ── TABLA PRODUCTOS ──
  prodHeader: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  prodRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    alignItems: 'center',
  },
  prodRowAlt: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: C.gray50,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    alignItems: 'center',
  },
  prodTotalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: C.primaryLight,
    borderTopWidth: 1,
    borderTopColor: C.primary,
    marginTop: 2,
  },
  prodNum:   { width: '5%',  fontSize: 8,   color: C.gray400, textAlign: 'center' },
  prodName:  { flex: 1,      fontSize: 8.5, color: C.gray800 },
  prodQty:   { width: '10%', fontSize: 9,   fontFamily: 'Helvetica-Bold', textAlign: 'center', color: C.primary },
  prodBar:   { width: '20%', paddingLeft: 6, justifyContent: 'center' },
  prodBarBg: { height: 5, backgroundColor: C.gray200, borderRadius: 3 },
  prodBarFill:{ height: 5, borderRadius: 3, backgroundColor: C.primary },
  prodTotal: { width: '15%', fontSize: 8.5, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.gray800 },

  // ── FOOTER ──
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText:  { fontSize: 7, color: C.gray400 },
  footerBrand: { fontSize: 7, color: C.primary, fontFamily: 'Helvetica-Bold' },
});

const fmt = (n: number) => `S/ ${n.toFixed(2)}`;
const pct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) + '%' : '0.0%';

// ─────────────────────────────────────────
// DOCUMENTO PDF
// ─────────────────────────────────────────
const FullDayReportDocument: React.FC<{ data: FullDayReportData }> = ({ data }) => {
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

  const maxGradeTotal = data.gradeGroups.length > 0
    ? Math.max(...data.gradeGroups.map(g => g.total))
    : 1;

  const maxProdQty = data.productsSold.length > 0
    ? Math.max(...data.productsSold.map(p => p.quantity))
    : 1;

  const totalProductsAmount = data.productsSold.reduce((s, p) => s + p.total, 0);

  return (
    <Document title={`FullDay — ${data.period}`} author="Mary's Restaurant">
      <Page size="A4" style={S.page}>

        {/* ── ENCABEZADO ── */}
        <View style={S.header}>
          <Image src="/logo_marys.png" style={S.logo} />
          <View style={S.headerLeft}>
            <Text style={S.restaurantName}>MARY'S RESTAURANT</Text>
            <Text style={S.restaurantSub}>INVERSIONES AROMO S.A.C. | RUC: 20505262086</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.reportTitle}>Reporte FullDay</Text>
            <Text style={S.reportMeta}>Período: <Text style={S.reportMetaBold}>{data.period}</Text></Text>
            <Text style={S.reportMeta}>Generado: {data.generatedAt}</Text>
          </View>
        </View>

        {/* ── KPI CARDS ── */}
        <View style={S.kpiRow}>
          <View style={S.kpiCardAccent}>
            <Text style={S.kpiLabel}>Total Ventas</Text>
            <Text style={S.kpiValueAccent}>{fmt(data.totalAmount)}</Text>
            <Text style={S.kpiSub}>{data.totalOrders} pedidos en total</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Total Productos</Text>
            <Text style={S.kpiValue}>{data.totalProductsQty}</Text>
            <Text style={S.kpiSub}>{data.productsSold.length} distintos</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Mejor Día</Text>
            <Text style={S.kpiValue}>{fmt(data.bestDay.total)}</Text>
            <Text style={S.kpiSub}>{data.bestDay.date || '—'}</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Producto Estrella</Text>
            <Text style={S.kpiValue}>{data.topProduct.quantity} uds</Text>
            <Text style={S.kpiSub}>{data.topProduct.name.slice(0, 22)}</Text>
          </View>
        </View>

        {/* ── PAGOS ── */}
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
        <View style={S.mixtoNote}>
          <Text style={S.mixtoNoteText}>
            Los pagos mixtos ya están distribuidos en sus métodos correspondientes.
          </Text>
        </View>

        {/* ── DESGLOSE DIARIO ── */}
        {data.dailyBreakdown.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Desglose Diario</Text>
            <View style={S.tableHeader}>
              <Text style={[S.colDate,     S.colTh]}>Fecha</Text>
              <Text style={[S.colOrders,   S.colTh]}>Pedidos</Text>
              <Text style={[S.colEfect,    S.colTh, { textAlign: 'right' }]}>Efectivo</Text>
              <Text style={[S.colYape,     S.colTh, { textAlign: 'right' }]}>Yape/Plin</Text>
              <Text style={[S.colTarjeta,  S.colTh, { textAlign: 'right' }]}>Tarjeta</Text>
              <Text style={[S.colNoAplica, S.colTh, { textAlign: 'right' }]}>N/A</Text>
              <Text style={[S.colTotal,    S.colTh, { textAlign: 'right' }]}>Total</Text>
            </View>
            {data.dailyBreakdown.map((day, i) => (
              <View key={day.date} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={S.colDate}>{day.date}</Text>
                <Text style={[S.colOrders,   { textAlign: 'center' }]}>{day.orders}</Text>
                <Text style={[S.colEfect,    { textAlign: 'right' }]}>{day.efectivo  > 0 ? fmt(day.efectivo)  : '—'}</Text>
                <Text style={[S.colYape,     { textAlign: 'right' }]}>{day.yapePlin  > 0 ? fmt(day.yapePlin)  : '—'}</Text>
                <Text style={[S.colTarjeta,  { textAlign: 'right' }]}>{day.tarjeta   > 0 ? fmt(day.tarjeta)   : '—'}</Text>
                <Text style={[S.colNoAplica, { textAlign: 'right' }]}>{day.noAplica  > 0 ? fmt(day.noAplica)  : '—'}</Text>
                <Text style={S.colTotal}>{fmt(day.total)}</Text>
              </View>
            ))}
            <View style={S.tableRowTotal}>
              <Text style={[S.colDate,     { fontFamily: 'Helvetica-Bold', color: C.primaryDark }]}>TOTAL</Text>
              <Text style={[S.colOrders,   { textAlign: 'center', fontFamily: 'Helvetica-Bold', color: C.primaryDark }]}>
                {data.dailyBreakdown.reduce((s, d) => s + d.orders, 0)}
              </Text>
              <Text style={[S.colEfect,    { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.primaryDark }]}>{fmt(data.efectivo)}</Text>
              <Text style={[S.colYape,     { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.primaryDark }]}>{fmt(data.yapePlin)}</Text>
              <Text style={[S.colTarjeta,  { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.primaryDark }]}>{fmt(data.tarjeta)}</Text>
              <Text style={[S.colNoAplica, { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.primaryDark }]}>{fmt(data.noAplica)}</Text>
              <Text style={[S.colTotal,    { color: C.primary }]}>{fmt(data.totalAmount)}</Text>
            </View>
          </>
        )}

        {/* ── RESUMEN POR GRADO ── */}
        {data.gradeGroups.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Resumen por Grado y Sección</Text>
            <View style={S.gradeHeader}>
              <Text style={[S.colGrade,   S.colTh]}>Grado</Text>
              <Text style={[S.colSection, S.colTh, { textAlign: 'center' }]}>Sec.</Text>
              <Text style={[S.colGOrders, S.colTh, { textAlign: 'center' }]}>Pedidos</Text>
              <View style={S.colGBar} />
              <Text style={[S.colGPct,    S.colTh, { textAlign: 'right' }]}>%</Text>
              <Text style={[S.colGTotal,  S.colTh, { textAlign: 'right' }]}>Total</Text>
            </View>
            {data.gradeGroups.map((g, i) => {
              const barFill = maxGradeTotal > 0 ? (g.total / maxGradeTotal) * 100 : 0;
              return (
                <View key={g.grade + g.section} style={i % 2 === 0 ? S.gradeRow : S.gradeRowAlt}>
                  <Text style={S.colGrade}>{g.grade}</Text>
                  <Text style={[S.colSection, { textAlign: 'center' }]}>{g.section}</Text>
                  <Text style={[S.colGOrders, { textAlign: 'center' }]}>{g.orders}</Text>
                  <View style={S.colGBar}>
                    <View style={S.gradBarBg}>
                      <View style={[S.gradBarFill, { width: `${barFill}%` }]} />
                    </View>
                  </View>
                  <Text style={[S.colGPct,   { textAlign: 'right' }]}>{g.pct.toFixed(1)}%</Text>
                  <Text style={[S.colGTotal, { textAlign: 'right' }]}>{fmt(g.total)}</Text>
                </View>
              );
            })}
            <View style={S.gradeRowTotal}>
              <Text style={[S.colGrade,   { fontFamily: 'Helvetica-Bold', color: C.primaryDark }]}>TOTAL</Text>
              <Text style={S.colSection}></Text>
              <Text style={[S.colGOrders, { textAlign: 'center', fontFamily: 'Helvetica-Bold', color: C.primaryDark }]}>
                {data.gradeGroups.reduce((s, g) => s + g.orders, 0)}
              </Text>
              <View style={S.colGBar} />
              <Text style={S.colGPct}></Text>
              <Text style={[S.colGTotal,  { textAlign: 'right', color: C.primary }]}>{fmt(data.totalAmount)}</Text>
            </View>
          </>
        )}

        {/* ── PRODUCTOS VENDIDOS ── */}
        {data.productsSold.length > 0 && (
          <>
            <Text style={S.sectionTitle}>
              Productos Vendidos — {data.totalProductsQty} unidades · {data.productsSold.length} distintos
            </Text>
            <View style={S.prodHeader}>
              <Text style={[S.prodNum,   { fontFamily: 'Helvetica-Bold', color: C.primary }]}>#</Text>
              <Text style={[S.prodName,  { fontFamily: 'Helvetica-Bold', color: C.gray600 }]}>Producto</Text>
              <Text style={[S.prodQty,   { fontFamily: 'Helvetica-Bold', color: C.gray600 }]}>Cant.</Text>
              <View style={S.prodBar} />
              <Text style={[S.prodTotal, { fontFamily: 'Helvetica-Bold', color: C.gray600 }]}>Total</Text>
            </View>
            {data.productsSold.map((prod, i) => {
              const barFill = maxProdQty > 0 ? (prod.quantity / maxProdQty) * 100 : 0;
              return (
                <View key={prod.name + i} style={i % 2 === 0 ? S.prodRow : S.prodRowAlt}>
                  <Text style={S.prodNum}>{i + 1}</Text>
                  <Text style={S.prodName}>{prod.name}</Text>
                  <Text style={S.prodQty}>{prod.quantity}</Text>
                  <View style={S.prodBar}>
                    <View style={S.prodBarBg}>
                      <View style={[S.prodBarFill, { width: `${barFill}%` }]} />
                    </View>
                  </View>
                  <Text style={S.prodTotal}>{fmt(prod.total)}</Text>
                </View>
              );
            })}
            <View style={S.prodTotalRow}>
              <Text style={S.prodNum}></Text>
              <Text style={[S.prodName, { fontFamily: 'Helvetica-Bold', color: C.primary }]}>TOTAL</Text>
              <Text style={[S.prodQty,  { fontFamily: 'Helvetica-Bold', color: C.primary }]}>{data.totalProductsQty}</Text>
              <View style={S.prodBar} />
              <Text style={[S.prodTotal, { color: C.primary }]}>{fmt(totalProductsAmount)}</Text>
            </View>
          </>
        )}

        {/* ── FOOTER ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Generado el {new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}</Text>
          <Text style={S.footerBrand}>MARY'S RESTAURANT — FullDay</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
};

// ─────────────────────────────────────────
// BUILDER DE DATOS
// ─────────────────────────────────────────
const buildFullDayReportData = (
  orders: FullDayOrder[],
  startDate: Date,
  endDate: Date,
): FullDayReportData => {
  const totalAmount = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;

  let efectivo = 0, yapePlin = 0, tarjeta = 0, noAplica = 0;
  orders.forEach(o => {
    if (o.payment_method === 'MIXTO' && o.split_payment) {
      efectivo += o.split_payment.efectivo || 0;
      yapePlin += o.split_payment.yapePlin || 0;
      tarjeta  += o.split_payment.tarjeta  || 0;
    } else {
      switch (o.payment_method) {
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
    const key = formatDateForDisplay(new Date(o.created_at));
    const day = dailyMap.get(key);
    if (!day) return;
    day.orders++;
    day.total += o.total;
    if (o.payment_method === 'MIXTO' && o.split_payment) {
      day.efectivo += o.split_payment.efectivo || 0;
      day.yapePlin += o.split_payment.yapePlin || 0;
      day.tarjeta  += o.split_payment.tarjeta  || 0;
    } else {
      switch (o.payment_method) {
        case 'EFECTIVO':  day.efectivo  += o.total; break;
        case 'YAPE/PLIN': day.yapePlin  += o.total; break;
        case 'TARJETA':   day.tarjeta   += o.total; break;
        default:          day.noAplica  += o.total;
      }
    }
  });
  const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Mejor día
  let bestDay = { date: '', total: 0 };
  dailyBreakdown.forEach(d => { if (d.total > bestDay.total) bestDay = { date: d.date, total: d.total }; });

  // Productos vendidos
  const prodMap = new Map<string, ProductSold>();
  orders.forEach(o => {
    o.items.forEach(item => {
      const existing = prodMap.get(item.id);
      const qty = item.quantity ?? 0;
      const tot = (item.price ?? 0) * qty;
      if (existing) { existing.quantity += qty; existing.total += tot; }
      else prodMap.set(item.id, { name: item.name, quantity: qty, total: tot });
    });
  });
  const productsSold = Array.from(prodMap.values()).sort((a, b) => b.quantity - a.quantity);
  const totalProductsQty = productsSold.reduce((s, p) => s + p.quantity, 0);

  // Grupos por grado/sección
  const gradeMap = new Map<string, { grade: string; section: string; orders: number; total: number }>();
  orders.forEach(o => {
    const key = `${o.grade}||${o.section}`;
    const existing = gradeMap.get(key);
    if (existing) { existing.orders++; existing.total += o.total; }
    else gradeMap.set(key, { grade: o.grade, section: o.section, orders: 1, total: o.total });
  });
  const gradeGroups: GradeGroup[] = Array.from(gradeMap.values())
    .map(g => ({ ...g, pct: totalAmount > 0 ? (g.total / totalAmount) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

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
    totalProductsQty,
    bestDay,
    topProduct:       productsSold[0] ? { name: productsSold[0].name, quantity: productsSold[0].quantity } : { name: '—', quantity: 0 },
    dailyBreakdown,
    gradeGroups,
    productsSold,
  };
};

// ─────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────
export const generateFullDayReportPDF = async (
  orders:    FullDayOrder[],
  startDate: Date,
  endDate:   Date,
): Promise<void> => {
  const s = new Date(startDate); s.setHours(0, 0, 0, 0);
  const e = new Date(endDate);   e.setHours(23, 59, 59, 999);

  const filtered = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= s && d <= e;
  });

  if (filtered.length === 0) {
    alert('No hay pedidos en el rango de fechas seleccionado');
    return;
  }

  const reportData = buildFullDayReportData(filtered, startDate, endDate);
  const blob = await pdf(<FullDayReportDocument data={reportData} />).toBlob();

  const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endStr   = endDate.toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `fullday_reporte_${startStr}_al_${endStr}.pdf`;

  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log('✅ PDF FullDay generado:', fileName);
};

export default FullDayReportDocument;