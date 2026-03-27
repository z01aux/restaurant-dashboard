// ============================================
// ARCHIVO: src/utils/gradeExportUtils.ts
// Exportación por Grado/Sección — FullDay y Loncheritas
// Incluye columna NOTAS
// Usa xlsx-js-style (npm install xlsx-js-style)
// ============================================

import XLSXStyle from 'xlsx-js-style';
import { FullDayOrder } from '../types/fullday';
import { LoncheritasOrder } from '../types/loncheritas';
import { supabase } from '../lib/supabase';
import { formatDateForDisplay } from './dateUtils';

// ── Tipos internos ───────────────────────────────────────────────

export interface GradeOrder {
  id: string;
  grade: string;
  section: string;
  student_name: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  created_at: string | Date;
  notes?: string | null;
}

interface ProcessedRow {
  grade:        string;
  section:      string;
  student_name: string;
  entrada:      string;
  fondo:        string;
  bebida:       string;
  notas:        string;
}

// ── Orden exacto de grados (igual que GRADES en student.ts) ─────

const GRADE_ORDER = [
  'RED ROOM',
  'YELLOW ROOM',
  'GREEN ROOM',
  'PRIMERO DE PRIMARIA',
  'SEGUNDO DE PRIMARIA',
  'TERCERO DE PRIMARIA',
  'CUARTO DE PRIMARIA',
  'QUINTO DE PRIMARIA',
  'SEXTO DE PRIMARIA',
  'PRIMERO DE SECUNDARIA',
  'SEGUNDO DE SECUNDARIA',
  'TERCERO DE SECUNDARIA',
  'CUARTO DE SECUNDARIA',
  'QUINTO DE SECUNDARIA',
];

const gradeIndex = (grade: string): number => {
  const idx = GRADE_ORDER.indexOf(grade);
  return idx === -1 ? 999 : idx;
};

// ── Colores por grado (RRGGBB sin prefijo) ───────────────────────

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

const getGradeColor = (grade: string) =>
  GRADE_COLORS[grade] ?? DEFAULT_COLOR;

// ── Categorización BULK — una sola consulta para todos los pedidos ──

const isBebidaG = (cat: string, name: string) =>
  cat.includes('bebida') || cat.includes('gaseosa') || cat.includes('jugo') ||
  cat.includes('café')   || cat.includes('infusión') || cat.includes('agua') ||
  cat.includes('mate')   || cat.includes('te') ||
  (!cat && (name.includes('gaseosa')   || name.includes('inca kola')  || name.includes('coca cola') ||
  name.includes('sprite')    || name.includes('fanta')      || name.includes('agua') ||
  name.includes('jugo')      || name.includes('chicha')     || name.includes('maracuya') ||
  name.includes('limonada')  || name.includes('café')       || name.includes('infusión') ||
  name.includes('capuchino') || name.includes('expresso')   || name.includes('bebida') ||
  name.includes('refresco')  || name.includes('te ')));

const isEntradaG = (cat: string, name: string) =>
  cat.includes('entrada') || cat.includes('ensalada') || cat.includes('sopa') ||
  (!cat && (name.includes('entrada') || name.includes('ensalada') || name.includes('sopa') ||
  name.includes('caldo')   || name.includes('causa')    || name.includes('huancaina') ||
  name.includes('tamal')   || name.includes('chaufa')));

const categorizeItemsWithMap = (
  items: GradeOrder['items'],
  categoryMap: Map<string, string>
): { entrada: string; fondo: string; bebida: string } => {
  const entradas: string[] = [], fondos: string[] = [], bebidas: string[] = [];
  for (const item of items) {
    const display  = item.name;
    const category = (categoryMap.get(item.id) || '').toLowerCase();
    const name     = item.name.toLowerCase();
    if (isBebidaG(category, name))       { bebidas.push(display);  continue; }
    if (isEntradaG(category, name))      { entradas.push(display); continue; }
    fondos.push(display);
  }
  return {
    entrada: entradas.join(' + ') || '-',
    fondo:   fondos.join(' + ')   || '-',
    bebida:  bebidas.join(' + ')  || '-',
  };
};

const loadCategoryMapBulk = async (orders: GradeOrder[]): Promise<Map<string, string>> => {
  const allIds = [...new Set(orders.flatMap(o => o.items.map(i => i.id)))];
  const map = new Map<string, string>();
  if (allIds.length === 0) return map;
  try {
    const { data, error } = await supabase.from('menu_items').select('id, category').in('id', allIds);
    if (!error && data) (data as { id: string; category: string }[]).forEach(r => map.set(r.id, r.category || ''));
  } catch (e) { console.error('Error obteniendo categorías:', e); }
  return map;
};

// ── Categorización Loncheritas (todos los items son "desayuno/lonchera") ──────
const categorizeItemsLoncheritas = (items: GradeOrder['items']): { entrada: string; fondo: string; bebida: string } => ({
  entrada: '-',
  fondo:   items.map(i => `${i.quantity > 1 ? i.quantity + 'x ' : ''}${i.name}`).join(' + ') || '-',
  bebida:  '-',
});

// ── Construir filas ORDENADAS POR GRADO/SECCIÓN ────────────────────────────────────
const buildRowsByGrade = async (orders: GradeOrder[], mode: 'fullday' | 'loncheritas' = 'fullday'): Promise<ProcessedRow[]> => {
  const categoryMap = mode === 'loncheritas'
    ? new Map<string, string>()
    : await loadCategoryMapBulk(orders);

  const rows = orders.map(order => ({
    grade:        order.grade,
    section:      order.section,
    student_name: order.student_name,
    notas:        order.notes || '',
    ...(mode === 'loncheritas'
      ? categorizeItemsLoncheritas(order.items)
      : categorizeItemsWithMap(order.items, categoryMap)
    ),
  }));

  // Ordenar: grado (según GRADE_ORDER) → sección A-Z → alumno A-Z
  return rows.sort((a, b) => {
    const gi = gradeIndex(a.grade) - gradeIndex(b.grade);
    if (gi !== 0) return gi;
    const si = a.section.localeCompare(b.section);
    if (si !== 0) return si;
    return a.student_name.localeCompare(b.student_name);
  });
};

// ── Construir filas ORDENADAS POR NOMBRE DE ALUMNO (A-Z) ────────────────────────────
const buildRowsByStudentName = async (orders: GradeOrder[], mode: 'fullday' | 'loncheritas' = 'fullday'): Promise<ProcessedRow[]> => {
  const categoryMap = mode === 'loncheritas'
    ? new Map<string, string>()
    : await loadCategoryMapBulk(orders);

  const rows = orders.map(order => ({
    grade:        order.grade,
    section:      order.section,
    student_name: order.student_name,
    notas:        order.notes || '',
    ...(mode === 'loncheritas'
      ? categorizeItemsLoncheritas(order.items)
      : categorizeItemsWithMap(order.items, categoryMap)
    ),
  }));

  // Ordenar SOLO por nombre de alumno (alfabético A-Z)
  return rows.sort((a, b) => a.student_name.localeCompare(b.student_name));
};

// ── Helpers de estilo ────────────────────────────────────────────

const fill = (rgb: string) => ({
  patternType: 'solid',
  fgColor: { rgb },
  bgColor: { rgb },
});

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

const mkCell = (value: string, s: object) => ({ v: value, t: 's', s });
const emptyCell = () => ({ v: '', t: 's', s: {} });

// ════════════════════════════════════════════════════════════════
// EXPORTAR EXCEL — FullDay (POR GRADO/SECCIÓN) - ARCHIVO SEPARADO
// ════════════════════════════════════════════════════════════════

export const exportFullDayGradeExcel = async (
  orders: FullDayOrder[],
  selectedDate?: Date
): Promise<void> => {
  if (orders.length === 0) { alert('No hay pedidos para exportar.'); return; }

  const d = selectedDate ?? new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fecha = formatDateForDisplay(selectedDate ?? new Date());

  // Convertir FullDayOrder a GradeOrder con notas
  const gradeOrders: GradeOrder[] = orders.map(o => ({
    ...o,
    student_name: o.student_name,
    items: o.items,
    notes: o.notes,
  }));

  const rows = await buildRowsByGrade(gradeOrders);

  const aoa: object[][] = [];

  // Título
  aoa.push([
    mkCell(`PEDIDOS FULLDAY — ${fecha} (Por Grado/Sección)`, {
      font: { bold: true, sz: 13, name: 'Arial', color: { rgb: '1A1A1A' } },
      fill: fill('D3D1C7'),
      alignment: { horizontal: 'center', vertical: 'center' },
    }),
    emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(),
  ]);

  // Encabezados
  const headerStyle = {
    font: { bold: true, sz: 11, name: 'Arial', color: { rgb: '1A1A1A' } },
    fill: fill('B4B2A9'),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderMedium,
  };
  aoa.push([
    mkCell('Grado', headerStyle),
    mkCell('Sección', headerStyle),
    mkCell('Alumno', headerStyle),
    mkCell('Entrada', headerStyle),
    mkCell('Plato de Fondo', headerStyle),
    mkCell('Bebida', headerStyle),
    mkCell('Notas', headerStyle),
  ]);

  // Datos ordenados por grado
  for (const row of rows) {
    const color = getGradeColor(row.grade);
    const gradeStyle = {
      font: { bold: true, sz: 10, name: 'Arial', color: { rgb: color.font } },
      fill: fill(color.bg),
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHair,
    };
    const dataStyle = {
      font: { bold: true, sz: 10, name: 'Arial', color: { rgb: '1A1A1A' } },
      fill: fill('FFFFFF'),
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderHair,
    };
    aoa.push([
      mkCell(row.grade, gradeStyle),
      mkCell(row.section, gradeStyle),
      mkCell(row.student_name, dataStyle),
      mkCell(row.entrada, dataStyle),
      mkCell(row.fondo, dataStyle),
      mkCell(row.bebida, dataStyle),
      mkCell(row.notas || '', dataStyle),
    ]);
  }

  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell()]);
  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell()]);
  aoa.push([
    mkCell(`Total de pedidos: ${rows.length}`, {
      font: { italic: true, sz: 10, name: 'Arial', color: { rgb: '888780' } },
    }),
    emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(),
  ]);

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 25 }, // Grado
    { wch: 10 }, // Sección
    { wch: 38 }, // Alumno
    { wch: 30 }, // Entrada
    { wch: 30 }, // Plato de Fondo
    { wch: 24 }, // Bebida
    { wch: 40 }, // Notas
  ];
  ws['!rows'] = [{ hpt: 26 }, { hpt: 20 }, ...rows.map(() => ({ hpt: 18 }))];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  ws['!autofilter'] = { ref: 'A2:G2' };
  ws['!pageSetup'] = { paperSize: 9, orientation: 'landscape' };

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Por Grado y Seccion');
  XLSXStyle.writeFile(wb, `fullday_listas_gys_${stamp}.xlsx`);
};

// ════════════════════════════════════════════════════════════════
// EXPORTAR EXCEL — FullDay (ORDEN ALFABÉTICO) - ARCHIVO SEPARADO
// ════════════════════════════════════════════════════════════════

export const exportFullDayAlfabeticoExcel = async (
  orders: FullDayOrder[],
  selectedDate?: Date
): Promise<void> => {
  if (orders.length === 0) { alert('No hay pedidos para exportar.'); return; }

  const d = selectedDate ?? new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fecha = formatDateForDisplay(selectedDate ?? new Date());

  const gradeOrders: GradeOrder[] = orders.map(o => ({
    ...o,
    student_name: o.student_name,
    items: o.items,
    notes: o.notes,
  }));

  const rows = await buildRowsByStudentName(gradeOrders);

  const aoa: object[][] = [];

  // Título
  aoa.push([
    mkCell(`PEDIDOS FULLDAY — ${fecha} (Orden Alfabético)`, {
      font: { bold: true, sz: 13, name: 'Arial', color: { rgb: '1A1A1A' } },
      fill: fill('C9E2F5'),
      alignment: { horizontal: 'center', vertical: 'center' },
    }),
    emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(),
  ]);

  // Encabezados
  const headerStyle = {
    font: { bold: true, sz: 11, name: 'Arial', color: { rgb: '1A1A1A' } },
    fill: fill('B4B2A9'),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderMedium,
  };
  aoa.push([
    mkCell('Grado', headerStyle),
    mkCell('Sección', headerStyle),
    mkCell('Alumno', headerStyle),
    mkCell('Entrada', headerStyle),
    mkCell('Plato de Fondo', headerStyle),
    mkCell('Bebida', headerStyle),
    mkCell('Notas', headerStyle),
  ]);

  // Datos ordenados alfabéticamente
  for (const row of rows) {
    const color = getGradeColor(row.grade);
    const gradeStyle = {
      font: { bold: true, sz: 10, name: 'Arial', color: { rgb: color.font } },
      fill: fill(color.bg),
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHair,
    };
    const dataStyle = {
      font: { bold: true, sz: 10, name: 'Arial', color: { rgb: '1A1A1A' } },
      fill: fill('FFFFFF'),
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderHair,
    };
    aoa.push([
      mkCell(row.grade, gradeStyle),
      mkCell(row.section, gradeStyle),
      mkCell(row.student_name, dataStyle),
      mkCell(row.entrada, dataStyle),
      mkCell(row.fondo, dataStyle),
      mkCell(row.bebida, dataStyle),
      mkCell(row.notas || '', dataStyle),
    ]);
  }

  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell()]);
  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell()]);
  aoa.push([
    mkCell(`Total de pedidos: ${rows.length}`, {
      font: { italic: true, sz: 10, name: 'Arial', color: { rgb: '888780' } },
    }),
    emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell(),
  ]);

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 25 }, // Grado
    { wch: 10 }, // Sección
    { wch: 38 }, // Alumno
    { wch: 30 }, // Entrada
    { wch: 30 }, // Plato de Fondo
    { wch: 24 }, // Bebida
    { wch: 40 }, // Notas
  ];
  ws['!rows'] = [{ hpt: 26 }, { hpt: 20 }, ...rows.map(() => ({ hpt: 18 }))];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  ws['!autofilter'] = { ref: 'A2:G2' };
  ws['!pageSetup'] = { paperSize: 9, orientation: 'landscape' };

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Orden Alfabetico');
  XLSXStyle.writeFile(wb, `fullday_listas_alfabetico_${stamp}.xlsx`);
};

// ════════════════════════════════════════════════════════════════
// EXPORTAR EXCEL — Loncheritas (POR GRADO/SECCIÓN) - ARCHIVO SEPARADO
// ════════════════════════════════════════════════════════════════

export const exportLoncheritasGradeExcel = async (
  orders: LoncheritasOrder[],
  selectedDate?: Date
): Promise<void> => {
  if (orders.length === 0) { alert('No hay pedidos para exportar.'); return; }

  const d = selectedDate ?? new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fecha = formatDateForDisplay(selectedDate ?? new Date());

  const gradeOrders: GradeOrder[] = orders.map(o => ({
    ...o,
    student_name: o.student_name,
    items: o.items,
    notes: o.notes,
  }));

  const rows = await buildRowsByGrade(gradeOrders, 'loncheritas');

  const aoa: object[][] = [];

  // Título
  aoa.push([
    mkCell(`PEDIDOS LONCHERITAS — ${fecha} (Por Grado/Sección)`, {
      font: { bold: true, sz: 13, name: 'Arial', color: { rgb: '1A1A1A' } },
      fill: fill('9FE1CB'),
      alignment: { horizontal: 'center', vertical: 'center' },
    }),
    emptyCell(), emptyCell(), emptyCell(), emptyCell(),
  ]);

  // Encabezados
  const headerStyle = {
    font: { bold: true, sz: 11, name: 'Arial', color: { rgb: '1A1A1A' } },
    fill: fill('B4B2A9'),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderMedium,
  };
  aoa.push([
    mkCell('Grado', headerStyle),
    mkCell('Sección', headerStyle),
    mkCell('Alumno', headerStyle),
    mkCell('Desayuno/Lonchera', headerStyle),
    mkCell('Notas', headerStyle),
  ]);

  // Datos ordenados por grado
  for (const row of rows) {
    const color = getGradeColor(row.grade);
    const gradeStyle = {
      font: { bold: true, sz: 10, name: 'Arial', color: { rgb: color.font } },
      fill: fill(color.bg),
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHair,
    };
    const dataStyle = {
      font: { bold: true, sz: 10, name: 'Arial', color: { rgb: '1A1A1A' } },
      fill: fill('FFFFFF'),
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderHair,
    };
    aoa.push([
      mkCell(row.grade, gradeStyle),
      mkCell(row.section, gradeStyle),
      mkCell(row.student_name, dataStyle),
      mkCell(row.fondo, dataStyle),
      mkCell(row.notas || '', dataStyle),
    ]);
  }

  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell()]);
  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell()]);
  aoa.push([
    mkCell(`Total de pedidos: ${rows.length}`, {
      font: { italic: true, sz: 10, name: 'Arial', color: { rgb: '888780' } },
    }),
    emptyCell(), emptyCell(), emptyCell(), emptyCell(),
  ]);

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 25 }, // Grado
    { wch: 10 }, // Sección
    { wch: 38 }, // Alumno
    { wch: 60 }, // Desayuno/Lonchera
    { wch: 40 }, // Notas
  ];
  ws['!rows'] = [{ hpt: 26 }, { hpt: 20 }, ...rows.map(() => ({ hpt: 18 }))];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  ws['!autofilter'] = { ref: 'A2:E2' };
  ws['!pageSetup'] = { paperSize: 9, orientation: 'landscape' };

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Por Grado y Seccion');
  XLSXStyle.writeFile(wb, `loncheritas_listas_gys_${stamp}.xlsx`);
};

// ════════════════════════════════════════════════════════════════
// EXPORTAR EXCEL — Loncheritas (ORDEN ALFABÉTICO) - ARCHIVO SEPARADO
// ════════════════════════════════════════════════════════════════

export const exportLoncheritasAlfabeticoExcel = async (
  orders: LoncheritasOrder[],
  selectedDate?: Date
): Promise<void> => {
  if (orders.length === 0) { alert('No hay pedidos para exportar.'); return; }

  const d = selectedDate ?? new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fecha = formatDateForDisplay(selectedDate ?? new Date());

  const gradeOrders: GradeOrder[] = orders.map(o => ({
    ...o,
    student_name: o.student_name,
    items: o.items,
    notes: o.notes,
  }));

  const rows = await buildRowsByStudentName(gradeOrders, 'loncheritas');

  const aoa: object[][] = [];

  // Título
  aoa.push([
    mkCell(`PEDIDOS LONCHERITAS — ${fecha} (Orden Alfabético)`, {
      font: { bold: true, sz: 13, name: 'Arial', color: { rgb: '1A1A1A' } },
      fill: fill('B8E4D0'),
      alignment: { horizontal: 'center', vertical: 'center' },
    }),
    emptyCell(), emptyCell(), emptyCell(), emptyCell(),
  ]);

  // Encabezados
  const headerStyle = {
    font: { bold: true, sz: 11, name: 'Arial', color: { rgb: '1A1A1A' } },
    fill: fill('B4B2A9'),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderMedium,
  };
  aoa.push([
    mkCell('Grado', headerStyle),
    mkCell('Sección', headerStyle),
    mkCell('Alumno', headerStyle),
    mkCell('Desayuno/Lonchera', headerStyle),
    mkCell('Notas', headerStyle),
  ]);

  // Datos ordenados alfabéticamente
  for (const row of rows) {
    const color = getGradeColor(row.grade);
    const gradeStyle = {
      font: { bold: true, sz: 10, name: 'Arial', color: { rgb: color.font } },
      fill: fill(color.bg),
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHair,
    };
    const dataStyle = {
      font: { bold: true, sz: 10, name: 'Arial', color: { rgb: '1A1A1A' } },
      fill: fill('FFFFFF'),
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderHair,
    };
    aoa.push([
      mkCell(row.grade, gradeStyle),
      mkCell(row.section, gradeStyle),
      mkCell(row.student_name, dataStyle),
      mkCell(row.fondo, dataStyle),
      mkCell(row.notas || '', dataStyle),
    ]);
  }

  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell()]);
  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell(), emptyCell()]);
  aoa.push([
    mkCell(`Total de pedidos: ${rows.length}`, {
      font: { italic: true, sz: 10, name: 'Arial', color: { rgb: '888780' } },
    }),
    emptyCell(), emptyCell(), emptyCell(), emptyCell(),
  ]);

  const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 25 }, // Grado
    { wch: 10 }, // Sección
    { wch: 38 }, // Alumno
    { wch: 60 }, // Desayuno/Lonchera
    { wch: 40 }, // Notas
  ];
  ws['!rows'] = [{ hpt: 26 }, { hpt: 20 }, ...rows.map(() => ({ hpt: 18 }))];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  ws['!autofilter'] = { ref: 'A2:E2' };
  ws['!pageSetup'] = { paperSize: 9, orientation: 'landscape' };

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Orden Alfabetico');
  XLSXStyle.writeFile(wb, `loncheritas_listas_alfabetico_${stamp}.xlsx`);
};

// ════════════════════════════════════════════════════════════════
// EXPORTAR CSV (mantener compatibilidad)
// ════════════════════════════════════════════════════════════════

export const exportFullDayGradeCSV = async (
  orders: FullDayOrder[],
  selectedDate?: Date
): Promise<void> => {
  if (orders.length === 0) { alert('No hay pedidos para exportar.'); return; }

  const gradeOrders: GradeOrder[] = orders.map(o => ({
    ...o,
    student_name: o.student_name,
    items: o.items,
    notes: o.notes,
  }));

  const rows = await buildRowsByGrade(gradeOrders);
  const d = selectedDate ?? new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const lines = [
    ['Grado','Sección','Alumno','Entrada','Plato de Fondo','Bebida','Notas'].join(','),
    ...rows.map(r =>
      [r.grade, r.section, `"${r.student_name}"`, `"${r.entrada}"`, `"${r.fondo}"`, `"${r.bebida}"`, `"${r.notas}"`].join(',')
    ),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `fullday_listas_gys_${stamp}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

export const exportLoncheritasGradeCSV = async (
  orders: LoncheritasOrder[],
  selectedDate?: Date
): Promise<void> => {
  if (orders.length === 0) { alert('No hay pedidos para exportar.'); return; }

  const gradeOrders: GradeOrder[] = orders.map(o => ({
    ...o,
    student_name: o.student_name,
    items: o.items,
    notes: o.notes,
  }));

  const rows = await buildRowsByGrade(gradeOrders, 'loncheritas');
  const d = selectedDate ?? new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const lines = [
    ['Grado','Sección','Alumno','Entrada','Plato de Fondo','Bebida','Notas'].join(','),
    ...rows.map(r =>
      [r.grade, r.section, `"${r.student_name}"`, `"${r.entrada}"`, `"${r.fondo}"`, `"${r.bebida}"`, `"${r.notas}"`].join(',')
    ),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `loncheritas_listas_gys_${stamp}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};