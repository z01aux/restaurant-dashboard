// ============================================
// ARCHIVO: src/components/dashboard/FullDayDashboard.tsx
// Dashboard de producción FullDay
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { FullDayOrder, FullDayOrderItem } from '../../types/fullday';
import { ChefHat, Package, Users, TrendingUp, Printer, RefreshCw, Calendar, BookOpen } from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────
interface ProductCount {
  name: string;
  total: number;
  byGrade: Record<string, number>;
}

interface GradeSummary {
  grade: string;
  section: string;
  orderCount: number;
  products: Record<string, number>;
}

// ── HELPERS ───────────────────────────────────────────
const formatDate = (d: Date) =>
  d.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────
const FullDayDashboard: React.FC = () => {
  const [orders, setOrders] = useState<FullDayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ── FETCH ────────────────────────────────────────────
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const start = `${selectedDate}T00:00:00`;
      const end   = `${selectedDate}T23:59:59`;
      const { data, error } = await supabase
        .from('fullday')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: true });
      if (error) throw error;
      const converted = (data || []).map((o: any) => ({
        ...o,
        created_at: new Date(o.created_at),
        updated_at: new Date(o.updated_at),
      })) as FullDayOrder[];
      setOrders(converted);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error fetching FullDay orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [selectedDate]);

  // ── CÁLCULOS ─────────────────────────────────────────
  const { productCounts, gradeSummaries, totalProducts, totalOrders } = useMemo(() => {
    const prodMap: Record<string, ProductCount> = {};
    const gradeMap: Record<string, GradeSummary> = {};

    orders.forEach(order => {
      const gradeKey = `${order.grade}-${order.section}`;
      if (!gradeMap[gradeKey]) {
        gradeMap[gradeKey] = {
          grade: order.grade,
          section: order.section,
          orderCount: 0,
          products: {},
        };
      }
      gradeMap[gradeKey].orderCount++;

      (order.items || []).forEach((item: FullDayOrderItem) => {
        // Por producto global
        if (!prodMap[item.name]) {
          prodMap[item.name] = { name: item.name, total: 0, byGrade: {} };
        }
        prodMap[item.name].total += item.quantity;
        prodMap[item.name].byGrade[gradeKey] =
          (prodMap[item.name].byGrade[gradeKey] || 0) + item.quantity;

        // Por grado
        gradeMap[gradeKey].products[item.name] =
          (gradeMap[gradeKey].products[item.name] || 0) + item.quantity;
      });
    });

    const productCounts = Object.values(prodMap).sort((a, b) => b.total - a.total);
    const gradeSummaries = Object.values(gradeMap).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      return a.section.localeCompare(b.section);
    });
    const totalProducts = productCounts.reduce((s, p) => s + p.total, 0);

    return { productCounts, gradeSummaries, totalProducts, totalOrders: orders.length };
  }, [orders]);

  // ── IMPRIMIR ─────────────────────────────────────────
  const handlePrint = () => {
    const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const productRows = productCounts.map(p =>
      `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:bold;">${p.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:18px;font-weight:900;color:#dc2626;">${p.total}</td>
      </tr>`
    ).join('');

    const gradeRows = gradeSummaries.map(g => {
      const prods = Object.entries(g.products).map(([name, qty]) =>
        `<span style="display:inline-block;background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;padding:2px 8px;margin:2px;font-size:11px;"><b>${qty}x</b> ${name}</span>`
      ).join('');
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:bold;">${g.grade} &quot;${g.section}&quot;</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${g.orderCount}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${prods}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Producción FullDay - ${dateLabel}</title>
      <style>
        @media print { @page { margin: 15mm; } }
        body { font-family: 'Courier New', monospace; color: #111; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .sub { font-size: 13px; color: #555; margin-bottom: 16px; }
        .section-title { font-size: 14px; font-weight: 900; background: #dc2626; color: white; padding: 6px 12px; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 1px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f3f4f6; padding: 6px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .totals { display: flex; gap: 20px; margin-bottom: 16px; }
        .total-box { border: 2px solid #dc2626; border-radius: 6px; padding: 8px 16px; text-align: center; }
        .total-box .num { font-size: 28px; font-weight: 900; color: #dc2626; }
        .total-box .lbl { font-size: 11px; color: #555; text-transform: uppercase; }
      </style></head><body>
      <h1>🍱 HOJA DE PRODUCCIÓN — FULLDAY</h1>
      <div class="sub">MARY'S RESTAURANT &nbsp;|&nbsp; ${dateLabel}</div>
      <div class="totals">
        <div class="total-box"><div class="num">${totalOrders}</div><div class="lbl">Pedidos</div></div>
        <div class="total-box"><div class="num">${totalProducts}</div><div class="lbl">Productos totales</div></div>
        <div class="total-box"><div class="num">${productCounts.length}</div><div class="lbl">Ítems distintos</div></div>
      </div>
      <div class="section-title">📦 Cantidad por Producto</div>
      <table><thead><tr><th>Producto</th><th style="text-align:center">Cantidad</th></tr></thead>
      <tbody>${productRows}</tbody></table>
      <div class="section-title">🎒 Detalle por Grado</div>
      <table><thead><tr><th>Grado</th><th style="text-align:center">Pedidos</th><th>Productos</th></tr></thead>
      <tbody>${gradeRows}</tbody></table>
      <div style="margin-top:20px;font-size:10px;color:#999;text-align:right;">Impreso: ${new Date().toLocaleString('es-PE')}</div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  };

  // ── IMPRIMIR TICKETERA TÉRMICA ────────────────────────
  const handlePrintTicket = () => {
    const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const productRows = productCounts.map(p =>
      `<div class="product-row">
        <span class="product-name">${p.name.toUpperCase()}</span>
        <span class="product-qty">${p.total}</span>
      </div>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Ticket Producción FullDay</title>
      <style>
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { width: 80mm !important; margin: 0 auto !important; padding: 0 !important; }
          * { box-sizing: border-box !important; }
        }
        * { box-sizing: border-box; font-family: 'Courier New', monospace; }
        body {
          width: 80mm;
          margin: 0 auto;
          padding: 0;
          background: white;
          color: black;
          font-size: 12px;
          line-height: 1.3;
        }
        .ticket { padding: 8px; width: 100%; }
        .center { text-align: center; }
        .divider { border-top: 1px solid #000; margin: 6px 0; }
        .divider-dashed { border-top: 1px dashed #000; margin: 4px 0; }
        .header-title { font-size: 14px; font-weight: 900; }
        .header-sub { font-size: 10px; font-weight: bold; }
        .date-label { font-size: 10px; font-weight: bold; margin: 3px 0; }
        .stats-row { display: flex; justify-content: space-between; margin: 4px 0; }
        .stat-box { text-align: center; flex: 1; }
        .stat-num { font-size: 18px; font-weight: 900; }
        .stat-lbl { font-size: 9px; font-weight: bold; text-transform: uppercase; }
        .section-header {
          text-align: center;
          font-weight: 900;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 6px 0 4px;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 3px 0;
        }
        .product-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 3px 0;
          border-bottom: 1px dashed #ccc;
        }
        .product-name {
          font-size: 11px;
          font-weight: bold;
          flex: 1;
          padding-right: 4px;
          word-break: break-word;
        }
        .product-qty {
          font-size: 16px;
          font-weight: 900;
          flex-shrink: 0;
          min-width: 24px;
          text-align: right;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          border-top: 2px solid #000;
          padding-top: 4px;
          margin-top: 4px;
          font-weight: 900;
          font-size: 13px;
        }
        .footer { text-align: center; font-size: 9px; font-weight: bold; margin-top: 6px; }
      </style></head>
      <body><div class="ticket">
        <div class="center">
          <div class="header-title">MARY'S RESTAURANT</div>
          <div class="header-sub">PRODUCCIÓN FULLDAY</div>
          <div class="divider"></div>
          <div class="date-label">${dateLabel.toUpperCase()}</div>
        </div>
        <div class="divider"></div>
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-num">${totalOrders}</div>
            <div class="stat-lbl">Pedidos</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${totalProducts}</div>
            <div class="stat-lbl">Unidades</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${productCounts.length}</div>
            <div class="stat-lbl">Ítems</div>
          </div>
        </div>
        <div class="section-header">★ CANTIDAD POR PRODUCTO ★</div>
        ${productRows}
        <div class="total-row">
          <span>TOTAL</span>
          <span>${totalProducts}</span>
        </div>
        <div class="divider"></div>
        <div class="footer">
          ${new Date().toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div class="center" style="font-size:9px;font-weight:bold;margin-top:4px;">*** FIN DE PRODUCCIÓN ***</div>
      </div></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 300);
    }
  };


  const isToday = selectedDate === todayStr();
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
              <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Producción FullDay</h2>
              <p className="text-xs sm:text-sm text-gray-500 capitalize">{formatDate(selectedDateObj)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none"
              />
            </div>
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handlePrintTicket}
              disabled={productCounts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white text-sm font-semibold hover:from-gray-800 hover:to-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Imprimir en ticketera térmica"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Ticketera</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={productCounts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Imprimir hoja completa"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Indicador en tiempo real */}
        {isToday && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Actualizado {lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </div>

      {/* STATS RÁPIDAS */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Pedidos', value: totalOrders, icon: Package, color: 'from-red-500 to-red-600' },
          { label: 'Unidades totales', value: totalProducts, icon: TrendingUp, color: 'from-amber-500 to-yellow-500' },
          { label: 'Grados con pedidos', value: gradeSummaries.length, icon: Users, color: 'from-emerald-500 to-green-500' },
        ].map(s => (
          <div key={s.label} className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-white/20 flex items-center gap-3">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${s.color} flex-shrink-0`}>
              <s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{s.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
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
          <p className="text-gray-400 text-sm mt-1">
            {isToday ? 'Aún no hay pedidos para hoy.' : 'No hubo pedidos en esta fecha.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* ── PANEL 1: PRODUCCIÓN POR PRODUCTO ── */}
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
                    {/* Número de ranking */}
                    <span className="w-6 text-center text-xs font-bold text-gray-300">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-sm truncate pr-2">{p.name}</span>
                        <span className="text-2xl font-black text-red-600 leading-none flex-shrink-0">{p.total}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% del total</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Total al pie */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">TOTAL UNIDADES</span>
              <span className="text-2xl font-black text-gray-900">{totalProducts}</span>
            </div>
          </div>

          {/* ── PANEL 2: DETALLE POR GRADO ── */}
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
                        {g.grade.replace(/[^0-9]/g, '') || g.grade.charAt(0)}
                      </span>
                      <span className="font-bold text-gray-800 text-sm">
                        {g.grade} &quot;{g.section}&quot;
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {g.orderCount} pedido{g.orderCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-9">
                    {Object.entries(g.products)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, qty]) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full"
                        >
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
      )}
    </div>
  );
};

export default FullDayDashboard;
