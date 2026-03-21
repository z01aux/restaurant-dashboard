// ============================================
// ARCHIVO: src/components/dashboard/LoncheritasDashboard.tsx
// Dashboard Loncheritas — KPIs mejorados
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { LoncheritasOrder } from '../../types/loncheritas';
import { printLoncheritasA4, generateLoncheritasTicketSummary, printLoncheritasResumenTicket } from '../../utils/loncheritasTicketUtils';
import {
  ShoppingBag, Users, TrendingUp, RefreshCw,
  Calendar, CreditCard, Wallet, Smartphone,
  Star, Printer, Trophy, Package, Clock,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const fmt      = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtRound = (n: number) => `S/ ${Math.round(n).toLocaleString('es-PE')}`;

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
const HourlySparkline: React.FC<{ orders: LoncheritasOrder[] }> = ({ orders }) => {
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
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: '#10B981' }} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl" style={{ background: '#D1FAE5' }}>
            <Clock size={18} style={{ color: '#059669' }} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pedidos por hora</p>
            <p className="text-xs text-gray-400">
              {shown + 6}:00–{shown + 7}:00 ·{' '}
              <span className="font-semibold text-emerald-600">
                {hourly[shown]} pedido{hourly[shown] !== 1 ? 's' : ''}
              </span>
              {activeIdx === null && <span className="text-gray-300"> (pico)</span>}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>tendencia</span>
      </div>
      <div className="flex items-end gap-1 h-12">
        {hourly.map((count, i) => {
          const isActive = i === (activeIdx ?? peakIdx);
          const height   = Math.max((count / max) * 48, count > 0 ? 4 : 2);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center cursor-pointer"
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              title={`${i + 6}:00 — ${count} pedido${count !== 1 ? 's' : ''}`}
            >
              <div
                className="w-full rounded-sm transition-all duration-200"
                style={{
                  height: `${height}px`,
                  background: isActive ? '#10B981' : '#A7F3D0',
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

// ── Panel combinado ventas Loncheritas ────────────────────────────
const IncomePanelLoncheritas: React.FC<{ total: number; count: number }> = ({ total, count }) => {
  const ticket = count > 0 ? total / count : 0;
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-sm border border-white/20 relative overflow-hidden" style={{ gridColumn: 'span 2' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: '#10B981' }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl" style={{ background: '#D1FAE5' }}>
          <TrendingUp size={18} style={{ color: '#059669' }} />
        </div>
        <p className="text-xs text-gray-500 font-medium">Ventas Loncheritas</p>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>ventas</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Total del día</p>
          <p className="text-xl font-bold text-gray-900">{fmt(total)}</p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Ticket promedio</p>
          <p className="text-xl font-bold text-gray-900">{fmtRound(ticket)}</p>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────
const LoncheritasDashboard: React.FC = () => {
  const [orders,       setOrders]       = useState<LoncheritasOrder[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [lastUpdated,  setLastUpdated]  = useState<Date>(new Date());

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loncheritas').select('*')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setOrders((data || []).map((o: any) => ({
        ...o,
        items:      typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
        created_at: new Date(o.created_at),
        updated_at: new Date(o.updated_at),
      })) as LoncheritasOrder[]);
      setLastUpdated(new Date());
    } catch (e) { console.error('Error fetching Loncheritas orders:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [selectedDate]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalVentas = orders.reduce((s, o) => s + o.total, 0);
    const ticketProm  = totalOrders > 0 ? totalVentas / totalOrders : 0;
    const efectivo    = orders.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
    const yapePlin    = orders.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
    const tarjeta     = orders.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
    const noAplica    = orders.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);

    const prodMap: Record<string, { name: string; qty: number; total: number }> = {};
    orders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        const key = item.name.trim().toUpperCase();
        if (!prodMap[key]) prodMap[key] = { name: item.name.trim().toUpperCase(), qty: 0, total: 0 };
        prodMap[key].qty   += item.quantity;
        prodMap[key].total += (item.price || 0) * item.quantity;
      });
    });
    const topProducts   = Object.values(prodMap).sort((a, b) => b.qty - a.qty);
    const totalUnidades = topProducts.reduce((s, p) => s + p.qty, 0);
    const topProduct    = topProducts[0] ?? null;

    const gradeMap: Record<string, { grade: string; section: string; count: number; total: number }> = {};
    orders.forEach(o => {
      const key = `${o.grade}-${o.section}`;
      if (!gradeMap[key]) gradeMap[key] = { grade: o.grade, section: o.section, count: 0, total: 0 };
      gradeMap[key].count++;
      gradeMap[key].total += o.total;
    });
    const byGrade = Object.values(gradeMap).sort((a, b) =>
      a.grade !== b.grade ? a.grade.localeCompare(b.grade) : a.section.localeCompare(b.section)
    );

    return { totalOrders, totalVentas, ticketProm, efectivo, yapePlin, tarjeta, noAplica, topProducts, totalUnidades, topProduct, byGrade };
  }, [orders]);

  const isToday = selectedDate === todayStr();

  const handlePrintTicket = () => {
    if (orders.length === 0) return;
    const start = new Date(selectedDate + 'T00:00:00');
    const end   = new Date(selectedDate + 'T23:59:59');
    printLoncheritasResumenTicket(generateLoncheritasTicketSummary(orders), start, end);
  };
  const handlePrintA4 = () => {
    if (orders.length === 0) return;
    printLoncheritasA4({ orders, selectedDate });
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">Ventas Loncheritas</h2>
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
            <button onClick={handlePrintTicket} disabled={stats.topProducts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white text-sm font-semibold hover:from-gray-800 hover:to-gray-900 transition-all disabled:opacity-40">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Ticketera</span>
            </button>
            <button onClick={handlePrintA4} disabled={orders.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-40">
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
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando ventas...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-sm border border-white/20 text-center">
          <div className="text-5xl mb-3">🍱</div>
          <p className="text-gray-600 font-semibold">Sin ventas Loncheritas</p>
          <p className="text-gray-400 text-sm mt-1">{isToday ? 'Aún no hay pedidos para hoy.' : 'No hubo pedidos en esta fecha.'}</p>
        </div>
      ) : (
        <>
          {/* ── 3 KPIs ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <KpiCard
              label="Unidades vendidas"
              value={String(stats.totalUnidades)}
              sub={`${stats.topProducts.length} productos distintos`}
              icon={Package}
              iconBg="#D1FAE5" iconColor="#059669" accent="#10B981"
              barPct={Math.min((stats.totalUnidades / 200) * 100, 100)}
              tag="producción" tagBg="#D1FAE5" tagColor="#065F46"
            />
            <KpiCard
              label="Producto estrella"
              value={stats.topProduct ? stats.topProduct.name.split(' ').slice(0,3).join(' ') : '—'}
              sub={stats.topProduct
                ? `${stats.topProduct.qty} unidades · ${stats.totalUnidades > 0 ? ((stats.topProduct.qty/stats.totalUnidades)*100).toFixed(0) : 0}% del total`
                : 'sin datos'}
              icon={Trophy}
              iconBg="#FEF3C7" iconColor="#D97706" accent="#F59E0B"
              barPct={stats.topProduct && stats.totalUnidades > 0 ? (stats.topProduct.qty / stats.totalUnidades) * 100 : 0}
              tag="top ítem" tagBg="#FEF3C7" tagColor="#92400E"
            />
            <KpiCard
              label="Ticket promedio"
              value={fmtRound(stats.ticketProm)}
              sub={`de ${stats.totalOrders} pedido${stats.totalOrders !== 1 ? 's' : ''} hoy`}
              icon={TrendingUp}
              iconBg="#EDE9FE" iconColor="#7C3AED" accent="#8B5CF6"
              barPct={Math.min((stats.ticketProm / 30) * 100, 100)}
              tag="ventas" tagBg="#EDE9FE" tagColor="#5B21B6"
            />
          </div>

          {/* ── Sparkline + Panel ventas ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <HourlySparkline orders={orders} />
            <IncomePanelLoncheritas total={stats.totalVentas} count={stats.totalOrders} />
          </div>

          {/* ── Paneles métodos de pago + productos + grados ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Métodos de pago */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-gray-900">Métodos de Pago</h3>
                <span className="ml-auto text-xs font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                  {fmt(stats.totalVentas)}
                </span>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: '💵 Efectivo',  value: stats.efectivo,  icon: Wallet,     color: 'from-green-400 to-emerald-500',  badge: 'bg-green-50 text-green-700' },
                  { label: '📱 Yape/Plin', value: stats.yapePlin,  icon: Smartphone, color: 'from-purple-400 to-violet-500',  badge: 'bg-purple-50 text-purple-700' },
                  { label: '💳 Tarjeta',   value: stats.tarjeta,   icon: CreditCard, color: 'from-blue-400 to-indigo-500',    badge: 'bg-blue-50 text-blue-700' },
                  { label: '— No aplica',  value: stats.noAplica,  icon: TrendingUp, color: 'from-gray-400 to-gray-500',      badge: 'bg-gray-50 text-gray-600' },
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

            {/* Productos vendidos */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-gray-900">Productos vendidos</h3>
                <span className="ml-auto text-xs font-semibold bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                  {stats.topProducts.length} ítem{stats.topProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
                {stats.topProducts.map((p, i) => {
                  const pct = stats.totalUnidades > 0 ? (p.qty / stats.totalUnidades) * 100 : 0;
                  return (
                    <div key={p.name} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                      <span className="w-6 text-center text-xs font-black shrink-0"
                        style={{ color: i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#f97316':'#d1d5db' }}>
                        {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800 text-sm truncate pr-2">{p.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400">{fmt(p.total)}</span>
                            <span className="text-xl font-black text-emerald-600 leading-none">{p.qty}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700" style={{ width: `${pct}%` }} />
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

            {/* Ventas por grado */}
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
                          {g.section}
                        </span>
                        <span className="font-bold text-gray-800 text-xs leading-tight">{g.grade}</span>
                      </div>
                      <p className="text-lg font-black text-blue-700">{fmt(g.total)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{g.count} pedido{g.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default LoncheritasDashboard;
