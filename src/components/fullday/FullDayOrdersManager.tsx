// ARCHIVO: src/components/fullday/FullDayOrdersManager.tsx
// ✅ CORREGIDO: Vista de tarjetas para móvil + botón "Cargar más"
// ============================================

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, Pencil, ChevronLeft, ChevronRight, FileSpreadsheet, Trash2, FileText, ChevronDown } from 'lucide-react';
import { useFullDayOrders } from '../../hooks/useFullDayOrders';
import { useFullDaySalesClosure } from '../../hooks/useFullDaySalesClosure';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { FullDayCashRegisterModal } from '../sales_fullday/FullDayCashRegisterModal';
import { FullDayDateFilter } from './FullDayDateFilter';
import { FullDayPaymentModal } from './FullDayPaymentModal';
import { PaymentFilter } from '../ui/PaymentFilter';
import { FullDayOrderPreview } from './FullDayOrderPreview';
import FullDayTicket from './FullDayTicket';
import { FullDayOrder, FullDayPaymentMethod, FullDaySplitPaymentDetails } from '../../types/fullday';
import { exportFullDayToExcel, exportFullDayByDateRange } from '../../utils/fulldayExportUtils';
import { generateFullDayTicketSummary, printFullDayResumenTicket } from '../../utils/fulldayTicketUtils';
import { generateFullDayReportPDF } from './FullDayReportPDF';
import { supabase } from '../../lib/supabase';

// ============================================
// HELPERS DE FECHA
// ============================================
const getTodayString = (): string => {
  const now = new Date();
  const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const year = peruDate.getFullYear();
  const month = String(peruDate.getMonth() + 1).padStart(2, '0');
  const day = String(peruDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createPeruDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

// ============================================
// MODAL DE RANGO DE FECHAS PARA EXCEL
// ============================================
interface ExcelRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  title?: string;
}

const ExcelRangeModal: React.FC<ExcelRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Reporte Excel por Rango de Fechas"
}) => {
  const [startDate, setStartDate] = useState<string>(getTodayString);
  const [endDate, setEndDate] = useState<string>(getTodayString);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateDates = (): boolean => {
    const start = createPeruDate(startDate);
    const end = createPeruDate(endDate);
    if (start > end) {
      setError('La fecha de inicio no puede ser mayor que la fecha de fin');
      return false;
    }
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 31) {
      setError('El rango máximo permitido es de 31 días');
      return false;
    }
    setError(null);
    return true;
  };

  const handleConfirm = () => {
    if (validateDates()) {
      onConfirm(createPeruDate(startDate), createPeruDate(endDate));
      onClose();
    }
  };

  const setToday = () => { const t = getTodayString(); setStartDate(t); setEndDate(t); };
  const setYesterday = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    peruDate.setDate(peruDate.getDate() - 1);
    const s = `${peruDate.getFullYear()}-${String(peruDate.getMonth() + 1).padStart(2, '0')}-${String(peruDate.getDate()).padStart(2, '0')}`;
    setStartDate(s); setEndDate(s);
  };
  const setThisWeek = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const monday = new Date(peruDate);
    const diff = peruDate.getDay() === 0 ? 6 : peruDate.getDay() - 1;
    monday.setDate(peruDate.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(monday)); setEndDate(fmt(sunday));
  };
  const setThisMonth = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const firstDay = new Date(peruDate.getFullYear(), peruDate.getMonth(), 1);
    const lastDay  = new Date(peruDate.getFullYear(), peruDate.getMonth() + 1, 0);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(firstDay)); setEndDate(fmt(lastDay));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet size={20} />
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <span className="text-white">✕</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Opciones rápidas:</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={setToday} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Hoy</button>
              <button onClick={setYesterday} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Ayer</button>
              <button onClick={setThisWeek} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Esta Semana</button>
              <button onClick={setThisMonth} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Este Mes</button>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio:</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setError(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de fin:</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setError(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="button" onClick={handleConfirm} className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold">Generar Excel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODAL DE RANGO DE FECHAS PARA PDF
// ============================================
interface PDFRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => Promise<void>;
  title?: string;
}

const PDFRangeModal: React.FC<PDFRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Reporte PDF por Rango de Fechas"
}) => {
  const [startDate, setStartDate] = useState<string>(getTodayString);
  const [endDate, setEndDate] = useState<string>(getTodayString);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateDates = (): boolean => {
    const start = createPeruDate(startDate);
    const end = createPeruDate(endDate);
    if (start > end) { setError('La fecha de inicio no puede ser mayor que la fecha de fin'); return false; }
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 31) { setError('El rango máximo permitido es de 31 días'); return false; }
    setError(null);
    return true;
  };

  const handleConfirm = async () => {
    if (validateDates()) { await onConfirm(createPeruDate(startDate), createPeruDate(endDate)); onClose(); }
  };

  const setToday = () => { const t = getTodayString(); setStartDate(t); setEndDate(t); };
  const setYesterday = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    peruDate.setDate(peruDate.getDate() - 1);
    const s = `${peruDate.getFullYear()}-${String(peruDate.getMonth() + 1).padStart(2, '0')}-${String(peruDate.getDate()).padStart(2, '0')}`;
    setStartDate(s); setEndDate(s);
  };
  const setThisWeek = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const monday = new Date(peruDate);
    const diff = peruDate.getDay() === 0 ? 6 : peruDate.getDay() - 1;
    monday.setDate(peruDate.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(monday)); setEndDate(fmt(sunday));
  };
  const setThisMonth = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const firstDay = new Date(peruDate.getFullYear(), peruDate.getMonth(), 1);
    const lastDay  = new Date(peruDate.getFullYear(), peruDate.getMonth() + 1, 0);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(firstDay)); setEndDate(fmt(lastDay));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText size={20} />
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><span className="text-white">✕</span></button>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Opciones rápidas:</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={setToday} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Hoy</button>
              <button onClick={setYesterday} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Ayer</button>
              <button onClick={setThisWeek} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Esta Semana</button>
              <button onClick={setThisMonth} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Este Mes</button>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio:</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setError(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de fin:</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setError(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="button" onClick={handleConfirm} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all font-semibold">Generar PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODAL DE RANGO DE FECHAS PARA TICKET
// ============================================
interface TicketRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  title?: string;
}

const TicketRangeModal: React.FC<TicketRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Ticket Resumen por Rango de Fechas"
}) => {
  const [startDate, setStartDate] = useState<string>(getTodayString);
  const [endDate, setEndDate] = useState<string>(getTodayString);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateDates = (): boolean => {
    const start = createPeruDate(startDate);
    const end = createPeruDate(endDate);
    if (start > end) { setError('La fecha de inicio no puede ser mayor que la fecha de fin'); return false; }
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 31) { setError('El rango máximo permitido es de 31 días'); return false; }
    setError(null);
    return true;
  };

  const handleConfirm = () => {
    if (validateDates()) { onConfirm(createPeruDate(startDate), createPeruDate(endDate)); onClose(); }
  };

  const setToday = () => { const t = getTodayString(); setStartDate(t); setEndDate(t); };
  const setYesterday = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    peruDate.setDate(peruDate.getDate() - 1);
    const s = `${peruDate.getFullYear()}-${String(peruDate.getMonth() + 1).padStart(2, '0')}-${String(peruDate.getDate()).padStart(2, '0')}`;
    setStartDate(s); setEndDate(s);
  };
  const setThisWeek = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const monday = new Date(peruDate);
    const diff = peruDate.getDay() === 0 ? 6 : peruDate.getDay() - 1;
    monday.setDate(peruDate.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(monday)); setEndDate(fmt(sunday));
  };
  const setThisMonth = () => {
    const now = new Date();
    const peruDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const firstDay = new Date(peruDate.getFullYear(), peruDate.getMonth(), 1);
    const lastDay  = new Date(peruDate.getFullYear(), peruDate.getMonth() + 1, 0);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(firstDay)); setEndDate(fmt(lastDay));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText size={20} />
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><span className="text-white">✕</span></button>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Opciones rápidas:</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={setToday} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Hoy</button>
              <button onClick={setYesterday} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Ayer</button>
              <button onClick={setThisWeek} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Esta Semana</button>
              <button onClick={setThisMonth} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">📅 Este Mes</button>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio:</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setError(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de fin:</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setError(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="button" onClick={handleConfirm} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all font-semibold">Generar Ticket</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE MEMOIZADO PARA CADA FILA (DESKTOP)
// ============================================
const FullDayOrderRow = React.memo(({
  order,
  onMouseEnter,
  onMouseLeave,
  onEditPayment,
  onDelete,
  getDisplayNumber,
  getPaymentColor,
  getPaymentText,
  isAdmin
}: {
  order: FullDayOrder;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onEditPayment: (order: FullDayOrder) => void;
  onDelete: (orderId: string, orderNumber: string) => void;
  getDisplayNumber: (order: FullDayOrder) => string;
  getPaymentColor: (method?: string | null) => string;
  getPaymentText: (method?: string | null) => string;
  isAdmin: boolean;
}) => {
  const displayNumber = getDisplayNumber(order);
  const actionsRef = useRef<HTMLDivElement>(null);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEditPayment(order);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(order.id, displayNumber);
  };

  const handleRowMouseEnter = (e: React.MouseEvent) => {
    if (actionsRef.current && actionsRef.current.contains(e.target as Node)) return;
    onMouseEnter(e);
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer group relative"
      onMouseEnter={handleRowMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-2 mb-1">
          <div className="text-sm font-medium text-purple-600">{displayNumber}</div>
        </div>
        <div className="font-medium text-gray-900">{order.student_name}</div>
        <div className="text-sm text-gray-600">{order.grade} - Sección {order.section}</div>
        <div className="text-sm font-bold text-purple-600 mt-1">S/ {order.total.toFixed(2)}</div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="mb-1">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 items-center space-x-1">
            <span>🎒</span><span>FullDay</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.payment_method)}`}>
            {getPaymentText(order.payment_method)}
          </span>
          <button
            onClick={handleEditClick}
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm border border-blue-300"
            title="Cambiar método de pago"
          >
            <Pencil size={14} />
          </button>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">{new Date(order.created_at).toLocaleDateString()}</div>
        <div className="text-sm text-gray-500">{new Date(order.created_at).toLocaleTimeString()}</div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">{order.items.length} producto(s)</div>
        <div className="text-xs text-gray-500 truncate max-w-xs">
          {order.items.map(item => item.name).join(', ')}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 text-sm font-medium" onMouseEnter={onMouseLeave}>
        <div ref={actionsRef} className="flex space-x-2">
          <FullDayTicket order={order} />
          {isAdmin && (
            <button
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar pedido"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ============================================
// ✅ NUEVO: TARJETA PARA MÓVIL
// ============================================
const FullDayOrderCard = React.memo(({
  order,
  onEditPayment,
  onDelete,
  onTapPreview,
  getDisplayNumber,
  getPaymentColor,
  getPaymentText,
  isAdmin
}: {
  order: FullDayOrder;
  onEditPayment: (order: FullDayOrder) => void;
  onDelete: (orderId: string, orderNumber: string) => void;
  onTapPreview: (order: FullDayOrder) => void;
  getDisplayNumber: (order: FullDayOrder) => string;
  getPaymentColor: (method?: string | null) => string;
  getPaymentText: (method?: string | null) => string;
  isAdmin: boolean;
}) => {
  const displayNumber = getDisplayNumber(order);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 active:bg-gray-50 transition-colors"
      onClick={() => onTapPreview(order)}
    >
      {/* Header de la tarjeta */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-purple-500 mb-0.5">{displayNumber}</div>
          <div className="font-semibold text-gray-900 truncate">{order.student_name}</div>
          <div className="text-sm text-gray-500">{order.grade} - Sección {order.section}</div>
        </div>
        <div className="text-right ml-3 flex-shrink-0">
          <div className="text-lg font-bold text-purple-600">S/ {order.total.toFixed(2)}</div>
          <div className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
        <span className="font-medium">{order.items.length} producto(s): </span>
        <span className="text-gray-500">{order.items.map(item => item.name).join(', ')}</span>
      </div>

      {/* Footer: pago + acciones */}
      <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.payment_method)}`}>
            {getPaymentText(order.payment_method)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEditPayment(order); }}
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-colors border border-blue-300"
            title="Cambiar método de pago"
          >
            <Pencil size={14} />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <FullDayTicket order={order} />
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(order.id, displayNumber); }}
              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar pedido"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────
export const FullDayOrdersManager: React.FC = () => {
  const { orders, loading, getTodayOrders, updateOrderPayment, deleteOrder } = useFullDayOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister, closures } = useFullDaySalesClosure();
  const { user } = useAuth();

  const [searchTerm,       setSearchTerm]       = useState('');
  const [paymentFilter,    setPaymentFilter]     = useState('');
  const [itemsPerPage,     setItemsPerPage]      = useState(20);
  const [currentSort,      setCurrentSort]       = useState('status-time');
  const [previewOrder,     setPreviewOrder]      = useState<FullDayOrder | null>(null);
  const [previewPosition,  setPreviewPosition]   = useState({ x: 0, y: 0 });
  const [showCashModal,    setShowCashModal]      = useState(false);
  const [cashModalType,    setCashModalType]      = useState<'open' | 'close'>('open');
  const [showPaymentModal, setShowPaymentModal]   = useState(false);
  const [selectedOrder,    setSelectedOrder]      = useState<FullDayOrder | null>(null);
  const [showExcelModal,   setShowExcelModal]     = useState(false);
  const [showPDFModal,     setShowPDFModal]       = useState(false);
  const [showTicketModal,  setShowTicketModal]    = useState(false);
  const [selectedDate,     setSelectedDate]       = useState<Date>(new Date());
  const [localOrders,      setLocalOrders]        = useState<FullDayOrder[]>([]);
  const [isInitialized,    setIsInitialized]      = useState(false);
  const [deletedOrder,     setDeletedOrder]       = useState<{id: string, number: string} | null>(null);
  const [exportingPDF,     setExportingPDF]       = useState(false);

  useEffect(() => {
    if (orders.length > 0 && !isInitialized) { setLocalOrders(orders); setIsInitialized(true); }
  }, [orders, isInitialized]);

  useEffect(() => {
    if (orders.length > 0) { setLocalOrders(orders); }
  }, [orders]);

  useEffect(() => {
    if (deletedOrder) {
      const timer = setTimeout(() => setDeletedOrder(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deletedOrder]);

  const todayTotal = useMemo(() =>
    getTodayOrders().reduce((sum, o) => sum + o.total, 0),
    [getTodayOrders]
  );

  const paymentTotals = useMemo(() => {
    const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
    const dayOrders  = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= startOfDay && d <= endOfDay;
    });

    let efectivo = 0;
    let yape     = 0;
    let tarjeta  = 0;

    dayOrders.forEach(o => {
      if (o.payment_method === 'MIXTO' && o.split_payment) {
        // Distribuir cada parte del pago mixto en su metodo real
        efectivo += o.split_payment.efectivo || 0;
        yape     += o.split_payment.yapePlin || 0;
        tarjeta  += o.split_payment.tarjeta  || 0;
      } else if (o.payment_method === 'EFECTIVO') {
        efectivo += o.total;
      } else if (o.payment_method === 'YAPE/PLIN') {
        yape += o.total;
      } else if (o.payment_method === 'TARJETA') {
        tarjeta += o.total;
      }
      // NO APLICA y null no suman a ningun metodo
    });

    // Total real = suma de todos los pedidos del dia (incluye NO APLICA y MIXTO completo)
    const totalGeneral = dayOrders.reduce((sum, o) => sum + o.total, 0);

    return { efectivo, yape, tarjeta, totalGeneral };
  }, [orders, selectedDate]);

  const dateFilteredOrders = useMemo(() => {
    const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
    return localOrders.filter(order => {
      const d = new Date(order.created_at);
      return d >= startOfDay && d <= endOfDay;
    });
  }, [localOrders, selectedDate]);

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = dateFilteredOrders;

    // ✅ FILTRO DE BÚSQUEDA — aplica siempre
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.student_name?.toLowerCase().includes(term) ||
        order.grade?.toLowerCase().includes(term) ||
        order.section?.toLowerCase().includes(term) ||
        order.order_number?.toLowerCase().includes(term) ||
        order.items?.some(item => item.name?.toLowerCase().includes(term))
      );
    }

    if (paymentFilter) {
      filtered = filtered.filter(order =>
        paymentFilter === 'NO_APLICA'
          ? !order.payment_method
          : order.payment_method === paymentFilter
      );
    }

    if (currentSort && currentSort !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        switch (currentSort) {
          case 'status-time': {
            const so: Record<string, number> = { pending: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 5 };
            if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status];
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          case 'waiting-time': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'total-desc':   return b.total - a.total;
          case 'created-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'created-asc':  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default: return 0;
        }
      });
    }
    return filtered;
  }, [dateFilteredOrders, searchTerm, paymentFilter, currentSort]);

  // ✅ usePagination — maneja desktop (páginas) y móvil (carga incremental) automáticamente
  const pagination = usePagination({ items: filteredAndSortedOrders, itemsPerPage, mobileBreakpoint: 768 });
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  // ✅ Resetear paginación cuando cambian los filtros
  useEffect(() => {
    pagination.resetPagination();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, paymentFilter, selectedDate, currentSort]);

  const handleRowMouseEnter = useCallback((order: FullDayOrder, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleRowMouseLeave = useCallback(() => setPreviewOrder(null), []);

  // ✅ NUEVO: tap en tarjeta móvil abre el preview como bottom-sheet
  const handleTapPreview = useCallback((order: FullDayOrder) => {
    setPreviewOrder(order);
    setPreviewPosition({ x: 0, y: 0 }); // posición no importa en móvil
  }, []);

  const handleDeleteOrder = useCallback(async (orderId: string, orderNumber: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el pedido ${orderNumber}?`)) {
      setLocalOrders(prev => prev.filter(o => o.id !== orderId));
      const result = await deleteOrder(orderId);
      if (result.success) {
        setDeletedOrder({ id: orderId, number: orderNumber });
      } else {
        alert('❌ Error al eliminar el pedido: ' + result.error);
        setLocalOrders(orders);
      }
    }
  }, [deleteOrder, orders]);

  const handleExportTodayExcel = useCallback(() => {
    exportFullDayToExcel(getTodayOrders(), 'today');
  }, [getTodayOrders]);

  const handleExportAllExcel = useCallback(() => {
    exportFullDayToExcel(orders, 'all');
  }, [orders]);

  const handleExcelRango = useCallback((startDate: Date, endDate: Date) => {
    exportFullDayByDateRange(orders, startDate, endDate);
  }, [orders]);

  const handlePDFRango = useCallback(async (startDate: Date, endDate: Date) => {
    if (exportingPDF) return;
    setExportingPDF(true);
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
    toast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generando PDF FullDay...</span></div>';
    document.body.appendChild(toast);
    try {
      await generateFullDayReportPDF(orders, startDate, endDate);
      const ok = document.createElement('div');
      ok.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
      ok.innerHTML = '<div>✅ PDF FullDay generado correctamente</div>';
      document.body.appendChild(ok);
      setTimeout(() => { if (document.body.contains(ok)) document.body.removeChild(ok); }, 3000);
    } catch (error: any) {
      const errToast = document.createElement('div');
      errToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errToast.innerHTML = `<div>❌ Error al generar PDF: ${error.message}</div>`;
      document.body.appendChild(errToast);
      setTimeout(() => { if (document.body.contains(errToast)) document.body.removeChild(errToast); }, 3000);
    } finally {
      if (document.body.contains(toast)) document.body.removeChild(toast);
      setExportingPDF(false);
    }
  }, [orders, exportingPDF]);

  const handleTicketResumen = useCallback((startDate: Date, endDate: Date) => {
    const s = new Date(startDate); s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);   e.setHours(23, 59, 59, 999);
    const filtered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= s && d <= e;
    });
    if (!filtered.length) { alert('No hay pedidos en el rango seleccionado'); return; }
    printFullDayResumenTicket(generateFullDayTicketSummary(filtered, s, e), startDate, endDate);
  }, [orders]);

  const handleOpenCash  = () => { setCashModalType('open');  setShowCashModal(true); };
  const handleCloseCash = () => { setCashModalType('close'); setShowCashModal(true); };

  const handleCashConfirm = async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const r = await openCashRegister(data.initialCash!);
      if (r.success) { alert('✅ Caja FullDay abierta correctamente'); setShowCashModal(false); }
      else alert('❌ ' + r.error);
    } else {
      const r = await closeCashRegister(data.finalCash!, data.notes || '');
      if (r.success) { alert('✅ Caja FullDay cerrada correctamente'); setShowCashModal(false); }
      else alert('❌ ' + r.error);
    }
  };

  const handleEditPayment = useCallback((order: FullDayOrder) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleSavePaymentMethod = useCallback(async (
    orderId: string,
    paymentMethod: FullDayPaymentMethod,
    splitDetails?: FullDaySplitPaymentDetails
  ) => {
    try {
      if (paymentMethod === 'MIXTO' && splitDetails) {
        const paymentResult = await updateOrderPayment(orderId, paymentMethod);
        if (paymentResult.success) {
          const { error } = await supabase
            .from('fullday')
            .update({ split_payment: splitDetails, updated_at: new Date().toISOString() })
            .eq('id', orderId);
          if (error) throw error;
        } else {
          alert('❌ Error al actualizar el método de pago: ' + paymentResult.error);
        }
      } else {
        const result = await updateOrderPayment(orderId, paymentMethod);
        if (result.success) {
          await supabase
            .from('fullday')
            .update({ split_payment: null, updated_at: new Date().toISOString() })
            .eq('id', orderId);
        } else {
          alert('❌ Error al actualizar: ' + result.error);
        }
      }
    } catch (error: any) {
      alert('❌ Error inesperado: ' + error.message);
    }
  }, [updateOrderPayment]);

  const handlePaymentUpdated = useCallback((
    orderId: string,
    newMethod: FullDayPaymentMethod,
    splitDetails?: FullDaySplitPaymentDetails
  ) => {
    setLocalOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updated = { ...order, payment_method: newMethod };
        updated.split_payment = (newMethod === 'MIXTO' && splitDetails) ? splitDetails : null;
        return updated;
      }
      return order;
    }));
  }, []);

  const getDisplayNumber = useCallback((order: FullDayOrder) =>
    order.order_number || `FD-${order.id.slice(-8).toUpperCase()}`, []);

  const getPaymentColor = useCallback((method?: string | null) => ({
    'EFECTIVO':  'bg-green-100 text-green-800 border-green-200',
    'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
    'TARJETA':   'bg-blue-100 text-blue-800 border-blue-200',
    'MIXTO':     'bg-orange-100 text-orange-800 border-orange-200',
  }[method || ''] || 'bg-gray-100 text-gray-800 border-gray-200'), []);

  const getPaymentText = useCallback((method?: string | null) => ({
    'EFECTIVO': 'EFECTIVO', 'YAPE/PLIN': 'YAPE/PLIN', 'TARJETA': 'TARJETA', 'MIXTO': 'MIXTO',
  }[method || ''] || 'NO APLICA'), []);

  const sortOptions = useMemo(() => [
    { value: 'status-time',  label: '🔄 Estado + Tiempo' },
    { value: 'waiting-time', label: '⏱️ Tiempo Espera' },
    { value: 'total-desc',   label: '💰 Mayor Monto' },
    { value: 'created-desc', label: '📅 Más Recientes' },
    { value: 'created-asc',  label: '📅 Más Antiguas' },
  ], []);

  const handleClearFilters = useCallback(() => { setPaymentFilter(''); setSearchTerm(''); }, []);
  const hasActiveFilters = paymentFilter !== '' || searchTerm !== '';
  const isAdmin = user?.role === 'admin';

  // ✅ Detectar si estamos en móvil para alternar vista
  const isMobileView = pagination.isMobile;

  return (
    <div className="space-y-4 sm:space-y-6">

      {deletedOrder && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full">
          <span>Pedido {deletedOrder.number} eliminado correctamente</span>
        </div>
      )}

      {previewOrder && (
        <FullDayOrderPreview
          order={previewOrder}
          isVisible={true}
          position={previewPosition}
          shouldIgnoreEvents={true}
          onClose={() => setPreviewOrder(null)}
        />
      )}

      <FullDayPaymentModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
        order={selectedOrder}
        onSave={handleSavePaymentMethod}
        onPaymentUpdated={handlePaymentUpdated}
      />

      <FullDayCashRegisterModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        type={cashModalType}
        cashRegister={cashRegister}
        orders={orders}
        onConfirm={handleCashConfirm}
        loading={salesLoading}
      />

      <ExcelRangeModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onConfirm={handleExcelRango}
        title="📊 Reporte Excel por Rango de Fechas - FullDay"
      />

      <PDFRangeModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        onConfirm={handlePDFRango}
        title="📑 Reporte PDF por Rango de Fechas - FullDay"
      />

      <TicketRangeModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onConfirm={handleTicketResumen}
        title="🎫 Ticket Resumen por Rango de Fechas - FullDay"
      />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🎒</span> Pedidos FullDay
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedOrders.length} pedidos · Total del día:{' '}
            <span className="font-semibold text-purple-600">S/ {todayTotal.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}</span>
          </div>
          {!cashRegister?.is_open ? (
            <button onClick={handleOpenCash} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">💰 Abrir Caja</button>
          ) : (
            <button onClick={handleCloseCash} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">🔒 Cerrar Caja</button>
          )}
        </div>
      </div>

      <FullDayDateFilter
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        totalOrders={filteredAndSortedOrders.length}
      />

      <div className="mb-4">
        <PaymentFilter
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          totalEfectivo={paymentTotals.efectivo}
          totalYape={paymentTotals.yape}
          totalTarjeta={paymentTotals.tarjeta}
          totalGeneral={paymentTotals.totalGeneral}
          showAmounts={true}
        />
      </div>

      {/* BOTONES DE REPORTES */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportTodayExcel}
          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center space-x-1"
        >
          <FileSpreadsheet size={16} />
          <span>Excel Hoy</span>
        </button>
        <button
          onClick={handleExportAllExcel}
          className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center space-x-1"
        >
          <FileSpreadsheet size={16} />
          <span>Excel Todo</span>
        </button>
        <button
          onClick={() => setShowExcelModal(true)}
          className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center space-x-1"
        >
          <FileSpreadsheet size={16} />
          <span>📊 Excel por Fechas</span>
        </button>
        <button
          onClick={() => setShowPDFModal(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:from-purple-700 hover:to-indigo-700 flex items-center space-x-1"
          disabled={exportingPDF}
        >
          <FileText size={16} />
          <span>📑 PDF por Fechas</span>
          {exportingPDF && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
        </button>
        <button
          onClick={() => setShowTicketModal(true)}
          className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 flex items-center space-x-1"
        >
          <FileText size={16} />
          <span>🎫 Ticket Resumen</span>
        </button>
      </div>

      {/* ── FILTROS DE BÚSQUEDA ── */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por alumno, grado, sección, producto..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {paymentFilter && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPaymentColor(paymentFilter)}`}>
                  {getPaymentText(paymentFilter)}
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  🔍 Búsqueda: "{searchTerm}"
                </span>
              )}
            </div>
            <button onClick={handleClearFilters} className="text-xs text-red-600 hover:text-red-800 font-medium">
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── CONTROLES DE ORDENAMIENTO Y PAGINACIÓN (DESKTOP) ── */}
      {!isMobileView && (
        <div className="bg-white/80 backdrop-blur-lg rounded-lg p-4 border border-gray-200 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.currentPage - 1) * itemsPerPage) + 1}–
              {Math.min(pagination.currentPage * itemsPerPage, filteredAndSortedOrders.length)} de{' '}
              <span className="font-semibold">{filteredAndSortedOrders.length}</span> pedidos
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-sm"
              >
                {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select
                value={currentSort}
                onChange={(e) => setCurrentSort(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="flex items-center space-x-1">
                <button
                  onClick={pagination.prevPage}
                  disabled={pagination.currentPage === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-sm">{pagination.currentPage} / {totalPages || 1}</span>
                <button
                  onClick={pagination.nextPage}
                  disabled={pagination.currentPage >= (totalPages || 1)}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDENAMIENTO MÓVIL ── */}
      {isMobileView && (
        <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border shadow-sm">
          <span className="text-xs text-gray-500 font-medium">
            {filteredAndSortedOrders.length} pedidos
          </span>
          <select
            value={currentSort}
            onChange={(e) => setCurrentSort(e.target.value)}
            className="text-xs border-0 bg-transparent text-gray-700 font-medium focus:ring-0 pr-6"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── CONTENIDO: TABLA (desktop) o TARJETAS (móvil) ── */}
      {loading && !isInitialized ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando...</p>
        </div>
      ) : pagination.currentItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
          {hasActiveFilters
            ? `No se encontraron pedidos con los filtros aplicados`
            : `No hay pedidos para el ${selectedDate.toLocaleDateString('es-PE')}`
          }
        </div>
      ) : isMobileView ? (
        /* ── VISTA MÓVIL: TARJETAS ── */
        <div className="space-y-3">
          {pagination.currentItems.map((order) => (
            <FullDayOrderCard
              key={order.id}
              order={order}
              onEditPayment={handleEditPayment}
              onDelete={handleDeleteOrder}
              onTapPreview={handleTapPreview}
              getDisplayNumber={getDisplayNumber}
              getPaymentColor={getPaymentColor}
              getPaymentText={getPaymentText}
              isAdmin={isAdmin}
            />
          ))}

          {/* Botón "Cargar más" para móvil */}
          {(pagination as any).hasMoreItems && (
            <button
              onClick={(pagination as any).loadMore}
              className="w-full py-3 bg-white border border-purple-300 text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-50 transition-colors flex items-center justify-center space-x-2"
            >
              <ChevronDown size={18} />
              <span>
                Cargar más ({(pagination as any).loadedItems} de {filteredAndSortedOrders.length})
              </span>
            </button>
          )}
        </div>
      ) : (
        /* ── VISTA DESKTOP: TABLA ── */
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumno / Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área / Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagination.currentItems.map((order) => (
                  <FullDayOrderRow
                    key={order.id}
                    order={order}
                    onMouseEnter={(e) => handleRowMouseEnter(order, e)}
                    onMouseLeave={handleRowMouseLeave}
                    onEditPayment={handleEditPayment}
                    onDelete={handleDeleteOrder}
                    getDisplayNumber={getDisplayNumber}
                    getPaymentColor={getPaymentColor}
                    getPaymentText={getPaymentText}
                    isAdmin={isAdmin}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredAndSortedOrders.length > 0 && (
        <div className="bg-white rounded-lg p-4 border text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">Total mostrado:</span>{' '}
              S/ {filteredAndSortedOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}
            </div>
            {exportingPDF && (
              <div className="text-xs text-purple-600 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                <span>Generando PDF, por favor espera...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {closures && closures.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Últimos cierres de caja</h3>
          <div className="space-y-2">
            {closures.slice(0, 5).map(c => (
              <div key={c.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2 text-sm">
                <span className="font-mono text-gray-600">{c.closure_number}</span>
                <span className="text-gray-500">{new Date(c.closed_at).toLocaleDateString('es-ES')}</span>
                <span className="font-semibold text-purple-600">S/ {c.final_cash?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
