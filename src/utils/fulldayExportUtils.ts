// ============================================
// ARCHIVO: src/utils/fulldayExportUtils.ts
// Reescrito con xlsx-js-style para estilos completos
// ============================================

import XLSXStyle from 'xlsx-js-style';
import { FullDayOrder } from '../types/fullday';
import { formatDateForDisplay, formatTimeForDisplay, getStartOfDay, getEndOfDay } from './dateUtils';
import { supabase } from '../lib/supabase';

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

// ── Fecha local sin toISOString ──────────────────────────────────

const localStamp = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

// ── Categorización BULK — una sola consulta para todos los pedidos ──
// Recibe el categoryMap ya cargado y clasifica los items de un pedido

const isBebida = (cat: string, name: string) =>
  cat.includes('bebida') || cat.includes('gaseosa') || cat.includes('jugo') ||
  cat.includes('café')   || cat.includes('infusión') || cat.includes('agua') ||
  cat.includes('mate')   || cat.includes('te') ||
  name.includes('gaseosa')   || name.includes('inca kola')  || name.includes('coca cola') ||
  name.includes('sprite')    || name.includes('fanta')      || name.includes('agua') ||
  name.includes('jugo')      || name.includes('chicha')     || name.includes('maracuya') ||
  name.includes('limonada')  || name.includes('café')       || name.includes('infusión') ||
  name.includes('te')        || name.includes('mate')       || name.includes('capuchino') ||
  name.includes('expresso')  || name.includes('bebida');

const isEntrada = (cat: string, name: string) =>
  cat.includes('entrada') || cat.includes('ensalada') || cat.includes('sopa') ||
  name.includes('entrada') || name.includes('ensalada') || name.includes('sopa') ||
  name.includes('caldo')   || name.includes('causa')    || name.includes('huancaina') ||
  name.includes('tamal')   || name.includes('chaufa');

const categorizeWithMap = (
  order: FullDayOrder,
  categoryMap: Map<string, string>
): { entradas: string; fondos: string; bebidas: string } => {
  const entradas: string[] = [], fondos: string[] = [], bebidas: string[] = [];

  for (const item of order.items) {
    const display  = `${item.quantity}x ${item.name.toUpperCase()}`;
    const category = (categoryMap.get(item.id) || '').toLowerCase();
    const name     = item.name.toLowerCase();

    if (isBebida(category, category ? '' : name))       { bebidas.push(display);  continue; }
    if (isEntrada(category, category ? '' : name))      { entradas.push(display); continue; }
    fondos.push(display);
  }

  return {
    entradas: entradas.join(' + ') || '-',
    fondos:   fondos.join(' + ')   || '-',
    bebidas:  bebidas.join(' + ')  || '-',
  };
};

// Carga todas las categorías en UNA SOLA consulta para un array de pedidos
const loadCategoryMap = async (orders: FullDayOrder[]): Promise<Map<string, string>> => {
  const allIds = [...new Set(orders.flatMap(o => o.items.map(i => i.id)))];
  const categoryMap = new Map<string, string>();
  if (allIds.length === 0) return categoryMap;
  try {
    const { data, error } = await supabase.from('menu_items').select('id, category').in('id', allIds);
    if (!error && data) (data as any[]).forEach(i => categoryMap.set(i.id, i.category || ''));
  } catch (e) { console.error('Error obteniendo categorías:', e); }
  return categoryMap;
};

// ── Construir worksheet con estilos completos ────────────────────

const buildStyledSheet = (
  aoa:       object[][],
  colWidths: number[],
  rowHeights: number[],
  merges?:   { s:{r:number;c:number}; e:{r:number;c:number} }[],
  autoFilter?: string
) => {
  const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
  ws['!cols']      = colWidths.map(wch => ({ wch }));
  ws['!rows']      = rowHeights.map(hpt => ({ hpt }));
  if (merges)      ws['!merges']    = merges;
  if (autoFilter)  ws['!autofilter'] = { ref: autoFilter };
  ws['!pageSetup'] = { paperSize: 9, orientation: 'landscape' };
  return ws;
};

// ── EXPORTAR EXCEL HOY / TODO ────────────────────────────────────

export const exportFullDayToExcel = async (orders: FullDayOrder[], tipo: 'today' | 'all' = 'today') => {
  if (orders.length === 0) { alert('No hay pedidos para exportar'); return; }

  const now   = new Date();
  const fecha = formatDateForDisplay(now);
  // Encabezados
  const COLS = ['Fecha','Hora','N° Orden','Grado','Sección','Alumno','Teléfono','Pago','Total','Entradas','Plato de Fondo','Bebidas'];
  const COL_W = [12, 8, 15, 25, 10, 35, 15, 14, 12, 35, 35, 30];

  const titleStyle = {
    font:      { bold: true, sz: 13, name: 'Arial', color: { rgb: '1A1A1A' } },
    fill:      fill('FFD3B6'),
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const headerStyle = {
    font:      { bold: true, sz: 11, name: 'Arial', color: { rgb: 'F1EFE8' } },
    fill:      fill('5F5E5A'),
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    borderMedium,
  };

  const aoa: object[][] = [];

  // Fila 1: Título
  aoa.push([
    mkCell(`PEDIDOS FULLDAY — ${fecha}`, titleStyle),
    ...Array(11).fill(emptyCell()),
  ]);

  // Fila 2: Encabezados
  aoa.push(COLS.map(h => mkCell(h, headerStyle)));

  // Filas de datos — UNA sola consulta para todos los pedidos
  let totalGeneral = 0;
  const sortedOrders = [...orders].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const categoryMap = await loadCategoryMap(sortedOrders);

  for (let i = 0; i < sortedOrders.length; i++) {
    const order = sortedOrders[i];
    const cats  = categorizeWithMap(order, categoryMap);
    const color = getGradeColor(order.grade);
    const pColor = getPaymentColor(order.payment_method);
    const isEven = i % 2 === 1;
    const rowBg  = isEven ? 'F8F9FA' : 'FFFFFF';

    totalGeneral += order.total;

    const gradeStyle = {
      font:      { bold: true, sz: 10, name: 'Arial', color: { rgb: color.font } },
      fill:      fill(color.bg),
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    borderHair,
    };
    const payStyle = {
      font:      { bold: true, sz: 10, name: 'Arial', color: { rgb: pColor.font } },
      fill:      fill(pColor.bg),
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    borderHair,
    };
    const dateStyle = {
      font:      { sz: 10, name: 'Arial', color: { rgb: '444441' } },
      fill:      fill(rowBg),
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    borderHair,
    };
    const numStyle = {
      font:      { bold: true, sz: 10, name: 'Arial', color: { rgb: '2C2C2A' } },
      fill:      fill(rowBg),
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    borderHair,
    };
    const textStyle = {
      font:      { sz: 10, name: 'Arial', color: { rgb: '2C2C2A' } },
      fill:      fill(rowBg),
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border:    borderHair,
    };
    const totalStyle = {
      font:      { bold: true, sz: 10, name: 'Arial', color: { rgb: '2C2C2A' } },
      fill:      fill(rowBg),
      alignment: { horizontal: 'right', vertical: 'center' },
      border:    borderHair,
    };

    aoa.push([
      mkCell(formatDateForDisplay(new Date(order.created_at)), dateStyle),
      mkCell(formatTimeForDisplay(new Date(order.created_at)), dateStyle),
      mkCell(order.order_number || '', numStyle),
      mkCell(order.grade,        gradeStyle),
      mkCell(order.section,      gradeStyle),
      mkCell(order.student_name, textStyle),
      mkCell(order.phone || '—', textStyle),
      mkCell(order.payment_method === 'EFECTIVO' ? '💵 EFECTIVO' : order.payment_method === 'YAPE/PLIN' ? '📱 YAPE/PLIN' : order.payment_method === 'TARJETA' ? '💳 TARJETA' : order.payment_method === 'MIXTO' ? '🔀 MIXTO' : '— NO APLICA', payStyle),
      mkCell(`S/ ${order.total.toFixed(2)}`, totalStyle),
      mkCell(cats.entradas, textStyle),
      mkCell(cats.fondos,   textStyle),
      mkCell(cats.bebidas,  textStyle),
    ]);
  }

  // Filas vacías + total
  aoa.push(Array(12).fill(emptyCell()));
  aoa.push(Array(12).fill(emptyCell()));
  aoa.push([
    mkCell(`Total de pedidos: ${orders.length}   |   Total ventas: S/ ${totalGeneral.toFixed(2)}`, {
      font: { italic: true, sz: 10, name: 'Arial', color: { rgb: '888780' } },
    }),
    ...Array(11).fill(emptyCell()),
  ]);

  const rowHeights = [
    26,  // título
    20,  // encabezados
    ...sortedOrders.map(() => 18),
  ];

  const ws = buildStyledSheet(
    aoa, COL_W, rowHeights,
    [{ s:{r:0,c:0}, e:{r:0,c:11} }],
    'A2:L2'
  );

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos');
  XLSXStyle.writeFile(wb, `fullday_${localStamp(now)}.xlsx`);
};

// ── EXPORTAR POR RANGO DE FECHAS ─────────────────────────────────

export const exportFullDayByDateRange = async (orders: FullDayOrder[], startDate: Date, endDate: Date) => {
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

  const titleS = { font:{bold:true,sz:14,name:'Arial',color:{rgb:'1A1A1A'}}, fill:fill('FFD3B6'), alignment:{horizontal:'center',vertical:'center'} };
  const h2S    = { font:{bold:true,sz:11,name:'Arial',color:{rgb:'1A1A1A'}}, fill:fill('D3D1C7'), alignment:{horizontal:'left',vertical:'center'}, border:borderHair };
  const labelS = { font:{sz:10,name:'Arial',color:{rgb:'5F5E5A'}}, fill:fill('FFFFFF'), alignment:{horizontal:'left',vertical:'center'}, border:borderHair };
  const valueS = { font:{bold:true,sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill('FFFFFF'), alignment:{horizontal:'right',vertical:'center'}, border:borderHair };

  // ── HOJA 1: RESUMEN ──────────────────────────────────────────
  const summaryAoa: object[][] = [
    [mkCell('REPORTE FULLDAY — RESUMEN', titleS), emptyCell(), emptyCell()],
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

  // ── HOJA 2: DETALLE ───────────────────────────────────────────
  const COLS = ['Fecha','Hora','N° Orden','Grado','Sección','Alumno','Apoderado','Teléfono','Pago','Entradas','Plato de Fondo','Bebidas','Total'];
  const COL_W = [12,8,15,25,10,30,28,14,14,35,35,30,12];
  const headerStyle = { font:{bold:true,sz:11,name:'Arial',color:{rgb:'F1EFE8'}}, fill:fill('5F5E5A'), alignment:{horizontal:'center',vertical:'center'}, border:borderMedium };

  const detailAoa: object[][] = [
    [mkCell(`DETALLE DE PEDIDOS — ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`, { font:{bold:true,sz:13,name:'Arial',color:{rgb:'1A1A1A'}}, fill:fill('FFD3B6'), alignment:{horizontal:'center',vertical:'center'} }), ...Array(12).fill(emptyCell())],
    COLS.map(h => mkCell(h, headerStyle)),
  ];

  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  let totalGeneral = 0;
  const categoryMapDetail = await loadCategoryMap(sorted);

  for (let i = 0; i < sorted.length; i++) {
    const order  = sorted[i];
    const cats   = categorizeWithMap(order, categoryMapDetail);
    const color  = getGradeColor(order.grade);
    const pColor = getPaymentColor(order.payment_method);
    const rowBg  = i % 2 === 1 ? 'F8F9FA' : 'FFFFFF';
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
      mkCell(order.grade, gradeStyle),
      mkCell(order.section, gradeStyle),
      mkCell(order.student_name, tS),
      mkCell(order.guardian_name || '—', tS),
      mkCell(order.phone || '—', cS),
      mkCell(order.payment_method === 'EFECTIVO' ? '💵 EFECTIVO' : order.payment_method === 'YAPE/PLIN' ? '📱 YAPE/PLIN' : order.payment_method === 'TARJETA' ? '💳 TARJETA' : order.payment_method === 'MIXTO' ? '🔀 MIXTO' : '— NO APLICA', payStyle),
      mkCell(cats.entradas, tS),
      mkCell(cats.fondos,   tS),
      mkCell(cats.bebidas,  tS),
      mkCell(`S/ ${order.total.toFixed(2)}`, rS),
    ]);
  }

  detailAoa.push(Array(13).fill(emptyCell()));
  detailAoa.push(Array(13).fill(emptyCell()));
  detailAoa.push([
    mkCell(`Total de pedidos: ${filtered.length}   |   Total ventas: S/ ${totalGeneral.toFixed(2)}`, {
      font: { italic:true, sz:10, name:'Arial', color:{rgb:'888780'} },
    }),
    ...Array(12).fill(emptyCell()),
  ]);

  const detailRowHeights = [26, 20, ...sorted.map(() => 18)];
  const wsDetail = buildStyledSheet(detailAoa, COL_W, detailRowHeights, [{s:{r:0,c:0},e:{r:0,c:12}}], 'A2:M2');
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
    [mkCell('TOP 10 PRODUCTOS FULLDAY', {font:{bold:true,sz:13,name:'Arial',color:{rgb:'1A1A1A'}},fill:fill('FFD3B6'),alignment:{horizontal:'center',vertical:'center'}}), emptyCell(), emptyCell(), emptyCell()],
    [mkCell('#',topHeader), mkCell('Producto',topHeader), mkCell('Cantidad',topHeader), mkCell('Total vendido',topHeader)],
    ...topProducts.map((p, i) => [
      mkCell(i + 1,    { font:{sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(i%2===0?'FFFFFF':'F8F9FA'), alignment:{horizontal:'center'}, border:borderHair }),
      mkCell(p.name.toUpperCase(), { font:{sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(i%2===0?'FFFFFF':'F8F9FA'), alignment:{horizontal:'left',wrapText:true}, border:borderHair }),
      mkCell(p.quantity, { font:{bold:true,sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(i%2===0?'FFFFFF':'F8F9FA'), alignment:{horizontal:'center'}, border:borderHair }),
      mkCell(`S/ ${p.total.toFixed(2)}`, { font:{bold:true,sz:10,name:'Arial',color:{rgb:'2C2C2A'}}, fill:fill(i%2===0?'FFFFFF':'F8F9FA'), alignment:{horizontal:'right'}, border:borderHair }),
    ]),
  ];

  const wsTop = buildStyledSheet(topAoa, [5,45,12,18], [26,20,...topProducts.map(()=>18)], [{s:{r:0,c:0},e:{r:0,c:3}}]);
  XLSXStyle.utils.book_append_sheet(wb, wsTop, 'Top 10 Productos');

  const s = localStamp(startDate);
  const e = localStamp(endDate);
  XLSXStyle.writeFile(wb, `fullday_${s}_al_${e}.xlsx`);
};

// ── EXPORTAR CSV (sin cambios) ───────────────────────────────────

export const exportFullDayToCSV = (orders: FullDayOrder[], fileName: string) => {
  if (orders.length === 0) { alert('No hay pedidos para exportar'); return; }

  const headers = ['FECHA','HORA','N° ORDEN','ALUMNO','GRADO','SECCIÓN','APODERADO','TELÉFONO','MONTO','MÉTODO PAGO','PRODUCTOS'];
  const rows = orders.map(o => [
    formatDateForDisplay(new Date(o.created_at)),
    formatTimeForDisplay(new Date(o.created_at)),
    o.order_number,
    o.student_name,
    o.grade,
    o.section,
    o.guardian_name,
    o.phone || '',
    `S/ ${o.total.toFixed(2)}`,
    o.payment_method || 'NO APLICA',
    o.items.map(i => `${i.quantity}x ${i.name.toUpperCase()}`).join(' + '),
  ]);

  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
};
