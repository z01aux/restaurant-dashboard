// ARCHIVO: src/components/menu/MenuManager.tsx
// OPTIMIZADO: Diseño responsivo y moderno para móvil y desktop
// CORREGIDO: Modal con mismo estilo que Alumnos (backdrop-blur y centrado perfecto)
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, XCircle, Star, StarOff,
  Package
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { MenuItem } from '../../types';
import { useMenu } from '../../hooks/useMenu';
import { useCategories } from '../../hooks/useCategories';

// --- Componente Skeleton para carga ---
const MenuItemSkeleton: React.FC = React.memo(() => (
  <div className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="flex space-x-1">
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
      </div>
    </div>
    <div className="mt-3 flex justify-between items-center">
      <div className="h-6 bg-gray-300 rounded w-20"></div>
      <div className="h-6 bg-gray-300 rounded w-16"></div>
    </div>
  </div>
));

// --- Tarjeta de Producto (Responsive) ---
const ProductCard: React.FC<{
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onToggleDailySpecial: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
  isMobile: boolean;
}> = React.memo(({ item, onEdit, onToggleDailySpecial, onDelete, isMobile }) => {
  const handleEdit = useCallback(() => onEdit(item), [item, onEdit]);
  const handleToggleSpecial = useCallback(() => onToggleDailySpecial(item), [item, onToggleDailySpecial]);
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200 group relative">
      {/* Badge de producto del día - Móvil: más pequeño */}
      {item.isDailySpecial && (
        <div className={`absolute ${isMobile ? '-top-1 -left-1 px-1.5 py-0.5 text-[10px]' : '-top-2 -left-2 px-2 py-1 text-xs'} bg-yellow-500 text-white rounded-lg font-bold shadow-lg flex items-center gap-1 z-10`}>
          <Star size={isMobile ? 10 : 12} />
          <span>Del Día</span>
        </div>
      )}
      
      <div className={`${isMobile ? 'p-3' : 'p-5'}`}>
        {/* Header con nombre y acciones */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-900 truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
              {item.name}
            </h3>
            <p className={`text-gray-500 truncate ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {item.category}
            </p>
          </div>
          
          {/* Acciones - Siempre visibles en móvil, al hover en desktop */}
          <div className={`flex gap-1 ${!isMobile && 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
            <button
              onClick={handleToggleSpecial}
              className={`p-1.5 rounded-lg transition-colors ${
                item.isDailySpecial 
                  ? 'text-yellow-600 hover:bg-yellow-50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={item.isDailySpecial ? 'Quitar del menú del día' : 'Agregar al menú del día'}
            >
              {item.isDailySpecial ? <Star size={isMobile ? 14 : 16} fill="currentColor" /> : <StarOff size={isMobile ? 14 : 16} />}
            </button>
            <button
              onClick={handleEdit}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar producto"
            >
              <Edit size={isMobile ? 14 : 16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar producto"
            >
              <Trash2 size={isMobile ? 14 : 16} />
            </button>
          </div>
        </div>

        {/* Descripción (solo desktop) */}
        {!isMobile && item.description && (
          <p className="text-gray-600 text-xs mt-2 line-clamp-2">{item.description}</p>
        )}

        {/* Precio y disponibilidad */}
        <div className={`flex justify-between items-center ${isMobile ? 'mt-3' : 'mt-4'}`}>
          <span className={`font-bold text-red-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
            S/ {item.price.toFixed(2)}
          </span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            item.available 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {item.available ? 'Disponible' : 'No disponible'}
          </span>
        </div>

        {/* Tipo (solo móvil) */}
        {isMobile && (
          <div className="mt-2 text-[10px] text-gray-400">
            {item.type === 'food' ? '🍽️ Comida' : '🥤 Bebida'}
          </div>
        )}
      </div>
    </div>
  );
});

// --- Componente Principal ---
const MenuManager: React.FC = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'inventory'>('all');
  const [isMobile, setIsMobile] = useState(false);

  // Hooks
  const {
    loading,
    getAllItems,
    getCategories,
    createItem,
    updateItem,
    toggleDailySpecial,
    deleteItem
  } = useMenu();

  const { categories: dbCategories } = useCategories();

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Datos calculados
  const allMenuItems = useMemo(() => getAllItems(), [getAllItems]);
  const categories = useMemo(() => ['Todas', ...getCategories()], [getCategories()]);

  // Items filtrados
  const filteredItems = useMemo(() => {
    let items = allMenuItems;

    // Filtro por tipo
    if (filterType === 'daily') {
      items = items.filter(item => item.isDailySpecial);
    } else if (filterType === 'inventory') {
      items = items.filter(item => !item.isDailySpecial);
    }

    // Filtro por categoría
    if (selectedCategory && selectedCategory !== 'Todas') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }

    return items;
  }, [allMenuItems, selectedCategory, searchTerm, filterType]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: allMenuItems.length,
    daily: allMenuItems.filter(i => i.isDailySpecial).length,
    inventory: allMenuItems.filter(i => !i.isDailySpecial).length,
    available: allMenuItems.filter(i => i.available).length
  }), [allMenuItems]);

  // Handlers
  const handleNewItem = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const handleEditItem = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  const handleToggleDailySpecial = useCallback(async (item: MenuItem) => {
    const result = await toggleDailySpecial(item.id, !item.isDailySpecial);
    if (!result.success) {
      alert('❌ Error al actualizar producto del día');
    }
  }, [toggleDailySpecial]);

  const handleDeleteClick = useCallback((itemId: string) => {
    const item = allMenuItems.find(i => i.id === itemId);
    if (item) {
      setDeleteConfirm({ id: itemId, name: item.name });
    }
  }, [allMenuItems]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    const result = await deleteItem(deleteConfirm.id);
    if (result.success) {
      setDeleteConfirm(null);
    } else {
      alert('❌ Error al eliminar: ' + result.error);
    }
  }, [deleteConfirm, deleteItem]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // Renderizado de productos
  const renderedProducts = useMemo(() => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <MenuItemSkeleton key={i} />)}
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12 bg-white/50 rounded-2xl">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchTerm || selectedCategory || filterType !== 'all'
              ? 'No se encontraron productos'
              : 'Menú vacío'}
          </h3>
          <p className="text-gray-500 text-sm">
            {searchTerm || selectedCategory || filterType !== 'all'
              ? 'Prueba con otros filtros'
              : 'Agrega tu primer producto'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item: MenuItem) => (
          <ProductCard
            key={item.id}
            item={item}
            onEdit={handleEditItem}
            onToggleDailySpecial={handleToggleDailySpecial}
            onDelete={handleDeleteClick}
            isMobile={isMobile}
          />
        ))}
      </div>
    );
  }, [loading, filteredItems, handleEditItem, handleToggleDailySpecial, handleDeleteClick, isMobile, searchTerm, selectedCategory, filterType]);

  const isAnyModalOpen = showForm || !!deleteConfirm;

  // Bloquea scroll del body y compensa scrollbar para evitar salto de layout
  useEffect(() => {
    if (isAnyModalOpen) {
      const w = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${w}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isAnyModalOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 p-3 sm:p-6">

      {/* ── Modal Formulario via portal ── */}
      {showForm && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            onClick={handleCloseForm}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto"
              style={{ animation: 'menuModalIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
              onClick={e => e.stopPropagation()}
            >
              <div className={`bg-gradient-to-r ${editingItem ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-amber-500'} p-5 text-white sticky top-0 rounded-t-2xl z-10`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      {editingItem ? <Edit size={20} className="text-white" /> : <Plus size={20} className="text-white" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">
                        {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                      </h2>
                      <p className="text-xs opacity-80">
                        {editingItem ? `Modificar ${editingItem.name}` : 'Completa los datos del producto'}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleCloseForm} disabled={formLoading}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                setFormLoading(true);
                try {
                  const data = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    price: parseFloat(formData.get('price') as string),
                    category: formData.get('category') as string,
                    type: formData.get('type') as 'food' | 'drink',
                    available: formData.get('available') === 'on',
                    isDailySpecial: formData.get('isDailySpecial') === 'on'
                  };
                  const result = editingItem
                    ? await updateItem(editingItem.id, data)
                    : await createItem(data);
                  if (result.success) { handleCloseForm(); }
                  else { alert('❌ Error: ' + result.error); }
                } catch (error: any) {
                  alert('❌ Error inesperado: ' + error.message);
                } finally { setFormLoading(false); }
              }} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input type="text" name="name" defaultValue={editingItem?.name || ''}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                    required disabled={formLoading} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                  <input type="number" name="price" step="0.01" min="0" defaultValue={editingItem?.price || ''}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                    placeholder="0.00" required disabled={formLoading} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select name="category" defaultValue={editingItem?.category || dbCategories[0] || ''}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                    required disabled={formLoading}>
                    {dbCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select name="type" defaultValue={editingItem?.type || 'food'}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                    required disabled={formLoading}>
                    <option value="food">🍽️ Comida</option>
                    <option value="drink">🥤 Bebida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea name="description" defaultValue={editingItem?.description || ''} rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                    placeholder="Opcional" disabled={formLoading} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="available" defaultChecked={editingItem?.available ?? true}
                      className="w-4 h-4 text-red-500 rounded" disabled={formLoading} />
                    <span>Disponible</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isDailySpecial" defaultChecked={editingItem?.isDailySpecial || false}
                      className="w-4 h-4 text-yellow-500 rounded" disabled={formLoading} />
                    <span className="flex items-center gap-1"><Star size={14} /> Producto del Día</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleCloseForm} disabled={formLoading}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={formLoading}
                    className={`flex-1 bg-gradient-to-r ${editingItem ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-amber-500'} text-white px-4 py-3 rounded-xl hover:shadow-md transition-all font-semibold disabled:opacity-50`}>
                    {formLoading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Crear Producto')}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <style>{`@keyframes menuModalIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>
        </>,
        document.body
      )}

      {/* ── Modal Eliminación via portal ── */}
      {deleteConfirm && createPortal(
        <>
          <div className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm" onClick={handleCancelDelete} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl pointer-events-auto"
              style={{ animation: 'menuModalIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
            >
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 rounded-t-2xl text-white">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg"><Trash2 size={20} /></div>
                  <h3 className="text-lg font-bold">Eliminar Producto</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-1">¿Estás seguro de eliminar:</p>
                <p className="font-bold text-gray-900 text-base mb-2">"{deleteConfirm.name}"</p>
                <p className="text-sm text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
                <div className="flex space-x-3">
                  <button onClick={handleCancelDelete}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                    Cancelar
                  </button>
                  <button onClick={handleConfirmDelete}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl hover:shadow-md transition-all font-semibold flex items-center justify-center space-x-2">
                    <Trash2 size={16} /><span>Sí, eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>🍽️</span> Gestión del Menú
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {stats.total} productos · {stats.daily} del día · {stats.inventory} inventario
              </p>
            </div>
            
            <button
              onClick={handleNewItem}
              className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition-all text-sm font-medium"
            >
              <Plus size={18} />
              <span>Nuevo Producto</span>
            </button>
          </div>

          {/* Filtros */}
          <div className="space-y-3 mb-6">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white/80"
                placeholder="Buscar por nombre o categoría..."
              />
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterType === 'all'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Package size={12} /> Todos
              </button>
              <button
                onClick={() => setFilterType('daily')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterType === 'daily'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Star size={12} /> Del Día ({stats.daily})
              </button>
              <button
                onClick={() => setFilterType('inventory')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterType === 'inventory'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Package size={12} /> Inventario ({stats.inventory})
              </button>
            </div>

            {/* Categorías */}
            <div className="overflow-x-auto pb-2 hide-scrollbar">
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === 'Todas' ? '' : cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      (cat === 'Todas' && !selectedCategory) || selectedCategory === cat
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de Productos */}
          {renderedProducts}

        </div>
      </div>
    </div>
  );
});

export default MenuManager;
