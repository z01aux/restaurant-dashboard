// ============================================
// ARCHIVO: src/components/orders/OrderReception.tsx
// MEJORADO: Navegación móvil con Bottom Tab Bar nativa
//           Tab 1 → Cliente/Datos
//           Tab 2 → Menú
//           Tab 3 → Pedido/Carrito
// ============================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, Minus, X, ShoppingBag, Trash2, Edit2, Check, DollarSign,
  Settings, User, UtensilsCrossed, ChevronRight
} from 'lucide-react';
import { MenuItem, OrderItem, Order } from '../../types';
import { useMenu } from '../../hooks/useMenu';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { useStudents } from '../../hooks/useStudents';
import { useFullDay } from '../../hooks/useFullDay';
import { useCategories } from '../../hooks/useCategories';
import { useOEP } from '../../hooks/useOEP';
import { useLoncheritas } from '../../hooks/useLoncheritas';
import { GRADES, SECTIONS, Grade, Section } from '../../types/student';
import { SourceSelector } from './SourceSelector';
import { QuickMenuManager } from './QuickMenuManager';

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  .animate-slide-in { animation: slideIn 0.3s ease-out; }
    100% { transform: scale(1);   opacity: 1; }
  }

  .product-card {
    transition: all 0.2s ease-in-out;
    position: relative;
    overflow: hidden;
  }
  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,.1);
  }

  /* Categorías */
  .categories-container {
    background: white;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,.1);
    margin-bottom: 16px;
  }
  .categories-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .category-button {
    flex: 0 0 auto;
    padding: 8px 16px;
    border-radius: 30px;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }
  .category-button-active {
    background: linear-gradient(135deg, #ef4444, #f97316);
    color: white;
    box-shadow: 0 4px 6px -1px rgba(239,68,68,.3);
  }
  .category-button-inactive {
    background: #f3f4f6;
    color: #4b5563;
    border: 1px solid #e5e7eb;
  }
  .category-button-inactive:hover { background: #e5e7eb; transform: translateY(-1px); }
  @media (max-width: 640px) {
    .category-button { padding: 6px 12px; font-size: 0.75rem; }
  }

  /* ── MOBILE BOTTOM TAB BAR ─────────────────────────────────────── */
  .mobile-tab-bar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 64px;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(239,68,68,0.15);
    display: flex;
    z-index: 30;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  }
  .mobile-tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .mobile-tab-item:active { transform: scale(0.92); }
  .mobile-tab-icon {
    width: 26px; height: 26px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  .mobile-tab-item.active .mobile-tab-icon {
    background: linear-gradient(135deg, #ef4444, #f97316);
    color: white;
    box-shadow: 0 4px 10px rgba(239,68,68,0.35);
    transform: translateY(-2px);
  }
  .mobile-tab-label {
    font-size: 10px;
    font-weight: 600;
    color: #9ca3af;
    transition: color 0.2s;
    letter-spacing: 0.3px;
  }
  .mobile-tab-item.active .mobile-tab-label { color: #ef4444; }
  .mobile-tab-badge {
    position: absolute;
    top: 4px; right: calc(50% - 22px);
    background: #dc2626;
    color: white;
    border-radius: 9999px;
    min-width: 16px; height: 16px;
    font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid white;
    padding: 0 3px;
  }

  /* Animación de entrada de sección móvil */
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in { animation: fadeIn 0.2s ease-out; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mobile-section-enter { animation: fadeSlideUp 0.25s ease-out; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// GRADE BADGE (mismo diseño que StudentManager)
// ─────────────────────────────────────────────────────────────────────────────
const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  'RED ROOM':              { bg: 'bg-red-500',     text: 'text-white' },
  'YELLOW ROOM':           { bg: 'bg-yellow-400',  text: 'text-gray-800' },
  'GREEN ROOM':            { bg: 'bg-green-500',   text: 'text-white' },
  'PRIMERO DE PRIMARIA':   { bg: 'bg-blue-500',    text: 'text-white' },
  'SEGUNDO DE PRIMARIA':   { bg: 'bg-indigo-500',  text: 'text-white' },
  'TERCERO DE PRIMARIA':   { bg: 'bg-purple-500',  text: 'text-white' },
  'CUARTO DE PRIMARIA':    { bg: 'bg-pink-500',    text: 'text-white' },
  'QUINTO DE PRIMARIA':    { bg: 'bg-orange-500',  text: 'text-white' },
  'SEXTO DE PRIMARIA':     { bg: 'bg-amber-600',   text: 'text-white' },
  'PRIMERO DE SECUNDARIA': { bg: 'bg-cyan-500',    text: 'text-white' },
  'SEGUNDO DE SECUNDARIA': { bg: 'bg-teal-500',    text: 'text-white' },
  'TERCERO DE SECUNDARIA': { bg: 'bg-emerald-500', text: 'text-white' },
  'CUARTO DE SECUNDARIA':  { bg: 'bg-violet-500',  text: 'text-white' },
  'QUINTO DE SECUNDARIA':  { bg: 'bg-fuchsia-500', text: 'text-white' },
};

// Apellidos en bold: en Perú el formato es "APELLIDO1 APELLIDO2 Nombre(s)"
// Las primeras 2 palabras son apellidos → bold; el resto es el nombre → normal
const StudentName: React.FC<{ fullName: string }> = ({ fullName }) => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return <span className="font-bold">{fullName}</span>;
  const apellidos = parts.slice(0, 2).join(' ');
  const nombres   = parts.slice(2).join(' ');
  return (
    <span>
      <span className="font-bold">{apellidos}</span>
      {' '}
      <span className="font-normal">{nombres}</span>
    </span>
  );
};

const GradeBadge: React.FC<{ grade: string; section: string; size?: 'sm' | 'md' }> = ({ grade, section, size = 'md' }) => {
  const colors = GRADE_COLORS[grade] || { bg: 'bg-gray-500', text: 'text-white' };
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold shadow-sm ${colors.bg} ${colors.text} ${padding}`}>
      {grade} • {section}
    </span>
  );
};

const getCategoryBadge = (category: string): { label: string; color: string; bg: string } => {
  const c = category.toLowerCase();
  if (c.includes('loncheritas')) return { label: '🍱 Loncheritas', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' };
  if (c.includes('fullday'))    return { label: '🎒 FullDay',     color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' };
  if (c.includes('bebida') || c.includes('jugo') || c.includes('gaseosa'))
    return { label: '🥤 Bebida', color: 'text-blue-700',   bg: 'bg-blue-100 border-blue-200' };
  if (c.includes('entrada'))    return { label: '🍽️ Entrada',   color: 'text-green-700',  bg: 'bg-green-100 border-green-200' };
  if (c.includes('postre'))     return { label: '🍰 Postre',    color: 'text-pink-700',   bg: 'bg-pink-100 border-pink-200' };
  return { label: '🍽️ Plato', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200' };
};

const formatName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName;
  return `${parts[0]} ${parts.slice(1).join(' ')}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────

const ToastNotification: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}> = React.memo(({ message, type, onClose }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 1500);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`fixed top-4 right-4 ${bg} text-white px-4 py-2 rounded-lg shadow-lg z-[60] transform transition-all duration-300 ${
      visible ? 'animate-in slide-in-from-right-full opacity-100' : 'animate-out slide-out-to-right-full opacity-0'
    }`}>
      <div className="font-medium text-sm">{message}</div>
    </div>
  );
});

const CartItem: React.FC<{
  item: OrderItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onPriceChange: (itemId: string, newPrice: number) => void;
}> = React.memo(({ item, onUpdateQuantity, onRemove, onPriceChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrice, setTempPrice] = useState(item.menuItem.price.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [isEditing]);

  const handleStartEdit  = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setIsEditing(true); setTempPrice(item.menuItem.price.toString()); }, [item.menuItem.price]);
  const handleCancelEdit = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setIsEditing(false); setTempPrice(item.menuItem.price.toString()); }, [item.menuItem.price]);
  const handleSavePrice  = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const p = parseFloat(tempPrice);
    if (!isNaN(p) && p > 0) { onPriceChange(item.menuItem.id, p); setIsEditing(false); }
  }, [tempPrice, item.menuItem.id, onPriceChange]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { const p = parseFloat(tempPrice); if (!isNaN(p) && p > 0) { onPriceChange(item.menuItem.id, p); setIsEditing(false); } }
    else if (e.key === 'Escape') { setIsEditing(false); setTempPrice(item.menuItem.price.toString()); }
  }, [tempPrice, item.menuItem.id, item.menuItem.price, onPriceChange]);

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-2">
          <div className="font-medium text-gray-900 text-sm break-words flex items-center gap-2">
            {item.menuItem.name}
            <button onClick={handleStartEdit} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors" title="Editar precio">
              <Edit2 size={12} />
            </button>
          </div>
          <div className="mt-1">
            {isEditing ? (
              <div className="flex items-center space-x-1 bg-blue-50 p-1 rounded-lg border border-blue-200">
                <DollarSign size={14} className="text-blue-600" />
                <input ref={inputRef} type="number" step="0.01" min="0.01" value={tempPrice}
                  onChange={e => setTempPrice(e.target.value)} onKeyDown={handleKeyDown}
                  className="w-20 px-1 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Precio" onClick={e => e.stopPropagation()} />
                <button onClick={handleSavePrice} className="text-green-600 hover:text-green-800 p-1 hover:bg-green-100 rounded transition-colors"><Check size={14} /></button>
                <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded transition-colors"><X size={14} /></button>
              </div>
            ) : (
              <span className="text-gray-500 text-xs">S/ {item.menuItem.price.toFixed(2)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-1 py-1">
            <button onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors">
              <Minus size={12} />
            </button>
            <span className="w-6 text-center font-medium text-xs">{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors">
              <Plus size={12} />
            </button>
          </div>
          <button onClick={() => onRemove(item.menuItem.id)}
            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="text-right text-sm font-bold text-red-600 mt-1">
        S/ {(item.menuItem.price * item.quantity).toFixed(2)}
      </div>
    </div>
  );
});

const MenuProduct: React.FC<{
  item: MenuItem;
  quantityInCart: number;
  onAddToCart: (menuItem: MenuItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}> = React.memo(({ item, quantityInCart, onAddToCart, onUpdateQuantity }) => {
  const badge = getCategoryBadge(item.category);
  const handleAddClick  = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onAddToCart(item); }, [item, onAddToCart]);
  const handleDecrement = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onUpdateQuantity(item.id, quantityInCart - 1); }, [item.id, quantityInCart, onUpdateQuantity]);
  const handleIncrement = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onUpdateQuantity(item.id, quantityInCart + 1); }, [item.id, quantityInCart, onUpdateQuantity]);

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 product-card group">
      <div className="mb-2">
        <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 min-h-[2.5rem]">{item.name}</div>
        <div className="font-bold text-red-600 text-base">S/ {item.price.toFixed(2)}</div>
        <div className="mt-1.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>
      {quantityInCart > 0 ? (
        <div className="flex items-center justify-between space-x-1 mt-2">
          <button onClick={handleDecrement} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-bold text-red-600 text-sm">{quantityInCart}</span>
          <button onClick={handleIncrement} className="flex-1 py-2 bg-red-500 text-white rounded-lg flex items-center justify-center transition-all">
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <button onClick={handleAddClick}
          className="w-full mt-2 bg-red-500 text-white py-2 rounded-lg flex items-center justify-center space-x-1 text-sm font-medium hover:shadow-md transition-all">
          <Plus size={14} /><span>Agregar</span>
        </button>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const OrderReception: React.FC = React.memo(() => {

  // ── Estado del tipo de pedido ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'phone' | 'walk-in' | 'delivery' | 'fullDay' | 'oep' | 'loncheritas'>('phone');

  // ── Estado de datos del formulario ────────────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // ── Estado del carrito y UI ────────────────────────────────────────────────
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA'>('EFECTIVO');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showMenuManager, setShowMenuManager] = useState(false);

  // ── Tab móvil activa (NUEVA) ───────────────────────────────────────────────
  const [mobileTab, setMobileTabRaw] = useState<'client' | 'menu' | 'cart'>('client');
  const setMobileTab = useCallback((tab: 'client' | 'menu' | 'cart') => {
    setMobileTabRaw(tab);
    setTimeout(() => {
      if (tab === 'menu') menuTopRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      else if (tab === 'cart') cartTopRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }, 30);
  }, []);

  // ── Autocompletar clientes ─────────────────────────────────────────────────
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Datos de alumno (FullDay / Loncheritas) ────────────────────────────────
  const [selectedGrade, setSelectedGrade] = useState<Grade>(GRADES[0]);
  const [selectedSection, setSelectedSection] = useState<Section>(SECTIONS[0]);
  const [studentName, setStudentName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const studentSuggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const menuTopRef = useRef<HTMLDivElement>(null);
  const cartTopRef = useRef<HTMLDivElement>(null);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const { customers } = useCustomers();
  const { getDailySpecialsByCategory, getAllDailySpecials, refreshMenu } = useMenu();
  const { categories: dbCategories, refreshCategories } = useCategories();
  const { createOrder } = useOrders();
  const { createOrder: createFullDayOrder } = useFullDay();
  const { createOrder: createOEPOrder } = useOEP();
  const { createOrder: createLoncheritasOrder } = useLoncheritas();
  const { searchStudents, searchResults } = useStudents();

  const isAdmin = user?.role === 'admin';
  const categories = useMemo(() => dbCategories, [dbCategories]);

  // ── Efectos ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0]);
  }, [categories]);

  const allMenuItems = useMemo(() => getAllDailySpecials(), [getAllDailySpecials, showMenuManager]);

  const currentItems = useMemo(() => {
    if (searchTerm) {
      return allMenuItems.filter((item: MenuItem) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return getDailySpecialsByCategory(activeCategory) || [];
  }, [allMenuItems, searchTerm, activeCategory, getDailySpecialsByCategory]);

  useEffect(() => {
    if (customerSearchTerm.trim().length > 1 && activeTab !== 'fullDay') {
      const lower = customerSearchTerm.toLowerCase();
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(lower) || c.phone.includes(customerSearchTerm)
      ).slice(0, 5);
      setCustomerSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  }, [customerSearchTerm, customers, activeTab]);

  useEffect(() => {
    if (studentSearchTerm.trim().length > 1 && (activeTab === 'fullDay' || activeTab === 'loncheritas')) {
      searchStudents(studentSearchTerm);
    } else {
      setStudentSearchResults([]);
      setShowStudentSuggestions(false);
    }
  }, [studentSearchTerm, activeTab, searchStudents]);

  useEffect(() => {
    setStudentSearchResults(searchResults);
    setShowStudentSuggestions(searchResults.length > 0);
  }, [searchResults]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Callbacks básicos ─────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const selectCustomer = useCallback((customer: any) => {
    setCustomerName(customer.name);
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setCustomerSearchTerm('');
    setShowSuggestions(false);
    showToast('Cliente seleccionado', 'success');
  }, [showToast]);

  const selectStudent = useCallback((student: any) => {
    setStudentName(student.full_name);
    setSelectedGrade(student.grade as Grade);
    setSelectedSection(student.section as Section);
    setGuardianName(student.guardian_name);
    setPhone(student.phone || '');
    setSelectedStudentId(student.id);
    setStudentSearchTerm('');
    setShowStudentSuggestions(false);
    setStudentSearchResults([]);
    showToast('Alumno seleccionado', 'success');
  }, [showToast]);

  const handleCustomerSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCustomerSearchTerm(v);
    setCustomerName(v);
  }, []);

  const handleStudentSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setStudentSearchTerm(v);
    setStudentName(v);
  }, []);

  // ── Callbacks del carrito ─────────────────────────────────────────────────
  const addToCart = useCallback((menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === menuItem.id);
      if (existing) {
        showToast(`${menuItem.name} +1`, 'success');
        return prev.map(i => i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1, menuItem } : i);
      }
      showToast(`${menuItem.name} añadido`, 'success');
      return [...prev, { menuItem, quantity: 1, notes: '' }];
    });
  }, [showToast]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => {
      const item = prev.find(i => i.menuItem.id === itemId);
      if (item) showToast(`${item.menuItem.name} eliminado`, 'info');
      return prev.filter(i => i.menuItem.id !== itemId);
    });
  }, [showToast]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity === 0) { removeFromCart(itemId); return; }
    setCart(prev => prev.map(i => i.menuItem.id === itemId ? { ...i, quantity } : i));
  }, [removeFromCart]);

  const handlePriceChange = useCallback((itemId: string, newPrice: number) => {
    setCart(prev => prev.map(i => i.menuItem.id === itemId ? { ...i, menuItem: { ...i.menuItem, price: newPrice } } : i));
    showToast('Precio actualizado', 'info');
  }, [showToast]);

  const getTotal = useCallback(() => cart.reduce((t, i) => t + (i.menuItem.price * i.quantity), 0), [cart]);

  const totalItems = useMemo(() => cart.reduce((t, i) => t + i.quantity, 0), [cart]);

  const clearCart = useCallback(() => {
    if (cart.length > 0) setShowClearCartModal(true);
  }, [cart.length]);

  const confirmClearCart = useCallback(() => {
    setCart([]);
    setShowClearCartModal(false);
    showToast('Carrito vaciado', 'info');
  }, [showToast]);

  const handleCategoryChange = useCallback((cat: string) => setActiveCategory(cat), []);
  const handleSearchChange   = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value), []);
  const handlePaymentMethodChange = useCallback((m: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA') => setPaymentMethod(m), []);

  // ── Valores derivados ─────────────────────────────────────────────────────
  const isFormValid = useMemo(() => {
    if (cart.length === 0) return false;
    if (activeTab === 'fullDay' || activeTab === 'loncheritas') return !!(studentName && guardianName);
    if (activeTab === 'walk-in') return !!(customerName && phone && tableNumber);
    if (activeTab === 'delivery') return !!(customerName && phone && address);
    if (activeTab === 'oep') return !!(customerName && phone);
    return !!(customerName && phone);
  }, [cart, activeTab, customerName, phone, tableNumber, address, studentName, guardianName]);

  const shouldShowPayment = useMemo(() =>
    activeTab === 'walk-in' || activeTab === 'delivery' || activeTab === 'fullDay' || activeTab === 'oep' || activeTab === 'loncheritas',
  [activeTab]);

  // ── Impresión ─────────────────────────────────────────────────────────────
  const printOrderImmediately = useCallback((order: Order) => {
    const isPhoneOrder = order.source.type === 'phone';
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const getCurrentUserName = () => {
      try {
        const saved = localStorage.getItem('restaurant-user');
        if (saved) return JSON.parse(saved).name || 'Sistema';
      } catch {}
      return 'Sistema';
    };

    const generateTicketContent = (order: Order, isKitchenTicket: boolean) => {
      if (isKitchenTicket) {
        return `<div class="ticket">
          <div class="center">
            <div class="header-title uppercase" style="font-size:16px;margin-bottom:5px;">${order.customerName.toUpperCase()}</div>
            <div class="header-title">** COCINA **</div>
            <div class="divider"></div>
          </div>
          <div class="info-row"><span class="label">CLIENTE:</span><span class="customer-name-bold">${order.customerName.toUpperCase()}</span></div>
          <div class="info-row"><span class="label">AREA:</span><span class="value">COCINA</span></div>
          <div class="info-row"><span class="label">COMANDA:</span><span class="value">#${order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`}</span></div>
          <div class="info-row"><span class="label">FECHA:</span><span class="value">${order.createdAt.toLocaleDateString('es-ES')} - ${order.createdAt.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span></div>
          <div class="info-row"><span class="label">ATENDIDO POR:</span><span class="value">${getCurrentUserName().toUpperCase()}</span></div>
          <div class="divider"></div>
          <div class="products-header">DESCRIPCIÓN</div>
          <div class="divider"></div>
          ${order.items.map(item => `
            <div class="product-row"><div class="quantity">${item.quantity}X</div><div class="product-name bold">${item.menuItem.name.toUpperCase()}</div></div>
            ${item.notes?.trim() ? `<div class="notes">NOTA: ${item.notes.toUpperCase()}</div>` : ''}
          `).join('')}
          <div class="divider"></div>
          ${order.notes?.trim() ? `<div class="info-row"><span class="label">NOTAS DEL PEDIDO:</span></div><div class="notes">${order.notes.toUpperCase().trim().split('\n').map(l=>`- ${l.trim()}`).join('\n')}</div><div class="divider"></div>` : ''}
          <div class="center"><div class="asterisk-line">********************************</div></div>
        </div>`;
      }

      let customerInfo = '';
      if ((order.source.type === 'fullDay' || order.source.type === 'loncheritas') && order.studentInfo) {
        const sn = formatName(order.studentInfo.fullName);
        const gn = formatName(order.studentInfo.guardianName);
        customerInfo = `
          <div class="info-row"><span class="label">ALUMNO:</span><span class="customer-name-bold">${sn.toUpperCase()}</span></div>
          <div class="info-row"><span class="label">GRADO:</span><span class="value">${order.studentInfo.grade} "${order.studentInfo.section}"</span></div>
          <div class="info-row"><span class="label">APODERADO:</span><span class="value">${gn.toUpperCase()}</span></div>
          ${order.phone ? `<div class="info-row"><span class="label">TELÉFONO:</span><span class="value">${order.phone}</span></div>` : ''}
        `;
      } else {
        customerInfo = `
          <div class="info-row"><span class="label">CLIENTE:</span><span class="customer-name-bold">${order.customerName.toUpperCase()}</span></div>
          <div class="info-row"><span class="label">TELÉFONO:</span><span class="value">${order.phone}</span></div>
        `;
      }

      return `<div class="ticket">
        <div class="center">
          <div class="header-title" style="font-size:14px;">MARY'S RESTAURANT</div>
          <div class="header-subtitle">INVERSIONES AROMO S.A.C.</div>
          <div class="header-subtitle">RUC: 20505262086</div>
          <div class="header-subtitle">AV. ISABEL LA CATOLICA 1254</div>
          <div class="header-subtitle">Tel: 941 778 599</div>
          <div class="divider"></div>
        </div>
        <div class="info-row"><span class="label">ORDEN:</span><span class="value">${order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`}</span></div>
        <div class="info-row"><span class="label">TIPO:</span><span class="value">${order.source.type==='phone'?'COCINA':order.source.type==='walk-in'?'LOCAL':order.source.type==='delivery'?'DELIVERY':order.source.type==='fullDay'?'FULLDAY':order.source.type==='loncheritas'?'LONCHERITAS':'OEP'}</span></div>
        <div class="info-row"><span class="label">FECHA:</span><span class="value">${order.createdAt.toLocaleDateString()}</span></div>
        <div class="info-row"><span class="label">HORA:</span><span class="value">${order.createdAt.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span></div>
        <div class="info-row"><span class="label">PAGO:</span><span class="value">${order.paymentMethod||'NO APLICA'}</span></div>
        <div class="divider"></div>
        ${customerInfo}
        ${order.address ? `<div class="info-row"><span class="label">DIRECCIÓN:</span><span class="value" style="max-width:60%;word-wrap:break-word;">${order.address.toUpperCase()}</span></div>` : ''}
        ${order.tableNumber ? `<div class="info-row"><span class="label">MESA:</span><span class="value">${order.tableNumber}</span></div>` : ''}
        <div class="divider"></div>
        <table><thead><tr><th>CANT</th><th>DESCRIPCIÓN</th><th style="text-align:right;">PRECIO</th></tr></thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td class="quantity" style="vertical-align:top;">${item.quantity}X</td>
              <td style="vertical-align:top;">
                <div class="product-name bold">${item.menuItem.name.toUpperCase()}</div>
                ${item.notes?.trim() ? `<div class="table-notes">NOTA: ${item.notes.toUpperCase()}</div>` : ''}
              </td>
              <td style="text-align:right;vertical-align:top;">S/ ${(item.menuItem.price*item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody></table>
        <div class="divider"></div>
        <div class="info-row" style="border-top:2px solid #000;padding-top:5px;margin-top:5px;"><span class="label">TOTAL:</span><span class="label">S/ ${order.total.toFixed(2)}</span></div>
        ${order.notes?.trim() ? `<div class="divider"></div><div class="info-row"><span class="label">NOTAS DEL PEDIDO:</span></div><div class="notes">${order.notes.toUpperCase().trim().split('\n').map(l=>`- ${l.trim()}`).join('\n')}</div>` : ''}
        <div class="divider"></div>
        <div class="center">
          <div class="header-title">¡GRACIAS POR SU PEDIDO!</div>
          <div class="normal">*** ${order.source.type==='phone'?'COCINA':order.source.type==='walk-in'?'LOCAL':order.source.type==='delivery'?'DELIVERY':order.source.type==='fullDay'?'FULLDAY':order.source.type==='loncheritas'?'LONCHERITAS':'OEP'} ***</div>
          <div class="normal" style="margin-top:10px;font-size:10px;">${new Date().toLocaleString('es-ES',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
        </div>
      </div>`;
    };

    const ticketContent = generateTicketContent(order, isPhoneOrder);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html><html><head>
        <title>Ticket</title>
        <style>
          @media print { @page{size:80mm auto;margin:0;padding:0;} body{width:80mm!important;margin:0 auto!important;} }
          body{font-family:"Courier New",monospace;font-weight:bold;font-size:12px;line-height:1.2;width:80mm;margin:0 auto;padding:0;background:white;color:black;box-sizing:border-box;}
          *{box-sizing:border-box;}
          .ticket{padding:8px;width:100%;}
          .center{text-align:center;}
          .bold{font-weight:bold!important;}
          .normal{font-weight:bold!important;}
          .divider{border-top:1px solid #000;margin:6px 0;}
          .info-row{display:flex;justify-content:space-between;margin-bottom:3px;}
          .label,.value,.customer-name-bold,.header-title,.header-subtitle{font-weight:bold!important;}
          .customer-name-bold{max-width:70%;word-wrap:break-word;}
          .notes{font-size:12px;margin-bottom:3px;display:block;width:100%;font-weight:bold!important;white-space:pre-wrap;word-wrap:break-word;}
          .table-notes{font-size:10px;margin-top:2px;display:block;font-weight:bold!important;}
          .products-header{text-align:center;font-weight:bold!important;margin:6px 0;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:3px;}
          .product-row{display:flex;margin-bottom:4px;}
          .quantity{width:15%;font-weight:bold!important;}
          .product-name{width:85%;font-weight:bold!important;text-transform:uppercase;}
          .asterisk-line{text-align:center;font-size:9px;letter-spacing:1px;margin:3px 0;font-weight:bold!important;}
          table{width:100%;border-collapse:collapse;margin:5px 0;}
          th,td{padding:2px 0;text-align:left;vertical-align:top;}
          th{border-bottom:1px solid #000;font-weight:bold!important;}
        </style>
      </head><body>${ticketContent}</body></html>`);
      iframeDoc.close();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
      }, 50);
    }
  }, []);

  // ── Crear orden ───────────────────────────────────────────────────────────
  const handleCreateOrder = useCallback(async () => {
    if (cart.length === 0) { showToast('El pedido está vacío', 'error'); return; }
    if ((activeTab === 'fullDay' || activeTab === 'loncheritas') && (!studentName || !guardianName)) {
      showToast('Completa los datos del alumno', 'error'); return;
    }
    if (activeTab !== 'phone' && activeTab !== 'fullDay' && activeTab !== 'loncheritas' && (!customerName || !phone)) {
      showToast('Completa los datos del cliente', 'error'); return;
    }
    if (activeTab === 'walk-in' && !tableNumber) { showToast('Ingresa el número de mesa', 'error'); return; }
    if (shouldShowPayment && !paymentMethod) { showToast('Selecciona un método de pago', 'error'); return; }
    if (isCreatingOrder) return;

    setIsCreatingOrder(true);
    try {
      const total = getTotal();

      if (activeTab === 'fullDay') {
        const result = await createFullDayOrder({
          student_id: selectedStudentId, student_name: studentName,
          grade: selectedGrade, section: selectedSection, guardian_name: guardianName,
          phone: phone || undefined,
          items: cart.map(i => ({ menuItem: { id: i.menuItem.id, name: i.menuItem.name, price: i.menuItem.price }, quantity: i.quantity, notes: i.notes })),
          payment_method: paymentMethod, notes: orderNotes, created_by_id: user?.id, created_by_name: user?.name,
        });
        if (result.success && result.data) {
          showToast('✅ Pedido FullDay guardado', 'success');
          printOrderImmediately({ id: result.data.id, orderNumber: result.data.order_number, items: cart, status: 'pending', createdAt: new Date(result.data.created_at), total, customerName: studentName, phone: phone || 'Sin teléfono', source: { type: 'fullDay' }, notes: orderNotes, paymentMethod, studentInfo: { fullName: studentName, grade: selectedGrade, section: selectedSection, guardianName, phone }, orderType: 'fullday' });
        } else showToast('❌ Error al guardar: ' + result.error, 'error');
      }
      else if (activeTab === 'loncheritas') {
        const result = await createLoncheritasOrder({
          student_id: selectedStudentId, student_name: studentName,
          grade: selectedGrade, section: selectedSection, guardian_name: guardianName,
          phone: phone || undefined,
          items: cart.map(i => ({ menuItem: { id: i.menuItem.id, name: i.menuItem.name, price: i.menuItem.price }, quantity: i.quantity, notes: i.notes })),
          payment_method: paymentMethod, notes: orderNotes, created_by_id: user?.id, created_by_name: user?.name,
        });
        if (result.success && result.data) {
          showToast('✅ Pedido Loncheritas guardado', 'success');
          printOrderImmediately({ id: result.data.id, orderNumber: result.data.order_number, items: cart, status: 'pending', createdAt: new Date(result.data.created_at), total, customerName: studentName, phone: phone || 'Sin teléfono', source: { type: 'loncheritas' }, notes: orderNotes, paymentMethod, studentInfo: { fullName: studentName, grade: selectedGrade, section: selectedSection, guardianName, phone }, orderType: 'fullday' });
        } else showToast('❌ Error al guardar: ' + result.error, 'error');
      }
      else if (activeTab === 'oep') {
        const result = await createOEPOrder({
          customer_name: customerName, phone, address: address || undefined,
          items: cart.map(i => ({ menuItem: { id: i.menuItem.id, name: i.menuItem.name, price: i.menuItem.price }, quantity: i.quantity, notes: i.notes })),
          payment_method: paymentMethod, notes: orderNotes, created_by_id: user?.id, created_by_name: user?.name,
        });
        if (result.success && result.data) {
          showToast('✅ Pedido OEP guardado', 'success');
          printOrderImmediately({ id: result.data.id, orderNumber: result.data.order_number, kitchenNumber: `COM-${result.data.id.slice(-8).toUpperCase()}`, items: cart, status: 'pending', createdAt: new Date(result.data.created_at), total, customerName, phone, address, source: { type: 'oep' }, notes: orderNotes, paymentMethod, orderType: 'regular' });
        } else showToast('❌ Error al guardar: ' + result.error, 'error');
      }
      else {
        const orderData: any = {
          customerName, phone,
          address: activeTab === 'delivery' ? address : undefined,
          tableNumber: activeTab === 'walk-in' ? tableNumber : undefined,
          source: { type: activeTab, ...(activeTab === 'delivery' && { deliveryAddress: address }) },
          notes: orderNotes,
          paymentMethod: activeTab !== 'phone' ? paymentMethod : undefined,
          items: cart.map(i => ({ menuItem: { id: i.menuItem.id, name: i.menuItem.name, price: i.menuItem.price }, quantity: i.quantity, notes: i.notes })),
          orderType: 'regular', createdById: user?.id, createdByName: user?.name,
        };
        const result = await createOrder(orderData);
        if (result.success && result.order) {
          showToast('✅ Orden guardada', 'success');
          printOrderImmediately({ id: result.order.id, orderNumber: result.order.order_number, kitchenNumber: result.order.kitchen_number, items: cart, status: 'pending', createdAt: new Date(result.order.created_at), total, customerName, phone, address, tableNumber, source: orderData.source, notes: orderNotes, paymentMethod: orderData.paymentMethod, orderType: 'regular' });
        } else showToast('❌ Error al guardar: ' + result.error, 'error');
      }

      // Reset
      setCart([]); setCustomerName(''); setPhone(''); setAddress(''); setTableNumber('');
      setOrderNotes(''); setCustomerSearchTerm(''); setStudentName(''); setGuardianName('');
      setStudentSearchTerm(''); setSelectedStudentId(null);
      setMobileTab('client'); // volver al inicio tras confirmar

    } catch (error: any) {
      showToast('❌ Error: ' + error.message, 'error');
    } finally {
      setIsCreatingOrder(false);
    }
  }, [
    cart, customerName, phone, activeTab, tableNumber, address, orderNotes,
    paymentMethod, createOrder, createFullDayOrder, createOEPOrder, createLoncheritasOrder,
    getTotal, showToast, printOrderImmediately, isCreatingOrder, shouldShowPayment,
    studentName, guardianName, selectedGrade, selectedSection, selectedStudentId,
  ]);

  // ── Sección de formulario de cliente (reutilizada en móvil y desktop) ─────
  const renderClientForm = (compact = false) => (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {(activeTab === 'fullDay' || activeTab === 'loncheritas') ? (
        <>
          {/* Buscador */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar alumno</label>
            <input
              type="text"
              value={studentSearchTerm}
              onChange={handleStudentSearchChange}
              onBlur={() => setTimeout(() => setShowStudentSuggestions(false), 150)}
              onFocus={() => { if (studentSearchResults.length > 0) setShowStudentSuggestions(true); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Buscar por nombre..."
            />
            {showStudentSuggestions && studentSearchResults.length > 0 && (
              <div
                ref={studentSuggestionsRef}
                onMouseDown={e => e.preventDefault()}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {studentSearchResults.map(s => (
                  <div
                    key={s.id}
                    onMouseDown={() => selectStudent(s)}
                    className="px-3 py-2.5 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <p className="text-sm text-gray-900"><StudentName fullName={s.full_name} /></p>
                    <div className="my-1">
                      <GradeBadge grade={s.grade} section={s.section} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500">{s.guardian_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Campo Alumno → Badge → Apoderado */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            {/* Nombre alumno */}
            <div className="px-3 py-2 border-b border-gray-200">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Alumno</p>
              <p className="text-sm font-medium text-gray-800 min-h-[20px]">
                {studentName || <span className="text-gray-400 font-normal">—</span>}
              </p>
            </div>
            {/* Badge grado/sección */}
            <div className="px-3 py-2 border-b border-gray-200 bg-white">
              {selectedStudentId && selectedGrade && selectedSection
                ? <GradeBadge grade={selectedGrade} section={selectedSection} />
                : <span className="text-xs text-gray-400">Sin grado asignado</span>
              }
            </div>
            {/* Apoderado editable */}
            <div className="px-3 py-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Apoderado</p>
              <input
                type="text"
                value={guardianName}
                onChange={e => setGuardianName(e.target.value)}
                className="w-full text-sm text-gray-800 bg-transparent border-none outline-none placeholder-gray-400"
                placeholder="Nombre del apoderado *"
              />
            </div>
          </div>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Teléfono (opcional)" />
        </>
      ) : (
        <>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar cliente</label>
            <input ref={inputRef} type="text" value={customerSearchTerm} onChange={handleCustomerSearchChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Nombre o teléfono..." />
            {showSuggestions && customerSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customerSuggestions.map(c => (
                  <div key={c.id} onMouseDown={() => selectCustomer(c)} className="p-3 hover:bg-red-50 cursor-pointer border-b border-gray-100">
                    <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                    <div className="text-gray-500 text-xs">📞 {c.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
            placeholder="Nombre del cliente" readOnly />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Teléfono *" />
          {activeTab === 'walk-in' && (
            <input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Número de mesa *" />
          )}
          {(activeTab === 'delivery' || activeTab === 'oep') && (
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Dirección (opcional)" />
          )}
        </>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas del pedido</label>
        <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          placeholder="Ej: SIN CEBOLLA, BIEN COCIDO..." />
      </div>
    </div>
  );

  // ── Sección de menú (reutilizada) ─────────────────────────────────────────
  const renderMenu = (cols: 2 | 3 = 2) => (
    <>
      <input type="text" value={searchTerm} onChange={handleSearchChange}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
        placeholder="Buscar productos..." />
      {!searchTerm && categories.length > 0 && (
        <div className="categories-container">
          <div className="categories-grid">
            {categories.map(cat => (
              <button key={cat} onClick={() => handleCategoryChange(cat)}
                className={`category-button ${activeCategory === cat ? 'category-button-active' : 'category-button-inactive'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={`grid grid-cols-${cols} gap-3`}>
        {currentItems.map((item: MenuItem) => {
          const qty = cart.find(c => c.menuItem.id === item.id)?.quantity ?? 0;
          return <MenuProduct key={item.id} item={item} quantityInCart={qty} onAddToCart={addToCart} onUpdateQuantity={updateQuantity} />;
        })}
      </div>
    </>
  );

  // ── Sección de métodos de pago ────────────────────────────────────────────
  const renderPaymentButtons = () => (
    <div className="grid grid-cols-3 gap-2">
      {(['EFECTIVO', 'YAPE/PLIN', 'TARJETA'] as const).map(m => {
        const active = paymentMethod === m;
        const colors = m === 'EFECTIVO' ? { base: 'bg-green-500', ring: 'ring-green-300', active: 'bg-green-600' }
          : m === 'YAPE/PLIN' ? { base: 'bg-purple-500', ring: 'ring-purple-300', active: 'bg-purple-600' }
          : { base: 'bg-blue-500', ring: 'ring-blue-300', active: 'bg-blue-600' };
        return (
          <button key={m} type="button" onClick={() => handlePaymentMethodChange(m)}
            className={`px-2 py-3 rounded-lg text-xs font-medium text-white transition-all ${active ? `${colors.active} ring-2 ${colors.ring} ring-offset-2` : `${colors.base} hover:opacity-90`}`}>
            {m}
          </button>
        );
      })}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 pb-20 lg:pb-6">

        {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <QuickMenuManager
          isOpen={showMenuManager}
          onClose={() => setShowMenuManager(false)}
          onRefresh={() => { refreshMenu(); refreshCategories(); }}
        />

        {/* ── Modal confirmar vaciar carrito ─────────────────────── */}
        {showClearCartModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowClearCartModal(false)}
            />
            {/* Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center gap-4 animate-fade-in">
              {/* Icono */}
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={26} className="text-red-500" />
              </div>
              {/* Texto */}
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900 mb-1">¿Vaciar carrito?</h3>
                <p className="text-sm text-gray-500">Se eliminarán todos los productos del pedido actual.</p>
              </div>
              {/* Botones */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowClearCartModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={confirmClearCart}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                  Vaciar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">

          {/* ═══════════════════════════════════════════════════════════
              MÓVIL: Tab Bar + contenido por tab
          ═══════════════════════════════════════════════════════════ */}
          <div className="lg:hidden" ref={mobileScrollRef}>

            {/* Header compacto — solo muestra el total cuando hay items */}
            {totalItems > 0 && (
              <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-red-100 px-4 py-3 flex justify-end">
                <button onClick={() => setMobileTab('cart')}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <ShoppingBag size={14} />
                  <span>S/ {getTotal().toFixed(2)}</span>
                </button>
              </div>
            )}

            {/* ── TAB: CLIENTE ───────────────────────────────────────── */}
            {mobileTab === 'client' && (
              <div className="px-4 pt-4 pb-24 mobile-section-enter">
                {/* Selector de tipo de pedido */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tipo de pedido</p>
                  <SourceSelector value={activeTab} onChange={setActiveTab} layout="pill" />
                </div>

                {/* Formulario de datos */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {(activeTab === 'fullDay' || activeTab === 'loncheritas') ? 'Datos del alumno' : 'Datos del cliente'}
                  </p>
                  {renderClientForm(true)}
                </div>

                {/* Botón: ir al menú */}
                <button onClick={() => setMobileTab('menu')}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
                  <UtensilsCrossed size={18} />
                  <span>Ir al Menú</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* ── TAB: MENÚ ──────────────────────────────────────────── */}
            {mobileTab === 'menu' && (
              <div className="px-4 pt-4 pb-24 mobile-section-enter">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div ref={menuTopRef} className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Menú del Día</h3>
                    {isAdmin && (
                      <button onClick={() => setShowMenuManager(true)}
                        className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Settings size={12} /><span>Gestionar</span>
                      </button>
                    )}
                  </div>
                  {renderMenu(2)}
                </div>

                {/* Botón flotante ir al carrito cuando hay items */}
                {totalItems > 0 && (
                  <div className="fixed bottom-16 left-4 right-4 z-40">
                    <button onClick={() => setMobileTab('cart')}
                      className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold text-sm flex items-center justify-between px-5 shadow-2xl active:scale-[0.98] transition-all">
                      <span className="flex items-center gap-2">
                        <ShoppingBag size={18} />
                        <span>Ver Pedido ({totalItems} item{totalItems > 1 ? 's' : ''})</span>
                      </span>
                      <span className="font-bold text-base">S/ {getTotal().toFixed(2)}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: CARRITO / CONFIRMAR ───────────────────────────── */}
            {mobileTab === 'cart' && (
              <div className="px-4 pt-4 pb-24 mobile-section-enter">
                {cart.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
                    <ShoppingBag className="h-14 w-14 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-2">Tu pedido está vacío</p>
                    <button onClick={() => setMobileTab('menu')}
                      className="mt-4 text-sm text-red-500 font-semibold flex items-center gap-1 mx-auto">
                      <UtensilsCrossed size={14} /> Ver menú
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Resumen de datos */}
                    <div ref={cartTopRef} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {(activeTab === 'fullDay' || activeTab === 'loncheritas') ? 'Alumno' : 'Cliente'}
                        </p>
                        <button onClick={() => setMobileTab('client')} className="text-xs text-red-500 font-semibold">Editar</button>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {(activeTab === 'fullDay' || activeTab === 'loncheritas')
                          ? (studentName || <span className="text-red-400">Sin alumno</span>)
                          : (customerName || <span className="text-gray-400">Sin nombre (solo cocina)</span>)
                        }
                      </p>
                      {/* Badge de grado y sección para fullDay y loncheritas */}
                      {(activeTab === 'fullDay' || activeTab === 'loncheritas') && selectedStudentId && selectedGrade && selectedSection && (
                        <div className="mt-1.5">
                          <GradeBadge grade={selectedGrade} section={selectedSection} size="sm" />
                        </div>
                      )}
                      {phone && <p className="text-xs text-gray-500 mt-1">📞 {phone}</p>}
                    </div>

                    {/* Items del carrito */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Productos ({totalItems} item{totalItems > 1 ? 's' : ''})
                      </p>
                      <div className="space-y-2">
                        {cart.map((item, idx) => (
                          <CartItem
                            key={`${item.menuItem.id}-${idx}`}
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                            onPriceChange={handlePriceChange}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Método de pago */}
                    {shouldShowPayment && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Método de pago</p>
                        {renderPaymentButtons()}
                      </div>
                    )}

                    {/* Total y confirmar */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-base font-semibold text-gray-700">Total</span>
                        <span className="text-2xl font-black text-red-600">S/ {getTotal().toFixed(2)}</span>
                      </div>
                      <button onClick={clearCart}
                        className="w-full px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors mb-3 text-sm font-medium">
                        Vaciar carrito
                      </button>
                      <button onClick={handleCreateOrder} disabled={!isFormValid || isCreatingOrder}
                        className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        {isCreatingOrder
                          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Guardando...</span></>
                          : <><Check size={18} /><span>Confirmar Pedido</span></>
                        }
                      </button>
                      {!isFormValid && cart.length > 0 && (
                        <p className="text-center text-xs text-gray-400 mt-2">
                          {(activeTab === 'fullDay' || activeTab === 'loncheritas')
                            ? '⚠️ Completa alumno y apoderado'
                            : activeTab === 'walk-in' ? '⚠️ Completa cliente, teléfono y mesa'
                            : activeTab === 'phone' ? ''
                            : '⚠️ Completa los datos del cliente'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── BOTTOM TAB BAR ─────────────────────────────────────── */}
            <div className="mobile-tab-bar lg:hidden">

              <div className={`mobile-tab-item ${mobileTab === 'client' ? 'active' : ''}`}
                onClick={() => setMobileTab('client')}>
                <div className="mobile-tab-icon">
                  <User size={16} />
                </div>
                <span className="mobile-tab-label">Cliente</span>
              </div>

              <div className={`mobile-tab-item ${mobileTab === 'menu' ? 'active' : ''}`}
                onClick={() => setMobileTab('menu')}>
                <div className="mobile-tab-icon">
                  <UtensilsCrossed size={16} />
                </div>
                <span className="mobile-tab-label">Menú</span>
              </div>

              <div className={`mobile-tab-item ${mobileTab === 'cart' ? 'active' : ''}`}
                onClick={() => setMobileTab('cart')}>
                {totalItems > 0 && (
                  <span className="mobile-tab-badge">{totalItems > 99 ? '99+' : totalItems}</span>
                )}
                <div className="mobile-tab-icon">
                  <ShoppingBag size={16} />
                </div>
                <span className="mobile-tab-label">Pedido</span>
              </div>

            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              DESKTOP: Layout original en 3 columnas (sin cambios)
          ═══════════════════════════════════════════════════════════ */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-7 gap-6">

              {/* Columna izquierda: formulario */}
              <div className="col-span-2">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Nuevo Pedido</h2>
                  </div>
                  <div className="mb-5">
                    <SourceSelector value={activeTab} onChange={setActiveTab} layout="grid" />
                  </div>
                  {renderClientForm(false)}
                </div>
              </div>

              {/* Columna central: menú */}
              <div className="col-span-3">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Menú</h2>
                    {isAdmin && (
                      <button onClick={() => setShowMenuManager(true)}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1">
                        <Settings size={14} /><span>Gestionar</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-[600px] overflow-y-auto pr-1">
                    {renderMenu(3)}
                  </div>
                </div>
              </div>

              {/* Columna derecha: carrito */}
              <div className="col-span-2">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Pedido</h2>
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Carrito vacío</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4 pr-1">
                        {cart.map((item, idx) => (
                          <CartItem key={`${item.menuItem.id}-${idx}`} item={item}
                            onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onPriceChange={handlePriceChange} />
                        ))}
                      </div>
                      {shouldShowPayment && (
                        <div className="mb-4 pt-2 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago *</label>
                          {renderPaymentButtons()}
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Total:</span>
                          <span className="text-xl font-bold text-red-600">S/ {getTotal().toFixed(2)}</span>
                        </div>
                        <button onClick={clearCart}
                          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mb-2 text-sm">
                          Vaciar
                        </button>
                        <button onClick={handleCreateOrder} disabled={!isFormValid || isCreatingOrder}
                          className="w-full bg-red-500 text-white py-3 rounded-lg hover:shadow-md disabled:opacity-50 font-semibold transition-all flex items-center justify-center gap-2">
                          {isCreatingOrder
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Guardando...</span></>
                            : 'Confirmar'
                          }
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
});

export default OrderReception;
