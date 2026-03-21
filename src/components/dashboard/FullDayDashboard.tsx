// ============================================
// ARCHIVO: src/components/dashboard/FullDayDashboard.tsx
// Dashboard FullDay — KPIs mejorados
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { generateFullDayTicketSummary, printFullDayResumenTicket } from '../../utils/fulldayTicketUtils';
import { FullDayOrder, FullDayOrderItem } from '../../types/fullday';
import {
  ChefHat, Package, Users, TrendingUp,
  Printer, RefreshCw, Calendar, BookOpen, Trophy, Clock,
} from 'lucide-react';

// ── Orden de grados del sistema ───────────────────────────────────
const GRADE_ORDER = [
  'RED ROOM','YELLOW ROOM','GREEN ROOM',
  'PRIMERO DE PRIMARIA','SEGUNDO DE PRIMARIA','TERCERO DE PRIMARIA',
  'CUARTO DE PRIMARIA','QUINTO DE PRIMARIA','SEXTO DE PRIMARIA',
  'PRIMERO DE SECUNDARIA','SEGUNDO DE SECUNDARIA','TERCERO DE SECUNDARIA',
  'CUARTO DE SECUNDARIA','QUINTO DE SECUNDARIA',
];
const gradeIndex = (g: string) => { const i = GRADE_ORDER.indexOf(g); return i === -1 ? 999 : i; };

// ── Tipos ────────────────────────────────────────────────────────
interface ProductCount { name: string; total: number; byGrade: Record<string, number>; }
interface GradeSummary { grade: string; section: string; orderCount: number; products: Record<string, number>; }

// ── Helpers ──────────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const fmt      = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Clasificadores — excluir bebidas del plato más pedido
const BEBIDA_KEYWORDS = [
  'gaseosa','inca kola','coca cola','sprite','fanta','agua','jugo','chicha',
  'maracuya','limonada','café','infusión','capuchino','expresso','bebida',
  'refresco','te ','mate','leche','néctar','frugos',
];
const isBebida = (name: string) => BEBIDA_KEYWORDS.some(k => name.toLowerCase().includes(k));

// ── KPI Card ─────────────────────────────────────────────────────
interface KpiProps {
  label: string; value: string; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string; accent: string;
  barPct?: number; tag?: string; tagBg?: string; tagColor?: string;
}
const KpiCard: React.FC<KpiProps> = ({ label, value, sub, icon: Icon, iconBg, iconColor, accent, barPct, tag, tagBg, tagColor }) => (
  <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-sm border border-white/20 relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }} />
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-xl" style={{ background: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      {tag && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: tagBg, color: tagColor }}>{tag}</span>}
    </div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
    <p className="text-xs text-gray-400 mt-1">{sub}</p>
    {barPct !== undefined && (
      <div className="w-full bg-gray-100 rounded-full h-1 mt-3">
        <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${Math.min(barPct,100)}%`, background: accent }} />
      </div>
    )}
  </div>
);

// ── Sparkline pedidos por hora — interactivo ─────────────────────
const HourlySparkline: React.FC<{ orders: FullDayOrder[]; accentColor?: string; accentLight?: string; textColor?: string }> = ({
  orders, accentColor = '#3B82F6', accentLight = '#BFDBFE', textColor = '#1D4ED8',
}) => {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);

  const hourly = useMemo(() => {
    const counts = Array(12).fill(0);
    orders.forEach(o => {
      const h = new Date(o.created_at).getHours();
      const idx = h - 6;
      if (idx >= 0 && idx < 12) counts[idx]++;
    });
    return counts;
  }, [orders]);

  const max     = Math.max(...hourly, 1);
  const peakIdx = hourly.indexOf(Math.max(...hourly));
  const shown   = activeIdx !== null ? activeIdx : peakIdx;

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-sm border border-white/20 relative overflow-hidden" style={{ gridColumn: 'span 2' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accentColor }} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl" style={{ background: accentLight + '66' }}>
            <Clock size={18} style={{ color: textColor }} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pedidos por hora</p>
            <p className="text-xs text-gray-400">
              {shown + 6}:00–{shown + 7}:00 ·{' '}
              <span className="font-semibold" style={{ color: accentColor }}>
                {hourly[shown]} pedido{hourly[shown] !== 1 ? 's' : ''}
              </span>
              {activeIdx === null && <span className="text-gray-300"> (pico)</span>}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: accentLight + '66', color: textColor }}>
          tendencia
        </span>
      </div>
      <div className="flex items-end gap-1 h-12">
        {hourly.map((count, i) => {
          const isActive = i === (activeIdx ?? peakIdx);
          const height   = Math.max((count / max) * 48, count > 0 ? 4 : 2);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center cursor-pointer group"
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              title={`${i + 6}:00 — ${count} pedido${count !== 1 ? 's' : ''}`}
            >
              <div
                className="w-full rounded-sm transition-all duration-200"
                style={{
                  height: `${height}px`,
                  background: isActive ? accentColor : accentLight,
                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        {[6,7,8,9,10,11,12,13,14,15,16,17].map(h => (
          <span key={h} className="flex-1 text-center" style={{ fontSize: '9px', color: '#D1D5DB' }}>{h}</span>
        ))}
      </div>
    </div>
  );
};

// ── Panel ventas FullDay — solo total ────────────────────────────
const IncomePanelFullDay: React.FC<{ total: number }> = ({ total }) => (
  <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-sm border border-white/20 relative overflow-hidden" style={{ gridColumn: 'span 2' }}>
    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: '#DC2626' }} />
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 rounded-xl" style={{ background: '#FEE2E2' }}>
        <TrendingUp size={18} style={{ color: '#DC2626' }} />
      </div>
      <p className="text-xs text-gray-500 font-medium">Ventas FullDay</p>
      <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#991B1C' }}>ventas</span>
    </div>
    <div className="text-center">
      <p className="text-xs text-gray-400 mb-1">Total del día</p>
      <p className="text-2xl font-bold text-gray-900">{fmt(total)}</p>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────
const FullDayDashboard: React.FC = () => {
  const [orders,       setOrders]       = useState<FullDayOrder[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [lastUpdated,  setLastUpdated]  = useState<Date>(new Date());

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fullday').select('*')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setOrders((data || []).map((o: any) => ({
        ...o, created_at: new Date(o.created_at), updated_at: new Date(o.updated_at),
      })) as FullDayOrder[]);
      setLastUpdated(new Date());
    } catch (e) { console.error('Error fetching FullDay orders:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [selectedDate]);

  const { productCounts, platosYEntradas, gradeSummaries, totalProducts, totalOrders, totalVentas } = useMemo(() => {
    const prodMap:  Record<string, ProductCount> = {};
    const gradeMap: Record<string, GradeSummary> = {};
    let totalVentas = 0;

    orders.forEach(order => {
      totalVentas += order.total;
      const gradeKey = `${order.grade}-${order.section}`;
      if (!gradeMap[gradeKey]) gradeMap[gradeKey] = { grade: order.grade, section: order.section, orderCount: 0, products: {} };
      gradeMap[gradeKey].orderCount++;
      (order.items || []).forEach((item: FullDayOrderItem) => {
        if (!prodMap[item.name]) prodMap[item.name] = { name: item.name, total: 0, byGrade: {} };
        prodMap[item.name].total += item.quantity;
        prodMap[item.name].byGrade[gradeKey] = (prodMap[item.name].byGrade[gradeKey] || 0) + item.quantity;
        gradeMap[gradeKey].products[item.name] = (gradeMap[gradeKey].products[item.name] || 0) + item.quantity;
      });
    });

    const productCounts   = Object.values(prodMap).sort((a, b) => b.total - a.total);
    // Solo entradas y platos de fondo (sin bebidas) para el KPI "Plato más pedido"
    const platosYEntradas = productCounts.filter(p => !isBebida(p.name));
    const totalProducts   = productCounts.reduce((s, p) => s + p.total, 0);

    // Ordenar grados: menor a mayor según GRADE_ORDER, luego sección A-Z
    const gradeSummaries = Object.values(gradeMap).sort((a, b) => {
      const gi = gradeIndex(a.grade) - gradeIndex(b.grade);
      if (gi !== 0) return gi;
      return a.section.localeCompare(b.section);
    });

    return { productCounts, platosYEntradas, gradeSummaries, totalProducts, totalOrders: orders.length, totalVentas };
  }, [orders]);

  const topPlato = platosYEntradas[0] ?? null;
  const isToday  = selectedDate === todayStr();

  const handlePrintTicket = () => {
    if (productCounts.length === 0) return;
    const start = new Date(selectedDate + 'T00:00:00');
    const end   = new Date(selectedDate + 'T23:59:59');
    printFullDayResumenTicket(generateFullDayTicketSummary(orders, start, end), start, end);
  };

  const handlePrint = () => {
    const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const productRows = productCounts.map(p =>
      `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:bold;">${p.name}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:18px;font-weight:900;color:#dc2626;">${p.total}</td></tr>`
    ).join('');
    const gradeRows = gradeSummaries.map(g => {
      const prods = Object.entries(g.products).map(([name, qty]) =>
        `<span style="display:inline-block;background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;padding:2px 8px;margin:2px;font-size:11px;"><b>${qty}x</b> ${name}</span>`
      ).join('');
      return `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:bold;">${g.grade} "${g.section}"</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${g.orderCount}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${prods}</td></tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Producción FullDay</title>
      <style>@media print{@page{margin:15mm}}body{font-family:'Courier New',monospace;color:#111}
      h1{font-size:20px;margin:0 0 4px}.sub{font-size:13px;color:#555;margin-bottom:16px}
      .section-title{font-size:14px;font-weight:900;background:#dc2626;color:white;padding:6px 12px;margin:16px 0 8px;text-transform:uppercase}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#f3f4f6;padding:6px 10px;text-align:left;font-size:11px;text-transform:uppercase}
      .totals{display:flex;gap:20px;margin-bottom:16px}
      .total-box{border:2px solid #dc2626;border-radius:6px;padding:8px 16px;text-align:center}
      .total-box .num{font-size:28px;font-weight:900;color:#dc2626}.total-box .lbl{font-size:11px;color:#555;text-transform:uppercase}</style>
      </head><body>
      <h1>🍱 HOJA DE PRODUCCIÓN — FULLDAY</h1>
      <div class="sub">MARY'S RESTAURANT | ${dateLabel}</div>
      <div class="totals">
        <div class="total-box"><div class="num">${totalOrders}</div><div class="lbl">Pedidos</div></div>
        <div class="total-box"><div class="num">${totalProducts}</div><div class="lbl">Unidades</div></div>
        <div class="total-box"><div class="num">${productCounts.length}</div><div class="lbl">Ítems distintos</div></div>
      </div>
      <div class="section-title">Resumen de producción</div>
      <table><thead><tr><th>Producto</th><th>Cantidad</th></tr></thead><tbody>${productRows}</tbody></table>
      <div class="section-title">Detalle por grado</div>
      <table><thead><tr><th>Grado</th><th>Pedidos</th><th>Productos</th></tr></thead><tbody>${gradeRows}</tbody></table>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">Producción FullDay</h2>
              <p className="text-xs text-gray-500">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none"/>
            </div>
            <button onClick={fetchOrders} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handlePrintTicket} disabled={productCounts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white text-sm font-semibold hover:from-gray-800 hover:to-gray-900 transition-all disabled:opacity-40">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Ticketera</span>
            </button>
            <button onClick={handlePrint} disabled={productCounts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-40">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>
        {isToday && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Actualizado {lastUpdated.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-sm border border-white/20 text-center">
          <RefreshCw className="h-8 w-8 text-red-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando pedidos...</p>
        </div>
      ) : productCounts.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-sm border border-white/20 text-center">
          <div className="text-5xl mb-3">🍱</div>
          <p className="text-gray-600 font-semibold">Sin pedidos FullDay</p>
          <p className="text-gray-400 text-sm mt-1">{isToday ? 'Aún no hay pedidos para hoy.' : 'No hubo pedidos en esta fecha.'}</p>
        </div>
      ) : (
        <>
          {/* ── 3 KPIs ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <KpiCard
              label="Pedidos del día"
              value={String(totalOrders)}
              sub="alumnos atendidos"
              icon={Package}
              iconBg="#FEE2E2" iconColor="#DC2626" accent="#EF4444"
              barPct={Math.min((totalOrders / 100) * 100, 100)}
              tag="producción" tagBg="#FFF1F2" tagColor="#B91C1C"
            />
            <KpiCard
              label="Unidades a preparar"
              value={String(totalProducts)}
              sub={`${productCounts.length} ítems distintos`}
              icon={ChefHat}
              iconBg="#FEF3C7" iconColor="#D97706" accent="#F59E0B"
              barPct={Math.min((totalProducts / 200) * 100, 100)}
              tag="cocina" tagBg="#FEF3C7" tagColor="#92400E"
            />
            <KpiCard
              label="Plato más pedido"
              value={topPlato ? topPlato.name.split(' ').slice(0, 3).join(' ') : '—'}
              sub={topPlato
                ? `${topPlato.total} unid. · ${((topPlato.total / totalProducts) * 100).toFixed(0)}% del total`
                : 'sin datos'}
              icon={Trophy}
              iconBg="#EDE9FE" iconColor="#7C3AED" accent="#8B5CF6"
              barPct={topPlato ? (topPlato.total / totalProducts) * 100 : 0}
              tag="top plato" tagBg="#EDE9FE" tagColor="#5B21B6"
            />
          </div>

          {/* ── Sparkline + Panel ventas ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <HourlySparkline orders={orders} />
            <IncomePanelFullDay total={totalVentas} />
          </div>

          {/* ── Paneles ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Hoja de producción */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-red-500" />
                <h3 className="font-bold text-gray-900">Hoja de Producción</h3>
                <span className="ml-auto text-xs font-semibold bg-red-50 text-red-600 px-2 py-1 rounded-full">
                  {productCounts.length} ítems
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {productCounts.map((p, i) => {
                  const pct = totalProducts > 0 ? (p.total / totalProducts) * 100 : 0;
                  return (
                    <div key={p.name} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                      <span className="w-6 text-center text-xs font-bold text-gray-300">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800 text-sm truncate pr-2">{p.name}</span>
                          <span className="text-2xl font-black text-red-600 leading-none flex-shrink-0">{p.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% del total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">TOTAL UNIDADES</span>
                <span className="text-2xl font-black text-gray-900">{totalProducts}</span>
              </div>
            </div>

            {/* Detalle por grado — ordenado de menor a mayor */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-gray-900">Detalle por Grado</h3>
                <span className="ml-auto text-xs font-semibold bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                  {gradeSummaries.length} grados
                </span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                {gradeSummaries.map(g => (
                  <div key={`${g.grade}-${g.section}`} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-black text-xs">
                          {g.section}
                        </span>
                        <span className="font-bold text-gray-800 text-sm">{g.grade}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {g.orderCount} pedido{g.orderCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-9">
                      {Object.entries(g.products).sort((a, b) => b[1] - a[1]).map(([name, qty]) => (
                        <span key={name} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                          <span className="font-black">{qty}×</span>
                          <span className="truncate max-w-[100px]">{name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default FullDayDashboard;
