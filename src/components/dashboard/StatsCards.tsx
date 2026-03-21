// ============================================
// ARCHIVO: src/components/dashboard/StatsCards.tsx
// Bloque 1 — Ingresos del día por canal (Órdenes, FullDay, Loncheritas, OEP)
// Bloque 4 — Comprobantes emitidos hoy
// Datos reales conectados a Supabase via hooks existentes
// ============================================

import React, { useMemo } from 'react';
import { ShoppingBag, BookOpen, Coffee, Package, Receipt, FileCheck } from 'lucide-react';
import { useOrders }            from '../../hooks/useOrders';
import { useFullDayOrders }     from '../../hooks/useFullDayOrders';
import { useLoncheritasOrders } from '../../hooks/useLoncheritasOrders';
import { useOEPOrders }         from '../../hooks/useOEPOrders';
import { useComprobantes }      from '../../hooks/useComprobantes';

// ── Helper fecha local ────────────────────────────────────────────

const isToday = (date: Date | string): boolean => {
  const d   = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
};

// ── Card individual ───────────────────────────────────────────────

interface StatCardProps {
  label:     string;
  value:     string;
  sub:       string;
  icon:      React.ElementType;
  iconBg:    string;
  iconColor: string;
  barColor:  string;
  barPct:    number;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label, value, sub, icon: Icon,
  iconBg, iconColor, barColor, barPct, highlight,
}) => (
  <div className={`bg-white/80 backdrop-blur-lg rounded-2xl p-4 lg:p-5 shadow-sm border ${highlight ? 'border-amber-200' : 'border-white/20'}`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>
      </div>
      <div className={`p-2.5 rounded-xl ml-3 flex-shrink-0`} style={{ background: iconBg }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(barPct, 100)}%`, background: barColor }}
      />
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────

const StatsCards: React.FC = () => {
  const { orders }                = useOrders();
  const { orders: fdOrders }      = useFullDayOrders();
  const { orders: lonOrders }     = useLoncheritasOrders();
  const { orders: oepOrders }     = useOEPOrders();
  const { comprobantes }          = useComprobantes();

  // ── Filtrar por hoy ───────────────────────────────────────────
  const ordToday = useMemo(() =>
    orders.filter(o => isToday(o.createdAt))
  , [orders]);

  const fdToday  = useMemo(() =>
    fdOrders.filter(o => isToday(o.created_at))
  , [fdOrders]);

  const lonToday = useMemo(() =>
    lonOrders.filter(o => isToday(o.created_at))
  , [lonOrders]);

  const oepToday = useMemo(() =>
    oepOrders.filter(o => isToday(o.created_at))
  , [oepOrders]);

  // ── Totales de ingresos ───────────────────────────────────────
  const ordTotal  = useMemo(() => ordToday.reduce((s, o) => s + o.total, 0),  [ordToday]);
  const fdTotal   = useMemo(() => fdToday.reduce((s, o) => s + o.total, 0),   [fdToday]);
  const lonTotal  = useMemo(() => lonToday.reduce((s, o) => s + o.total, 0),  [lonToday]);
  const oepTotal  = useMemo(() => oepToday.reduce((s, o) => s + o.total, 0),  [oepToday]);
  const grandTotal = ordTotal + fdTotal + lonTotal + oepTotal;

  // ── Comprobantes hoy ──────────────────────────────────────────
  const compHoy = useMemo(() =>
    comprobantes.filter(c => !c.anulado && isToday(c.created_at))
  , [comprobantes]);

  const totalPedidosHoy = ordToday.length + fdToday.length + lonToday.length + oepToday.length;
  const sinComprobante  = Math.max(0, totalPedidosHoy - compHoy.length);
  const pctCon          = totalPedidosHoy > 0 ? (compHoy.length / totalPedidosHoy) * 100 : 0;

  // ── Barra de progreso relativa al mayor canal ─────────────────
  const maxTotal = Math.max(ordTotal, fdTotal, lonTotal, oepTotal, 1);

  const fmt = (n: number) =>
    n === 0 ? 'S/ 0.00' : `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4 mb-6 sm:mb-8">

      {/* ── BLOQUE 1: Ingresos por canal ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Ingresos del día por canal
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Órdenes"
            value={fmt(ordTotal)}
            sub={`${ordToday.length} pedido${ordToday.length !== 1 ? 's' : ''} hoy`}
            icon={ShoppingBag}
            iconBg="#FEE2E2"
            iconColor="#DC2626"
            barColor="#DC2626"
            barPct={(ordTotal / maxTotal) * 100}
          />
          <StatCard
            label="FullDay"
            value={fmt(fdTotal)}
            sub={`${fdToday.length} pedido${fdToday.length !== 1 ? 's' : ''} hoy`}
            icon={BookOpen}
            iconBg="#EDE9FE"
            iconColor="#7C3AED"
            barColor="#7C3AED"
            barPct={(fdTotal / maxTotal) * 100}
          />
          <StatCard
            label="Loncheritas"
            value={fmt(lonTotal)}
            sub={`${lonToday.length} pedido${lonToday.length !== 1 ? 's' : ''} hoy`}
            icon={Coffee}
            iconBg="#D1FAE5"
            iconColor="#059669"
            barColor="#059669"
            barPct={(lonTotal / maxTotal) * 100}
          />
          <StatCard
            label="OEP"
            value={fmt(oepTotal)}
            sub={`${oepToday.length} pedido${oepToday.length !== 1 ? 's' : ''} hoy`}
            icon={Package}
            iconBg="#FEF3C7"
            iconColor="#D97706"
            barColor="#D97706"
            barPct={(oepTotal / maxTotal) * 100}
          />
        </div>

        {/* Total general */}
        <div className="mt-3 bg-white/60 rounded-xl px-4 py-3 border border-white/20 flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">Total general del día</span>
          <span className="text-lg font-bold text-gray-900">{fmt(grandTotal)}</span>
        </div>
      </div>

      {/* ── BLOQUE 4: Comprobantes ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Comprobantes electrónicos hoy
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            label="Emitidos hoy"
            value={String(compHoy.length)}
            sub={`de ${totalPedidosHoy} pedidos totales`}
            icon={FileCheck}
            iconBg="#D1FAE5"
            iconColor="#059669"
            barColor="#059669"
            barPct={pctCon}
          />
          <StatCard
            label="Sin comprobante"
            value={String(sinComprobante)}
            sub={`${(100 - pctCon).toFixed(0)}% sin CPE`}
            icon={Receipt}
            iconBg={sinComprobante > 0 ? '#FEF3C7' : '#D1FAE5'}
            iconColor={sinComprobante > 0 ? '#D97706' : '#059669'}
            barColor={sinComprobante > 0 ? '#D97706' : '#059669'}
            barPct={100 - pctCon}
            highlight={sinComprobante > 10}
          />
          <div className="col-span-2 lg:col-span-1 bg-white/80 backdrop-blur-lg rounded-2xl p-4 lg:p-5 shadow-sm border border-white/20">
            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-3">Desglose CPE</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Boletas</span>
                <span className="font-semibold text-gray-900">
                  {compHoy.filter(c => c.tipo_comprobante === 2).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Facturas</span>
                <span className="font-semibold text-gray-900">
                  {compHoy.filter(c => c.tipo_comprobante === 1).length}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                <span className="text-gray-600">Aceptadas SUNAT</span>
                <span className="font-semibold text-green-600">
                  {compHoy.filter(c => c.aceptada_por_sunat).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatsCards;
