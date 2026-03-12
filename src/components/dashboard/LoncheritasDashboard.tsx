// ============================================
// ARCHIVO: src/components/dashboard/LoncheritasDashboard.tsx
// Dashboard de VENTAS Loncheritas + botón Imprimir A4
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { LoncheritasOrder } from '../../types/loncheritas';
import { printLoncheritasA4 } from '../../utils/loncheritasTicketUtils';
import {
  ShoppingBag, DollarSign, Users, TrendingUp,
  RefreshCw, Calendar, CreditCard, Wallet, Smartphone,
  Star, ChefHat, Printer,
} from 'lucide-react';

// ── HELPERS ───────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

// ── COMPONENTE ────────────────────────────────────────
const LoncheritasDashboard: React.FC = () => {
  const [orders, setOrders] = useState<LoncheritasOrder[]>([]);
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
        .from('loncheritas')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: true });
      if (error) throw error;
      const converted = (data || []).map((o: any) => ({
        ...o,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
        created_at: new Date(o.created_at),
        updated_at: new Date(o.updated_at),
      })) as LoncheritasOrder[];
      setOrders(converted);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error fetching Loncheritas orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [selectedDate]);

  // ── CÁLCULOS ─────────────────────────────────────────
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalVentas = orders.reduce((s, o) => s + o.total, 0);
    const efectivo    = orders.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
    const yapePlin    = orders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
    const tarjeta     = orders.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
    const noAplica    = orders.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);
    const ticketProm  = totalOrders > 0 ? totalVentas / totalOrders : 0;

    const prodMap: Record<string, { name: string; qty: number; total: number }> = {};
    orders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        if (!prodMap[item.name]) prodMap[item.name] = { name: item.name, qty: 0, total: 0 };
        prodMap[item.name].qty   += item.quantity;
        prodMap[item.name].total += (item.price || 0) * item.quantity;
      });
    });
    // Sin límite — todos los productos
    const topProducts   = Object.values(prodMap).sort((a, b) => b.qty - a.qty);
    const totalUnidades = topProducts.reduce((s, p) => s + p.qty, 0);

    const gradeMap: Record<string, { grade: string; section: string; count: number; total: number }> = {};
    orders.forEach(o => {
      const key = `${o.grade}-${o.section}`;
      if (!gradeMap[key]) gradeMap[key] = { grade: o.grade, section: o.section, count: 0, total: 0 };
      gradeMap[key].count++;
      gradeMap[key].total += o.total;
    });
    const byGrade = Object.values(gradeMap).sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      return a.section.localeCompare(b.section);
    });

    return { totalOrders, totalVentas, efectivo, yapePlin, tarjeta, noAplica, ticketProm, topProducts, totalUnidades, byGrade };
  }, [orders]);

  const isToday = selectedDate === todayStr();

  // ── IMPRIMIR A4 ──────────────────────────────────────
  const handlePrintA4 = () => {
    if (orders.length === 0) return;
    printLoncheritasA4({ orders, selectedDate });
  };

  // ── RENDER ───────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── HEADER ── */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">Ventas Loncheritas</h2>
              <p className="text-xs text-gray-500">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PE', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-sm text-gray-700 bg-transparent border-none outline-none"
              />
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            {/* ✅ BOTÓN IMPRIMIR A4 */}
            <button
              onClick={handlePrintA4}
              disabled={orders.length === 0 || loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 text-white text-sm font-semibold hover:from-gray-800 hover:to-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Imprimir reporte A4 con todos los productos"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir A4</span>
            </button>
          </div>
        </div>

        {isToday && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Actualizado {lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Ventas',    value: fmt(stats.totalVentas),   sub: `${stats.totalOrders} pedido${stats.totalOrders !== 1 ? 's' : ''}`,           icon: DollarSign, color: 'from-purple-500 to-pink-500',   bg: 'bg-purple-50',  text: 'text-purple-700' },
          { label: 'Ticket Promedio', value: fmt(stats.ticketProm),    sub: 'por pedido',                                                                   icon: TrendingUp,  color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50',   text: 'text-amber-700' },
          { label: 'Unidades',        value: `${stats.totalUnidades}`, sub: `${stats.topProducts.length} prod.`,                                            icon: ChefHat,     color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'Grados',          value: `${stats.byGrade.length}`, sub: 'con pedidos hoy',                                                             icon: Users,       color: 'from-blue-500 to-indigo-500',  bg: 'bg-blue-50',    text: 'text-blue-700' },
        ].map(s => (
          <div key={s.label} className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              <span className={`text-xs font-semibold ${s.text} ${s.bg} px-2 py-0.5 rounded-full`}>{s.sub}</span>
            </div>
            <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-sm border border-white/20 text-center">
          <RefreshCw className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando ventas...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-sm border border-white/20 text-center">
          <div className="text-5xl mb-3">🍱</div>
          <p className="text-gray-600 font-semibold">Sin ventas Loncheritas</p>
          <p className="text-gray-400 text-sm mt-1">
            {isToday ? 'Aún no hay pedidos para hoy.' : 'No hubo pedidos en esta fecha.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* ── PANEL 1: MÉTODOS DE PAGO ── */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              <h3 className="font-bold text-gray-900">Métodos de Pago</h3>
              <span className="ml-auto text-xs font-semibold bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                {fmt(stats.totalVentas)}
              </span>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Efectivo',  value: stats.efectivo,  icon: Wallet,     color: 'from-green-400 to-emerald-500', badge: 'bg-green-50 text-green-700' },
                { label: 'Yape/Plin', value: stats.yapePlin,  icon: Smartphone, color: 'from-purple-400 to-violet-500', badge: 'bg-purple-50 text-purple-700' },
                { label: 'Tarjeta',   value: stats.tarjeta,   icon: CreditCard, color: 'from-blue-400 to-indigo-500',   badge: 'bg-blue-50 text-blue-700' },
                { label: 'No aplica', value: stats.noAplica,  icon: DollarSign, color: 'from-gray-400 to-gray-500',     badge: 'bg-gray-50 text-gray-600' },
              ].map(m => {
                const pct = stats.totalVentas > 0 ? (m.value / stats.totalVentas) * 100 : 0;
                return (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${m.color}`}>
                          <m.icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.badge}`}>{pct.toFixed(0)}%</span>
                        <span className="text-sm font-black text-gray-900">{fmt(m.value)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full bg-gradient-to-r ${m.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">TOTAL</span>
              <span className="text-xl font-black text-gray-900">{fmt(stats.totalVentas)}</span>
            </div>
          </div>

          {/* ── PANEL 2: TODOS LOS PRODUCTOS ── */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">Productos vendidos</h3>
              <span className="ml-auto text-xs font-semibold bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                {stats.topProducts.length} ítem{stats.topProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Lista completa, todos los productos, con scroll */}
            <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
              {stats.topProducts.map((p, i) => {
                const pct = stats.totalUnidades > 0 ? (p.qty / stats.totalUnidades) * 100 : 0;
                return (
                  <div key={p.name} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <span className="w-6 text-center text-xs font-black shrink-0"
                      style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : '#d1d5db' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-sm truncate pr-2">{p.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">{fmt(p.total)}</span>
                          <span className="text-xl font-black text-purple-600 leading-none">{p.qty}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-700"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">TOTAL UNIDADES</span>
              <span className="text-xl font-black text-gray-900">{stats.totalUnidades}</span>
            </div>
          </div>

          {/* ── PANEL 3: POR GRADO ── */}
          {stats.byGrade.length > 0 && (
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-gray-900">Ventas por Grado</h3>
                <span className="ml-auto text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                  {stats.byGrade.length} grados
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
                {stats.byGrade.map(g => (
                  <div key={`${g.grade}-${g.section}`}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-black text-xs shadow-sm">
                        {g.grade.replace(/[^0-9]/g, '') || g.grade.charAt(0)}
                      </span>
                      <span className="font-bold text-gray-800 text-sm leading-tight">
                        {g.grade} &quot;{g.section}&quot;
                      </span>
                    </div>
                    <p className="text-lg font-black text-blue-700">{fmt(g.total)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{g.count} pedido{g.count !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default LoncheritasDashboard;
