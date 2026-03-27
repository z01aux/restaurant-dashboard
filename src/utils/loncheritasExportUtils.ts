// ============================================
// ARCHIVO: src/utils/loncheritasExportUtils.ts
// Reescrito con xlsx-js-style para estilos completos
// INCLUYE COLUMNA NOTAS
// ============================================

import XLSXStyle from 'xlsx-js-style';
import { LoncheritasOrder } from '../types/loncheritas';
import { formatDateForDisplay, formatTimeForDisplay, getStartOfDay, getEndOfDay } from './dateUtils';

// ── Helpers de estilo ────────────────────────────────────────────

const fill = (rgb: string) => ({ patternType: 'solid', fgColor: { rgb }, bgColor: { rgb } });

const borderMedium = {
  top:    { style: 'medium', color: { rgb: '000000' } },
  bottom: { style: 'medium', color: { rgb: '000000' } },
  left:   { style: 'medium', color: { rgb: '000000' } },
  right:  { style: 'medium', color: { rgb: '000000' } },
};

const borderHair = {
  top:    { style: 'hair', color: { rgb: '000000' } },
  bottom: { style: 'hair', color: { rgb: '000000' } },
  left:   { style: 'hair', color: { rgb: '000000' } },
  right:  { style: 'hair', color: { rgb: '000000' } },
};

const mkCell = (value: string | number, s: object) => ({ v: value, t: typeof value === 'number' ? 'n' : 's', s });
const emptyCell = () => ({ v: '', t: 's', s: {} });

// ── Colores por grado ────────────────────────────────────────────

const GRADE_COLORS: Record<string, { bg: string; font: string }> = {
  'RED ROOM':               { bg: 'FAD5D5', font: '791F1F' },
  'YELLOW ROOM':            { bg: 'FDEBC0', font: '633806' },
  'GREEN ROOM':             { bg: 'CDF0E3', font: '085041' },
  'PRIMERO DE PRIMARIA':    { bg: 'C9E2F5', font: '0C447C' },
  'SEGUNDO DE PRIMARIA':    { bg: 'CDF0E3', font: '085041' },
  'TERCERO DE PRIMARIA':    { bg: 'FDEBC0', font: '633806' },
  'CUARTO DE PRIMARIA':     { bg: 'FAD5D5', font: '791F1F' },
  'QUINTO DE PRIMARIA':     { bg: 'EDE0FF', font: '26215C' },
  'SEXTO DE PRIMARIA':      { bg: 'FCE8D5', font: '7C3D12' },
  'PRIMERO DE SECUNDARIA':  { bg: 'C9E2F5', font: '0C447C' },
  'SEGUNDO DE SECUNDARIA':  { bg: 'CDF0E3', font: '085041' },
  'TERCERO DE SECUNDARIA':  { bg: 'FDEBC0', font: '633806' },
  'CUARTO DE SECUNDARIA':   { bg: 'FAD5D5', font: '791F1F' },
  'QUINTO DE SECUNDARIA':   { bg: 'EDE0FF', font: '26215C' },
};
const DEFAULT_COLOR = { bg: 'F1EFE8', font: '2C2C2A' };
const getGradeColor = (grade: string) => GRADE_COLORS[grade] ?? DEFAULT_COLOR;

// ── Colores por método de pago ───────────────────────────────────

const PAYMENT_COLORS: Record<string, { bg: string; font: string }> = {
  'EFECTIVO':  { bg: 'D1FAE5', font: '065F46' },
  'YAPE/PLIN': { bg: 'EDE9FE', font: '4C1D95' },
  'TARJETA':   { bg: 'DBEAFE', font: '1E3A8A' },
  'MIXTO':     { bg: 'FEF3C7', font: '92400E' },
};
const DEFAULT_PAYMENT = { bg: 'F3F4F6', font: '374151' };
const getPaymentColor = (method: string | null) => PAYMENT_COLORS[method ?? ''] ?? DEFAULT_PAYMENT;

// ── Fecha local ──────────────────────────────────────────────────

const localStamp = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

// ── Formatear desayunos ──────────────────────────────────────────

const formatDesayunos = (items: LoncheritasOrder['items']): string =>
  items.map(i => `${i.quantity > 1 ? i.quantity + 'x ' : ''}${i.name.toUpperCase()}${i.notes ? ` (${i.notes.toUpperCase()})` : ''}`).join(' + ');

// ── Construir worksheet ──────────────────────────────────────────

const buildStyledSheet = (
  aoa:       object[][],
  colWidths: number[],
  rowHeights: number[],
  merges?:   { s:{r:number;c:number}; e:{r:number;c:number} }[],
  autoFilter?: string
) => {
  const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
  ws['!cols']       = colWidths.map(wch => ({ wch }));
  ws['!rows']       = rowHeights.map(hpt => ({ hpt }));
  if (merges)       ws['!merges']     = merges;
  if (autoFilter)   ws['!autofilter'] = { ref: autoFilter };
  ws['!pageSetup']  = { paperSize: 9, orientation: 'landscape' };
  return ws;
};

// ── EXPORTAR EXCEL HOY / TODO ────────────────────────────────────

export const exportLoncheritasToExcel = (orders: LoncheritasOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) { alert('No hay pedidos para exportar'); return; }

  const now   = new Date();
  const fecha = formatDateForDisplay(now);

  // Encabezados con NOTAS
  const COLS  = ['Fecha','Hora','N° Orden','Grado','Sección','Alumno','Teléfono','Pago','Total','Desayuno/Lonchera','Notas'];
  const COL_W = [12, 8, 15, 25, 10, 35, 15, 14, 12, 60, 40];

  const titleStyle  = { font:{bold:true,sz:13,name:'Arial',color:{rgb:'1A1A1A'}}, fill:fill('9FE1CB'), alignment:{horizontal:'center',vertical:'center'} };
  const headerStyle = { font:{bold:true,sz:11,name:'Arial',color:{rgb:'F1EFE8'}}, fill:fill('5F5E5A'), alignment:{horizontal:'center',vertical:'center'}, border:borderMedium };

  const aoa: object[][] = [];

  // Fila 1: Título
  aoa.push([mkCell(`PEDIDOS LONCHERITAS — ${fecha}`, titleStyle), ...Array(10).fill(emptyCell())]);

  // Fila 2: Encabezados
  aoa.push(COLS.map(h => mkCell(h, headerStyle)));

  // Filas de datos
  let totalGeneral = 0;
  const sorted = [...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  sorted.forEach((order, i) => {
    const color  = getGradeColor(order.grade);
    const pColor = getPaymentColor(order.payment_method);
    const rowBg  = i % 2 === 1 ? 'F0FDF8' : 'FFFFFF';
    totalGeneral += order.total;

    const gradeStyle = { font:{bold:true,sz:10,name:'Arial',color:{rgb:color.font}}, fill:fill(color.bg), alignment:{horizontal:'center',vertical:'center'}, border:borderHair };
    const payStyle   = { font:{bold:true,sz:10,name:'Arial',color:{rgb:pColor.font}}, fill:fill(pColor.bg), alignment:{horizontal:'center',vertical:'center'}, border:borderHair };
    const cS = { font:{sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(rowBg), alignment:{horizontal:'center',vertical:'center'}, border:borderHair };
    const tS = { font:{sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(rowBg), alignment:{horizontal:'left',vertical:'center',wrapText:true}, border:borderHair };
    const rS = { font:{bold:true,sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(rowBg), alignment:{horizontal:'right',vertical:'center'}, border:borderHair };

    aoa.push([
      mkCell(formatDateForDisplay(new Date(order.created_at)), cS),
      mkCell(formatTimeForDisplay(new Date(order.created_at)), cS),
      mkCell(order.order_number || '', cS),
      mkCell(order.grade,   gradeStyle),
      mkCell(order.section, gradeStyle),
      mkCell(order.student_name, tS),
      mkCell(order.phone || '—', cS),
      mkCell(order.payment_method === 'EFECTIVO' ? '💵 EFECTIVO' : 
             order.payment_method === 'YAPE/PLIN' ? '📱 YAPE/PLIN' : 
             order.payment_method === 'TARJETA' ? '💳 TARJETA' : 
             order.payment_method === 'MIXTO' ? '🔀 MIXTO' : '— NO APLICA', payStyle),
      mkCell(`S/ ${order.total.toFixed(2)}`, rS),
      mkCell(formatDesayunos(order.items), tS),
      mkCell(order.notes || '', tS),
    ]);
  });

  // Total al pie
  aoa.push(Array(11).fill(emptyCell()));
  aoa.push(Array(11).fill(emptyCell()));
  aoa.push([
    mkCell(`Total de pedidos: ${orders.length}   |   Total ventas: S/ ${totalGeneral.toFixed(2)}`, {
      font: { italic:true, sz:10, name:'Arial', color:{rgb:'888780'} },
    }),
    ...Array(10).fill(emptyCell()),
  ]);

  const ws = buildStyledSheet(aoa, COL_W, [26, 20, ...sorted.map(()=>18)], [{s:{r:0,c:0},e:{r:0,c:10}}], 'A2:K2');
  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos');
  XLSXStyle.writeFile(wb, `loncheritas_${localStamp(now)}.xlsx`);
};

// ── EXPORTAR POR RANGO DE FECHAS ─────────────────────────────────

export const exportLoncheritasByDateRange = (orders: LoncheritasOrder[], startDate: Date, endDate: Date) => {
  const filtered = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= getStartOfDay(startDate) && d <= getEndOfDay(endDate);
  });

  if (filtered.length === 0) { alert('No hay pedidos en el rango de fechas seleccionado'); return; }

  const wb = XLSXStyle.utils.book_new();

  const totalVentas   = filtered.reduce((s, o) => s + o.total, 0);
  const totalEfectivo = filtered.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
  const totalYape     = filtered.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
  const totalTarjeta  = filtered.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
  const totalMixto    = filtered.filter(o => o.payment_method === 'MIXTO').reduce((s, o) => s + o.total, 0);
  const totalNoAplica = filtered.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);

  const titleS = { font:{bold:true,sz:14,name:'Arial',color:{rgb:'1A1A1A'}}, fill:fill('9FE1CB'), alignment:{horizontal:'center',vertical:'center'} };
  const h2S    = { font:{bold:true,sz:11,name:'Arial',color:{rgb:'1A1A1A'}}, fill:fill('CDF0E3'), alignment:{horizontal:'left',vertical:'center'}, border:borderHair };
  const labelS = { font:{sz:10,name:'Arial',color:{rgb:'5F5E5A'}}, fill:fill('FFFFFF'), alignment:{horizontal:'left',vertical:'center'}, border:borderHair };
  const valueS = { font:{bold:true,sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill('FFFFFF'), alignment:{horizontal:'right',vertical:'center'}, border:borderHair };

  // ── HOJA 1: RESUMEN ──────────────────────────────────────────
  const summaryAoa: object[][] = [
    [mkCell('REPORTE LONCHERITAS — RESUMEN', titleS), emptyCell(), emptyCell()],
    [emptyCell(), emptyCell(), emptyCell()],
    [mkCell(`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`, labelS), emptyCell(), emptyCell()],
    [mkCell(`Generado: ${formatDateForDisplay(new Date())} ${formatTimeForDisplay(new Date())}`, labelS), emptyCell(), emptyCell()],
    [emptyCell(), emptyCell(), emptyCell()],
    [mkCell('RESUMEN GENERAL', h2S), emptyCell(), emptyCell()],
    [mkCell('Total de pedidos', labelS), mkCell(filtered.length, valueS), emptyCell()],
    [mkCell('Total ventas', labelS), mkCell(`S/ ${totalVentas.toFixed(2)}`, valueS), emptyCell()],
    [emptyCell(), emptyCell(), emptyCell()],
    [mkCell('VENTAS POR MÉTODO DE PAGO', h2S), emptyCell(), emptyCell()],
    [mkCell('💵 Efectivo',  labelS), mkCell(`S/ ${totalEfectivo.toFixed(2)}`, valueS), mkCell(totalVentas>0?`${((totalEfectivo/totalVentas)*100).toFixed(1)}%`:'0%', valueS)],
    [mkCell('📱 Yape/Plin', labelS), mkCell(`S/ ${totalYape.toFixed(2)}`,     valueS), mkCell(totalVentas>0?`${((totalYape/totalVentas)*100).toFixed(1)}%`:'0%', valueS)],
    [mkCell('💳 Tarjeta',   labelS), mkCell(`S/ ${totalTarjeta.toFixed(2)}`,  valueS), mkCell(totalVentas>0?`${((totalTarjeta/totalVentas)*100).toFixed(1)}%`:'0%', valueS)],
    [mkCell('🔀 Mixto',     labelS), mkCell(`S/ ${totalMixto.toFixed(2)}`,    valueS), mkCell(totalVentas>0?`${((totalMixto/totalVentas)*100).toFixed(1)}%`:'0%', valueS)],
    [mkCell('— No aplica', labelS), mkCell(`S/ ${totalNoAplica.toFixed(2)}`, valueS), emptyCell()],
  ];
  const wsSummary = buildStyledSheet(summaryAoa, [35,20,12], Array(summaryAoa.length).fill(18), [{s:{r:0,c:0},e:{r:0,c:2}}]);
  XLSXStyle.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // ── HOJA 2: DETALLE CON NOTAS ───────────────────────────────────────────
  const COLS = ['Fecha','Hora','N° Orden','Grado','Sección','Alumno','Teléfono','Pago','Desayuno/Lonchera','Notas','Total'];
  const COL_W = [12,8,15,25,10,35,15,14,70,40,12];
  const headerStyle = { font:{bold:true,sz:11,name:'Arial',color:{rgb:'F1EFE8'}}, fill:fill('5F5E5A'), alignment:{horizontal:'center',vertical:'center'}, border:borderMedium };

  const detailAoa: object[][] = [
    [mkCell(`DETALLE — ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`, {font:{bold:true,sz:13,name:'Arial',color:{rgb:'1A1A1A'}},fill:fill('9FE1CB'),alignment:{horizontal:'center',vertical:'center'}}), ...Array(10).fill(emptyCell())],
    COLS.map(h => mkCell(h, headerStyle)),
  ];

  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  let totalGeneral = 0;

  sorted.forEach((order, i) => {
    const color  = getGradeColor(order.grade);
    const pColor = getPaymentColor(order.payment_method);
    const rowBg  = i % 2 === 1 ? 'F0FDF8' : 'FFFFFF';
    totalGeneral += order.total;

    const gradeStyle = { font:{bold:true,sz:10,name:'Arial',color:{rgb:color.font}}, fill:fill(color.bg), alignment:{horizontal:'center',vertical:'center'}, border:borderHair };
    const payStyle   = { font:{bold:true,sz:10,name:'Arial',color:{rgb:pColor.font}}, fill:fill(pColor.bg), alignment:{horizontal:'center',vertical:'center'}, border:borderHair };
    const cS = { font:{sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(rowBg), alignment:{horizontal:'center',vertical:'center'}, border:borderHair };
    const tS = { font:{sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(rowBg), alignment:{horizontal:'left',vertical:'center',wrapText:true}, border:borderHair };
    const rS = { font:{bold:true,sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(rowBg), alignment:{horizontal:'right',vertical:'center'}, border:borderHair };

    detailAoa.push([
      mkCell(formatDateForDisplay(new Date(order.created_at)), cS),
      mkCell(formatTimeForDisplay(new Date(order.created_at)), cS),
      mkCell(order.order_number || '', cS),
      mkCell(order.grade,   gradeStyle),
      mkCell(order.section, gradeStyle),
      mkCell(order.student_name, tS),
      mkCell(order.phone || '—', cS),
      mkCell(order.payment_method === 'EFECTIVO' ? '💵 EFECTIVO' : 
             order.payment_method === 'YAPE/PLIN' ? '📱 YAPE/PLIN' : 
             order.payment_method === 'TARJETA' ? '💳 TARJETA' : 
             order.payment_method === 'MIXTO' ? '🔀 MIXTO' : '— NO APLICA', payStyle),
      mkCell(formatDesayunos(order.items), tS),
      mkCell(order.notes || '', tS),
      mkCell(`S/ ${order.total.toFixed(2)}`, rS),
    ]);
  });

  detailAoa.push(Array(11).fill(emptyCell()));
  detailAoa.push(Array(11).fill(emptyCell()));
  detailAoa.push([
    mkCell(`Total de pedidos: ${filtered.length}   |   Total ventas: S/ ${totalGeneral.toFixed(2)}`, {
      font: { italic:true, sz:10, name:'Arial', color:{rgb:'888780'} },
    }),
    ...Array(10).fill(emptyCell()),
  ]);

  const wsDetail = buildStyledSheet(detailAoa, COL_W, [26,20,...sorted.map(()=>18)], [{s:{r:0,c:0},e:{r:0,c:10}}], 'A2:K2');
  XLSXStyle.utils.book_append_sheet(wb, wsDetail, 'Detalle');

  // ── HOJA 3: TOP PRODUCTOS ─────────────────────────────────────
  const productMap = new Map<string, { name: string; quantity: number; total: number }>();
  filtered.forEach(o => o.items.forEach(item => {
    const ex = productMap.get(item.id);
    if (ex) { ex.quantity += item.quantity; ex.total += item.price * item.quantity; }
    else     productMap.set(item.id, { name: item.name, quantity: item.quantity, total: item.price * item.quantity });
  }));

  const topProducts = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  const topHeader   = { font:{bold:true,sz:11,name:'Arial',color:{rgb:'F1EFE8'}}, fill:fill('5F5E5A'), alignment:{horizontal:'center',vertical:'center'}, border:borderMedium };

  const topAoa: object[][] = [
    [mkCell('TOP 10 PRODUCTOS LONCHERITAS', {font:{bold:true,sz:13,name:'Arial',color:{rgb:'1A1A1A'}},fill:fill('9FE1CB'),alignment:{horizontal:'center',vertical:'center'}}), emptyCell(), emptyCell(), emptyCell()],
    [mkCell('#',topHeader), mkCell('Producto',topHeader), mkCell('Cantidad',topHeader), mkCell('Total vendido',topHeader)],
    ...topProducts.map((p, i) => [
      mkCell(i+1,    { font:{sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(i%2===0?'FFFFFF':'F0FDF8'), alignment:{horizontal:'center'}, border:borderHair }),
      mkCell(p.name.toUpperCase(), { font:{sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(i%2===0?'FFFFFF':'F0FDF8'), alignment:{horizontal:'left',wrapText:true}, border:borderHair }),
      mkCell(p.quantity, { font:{bold:true,sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(i%2===0?'FFFFFF':'F0FDF8'), alignment:{horizontal:'center'}, border:borderHair }),
      mkCell(`S/ ${p.total.toFixed(2)}`, { font:{bold:true,sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(i%2===0?'FFFFFF':'F0FDF8'), alignment:{horizontal:'right'}, border:borderHair }),
    ]),
  ];

  const wsTop = buildStyledSheet(topAoa, [5,45,12,18], [26,20,...topProducts.map(()=>18)], [{s:{r:0,c:0},e:{r:0,c:3}}]);
  XLSXStyle.utils.book_append_sheet(wb, wsTop, 'Top 10 Productos');

  const s = localStamp(startDate);
  const e = localStamp(endDate);
  XLSXStyle.writeFile(wb, `loncheritas_${s}_al_${e}.xlsx`);
};