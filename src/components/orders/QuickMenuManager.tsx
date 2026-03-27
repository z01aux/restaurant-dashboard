// ============================================
// ARCHIVO: src/components/orders/QuickMenuManager.tsx
// GESTIÓN RÁPIDA DE MENÚ - Con scrollbar y colores consistentes
// ============================================

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Settings, X, Plus, Trash2, Search, 
  Tag, FolderPlus, Edit, Check, 
  Minus, Star, Package,
  CheckSquare, Square, Trash, RefreshCw,
  Loader
} from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { useCategories } from '../../hooks/useCategories';

interface QuickMenuManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

// ── Componente de edición inline ─────────────────────────────────
const InlineEdit: React.FC<{
  value: string;
  onSave: (newValue: string) => void;
  type?: 'text' | 'number';
  className?: string;
}> = ({ value, onSave, type = 'text', className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-1">
        <input
          type={type}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 ${className}`}
          autoFocus
        />
        <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
          <Check size={14} />
        </button>
        <button onClick={() => { setTempValue(value); setIsEditing(false); }} className="p-1 text-red-600 hover:bg-red-50 rounded">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center group">
      <span className={className}>{value}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-500"
      >
        <Edit size={12} />
      </button>
    </div>
  );
};

// ── Modal de categorías (con colores rojo/ámbar) ─────────────────────────
const CategoryManagerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onCategoryCreated: () => void;
}> = ({ isOpen, onClose, categories, onCategoryCreated }) => {
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const { createCategory, updateCategory, deleteCategory } = useCategories();

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      setError('El nombre de la categoría no puede estar vacío');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      setError('Esta categoría ya existe');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await createCategory(newCategory);
      
      if (result.success) {
        setSuccess('Categoría creada exitosamente');
        setNewCategory('');
        onCategoryCreated();
      } else {
        setError(`Error al crear la categoría: ${result.error}`);
      }
    } catch (error: any) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingIndex(null);
      return;
    }

    if (categories.includes(newName.trim()) && newName.trim() !== oldName) {
      setError('Ya existe una categoría con ese nombre');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await updateCategory(oldName, newName);
      
      if (result.success) {
        setSuccess('Categoría actualizada exitosamente');
        setEditingIndex(null);
        onCategoryCreated();
      } else {
        setError(`Error al actualizar: ${result.error}`);
      }
    } catch (error: any) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoryName}"? Los productos de esta categoría quedarán sin categoría.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await deleteCategory(categoryName);
      
      if (result.success) {
        setSuccess('Categoría eliminada exitosamente');
        onCategoryCreated();
      } else {
        setError(`Error al eliminar: ${result.error}`);
      }
    } catch (error: any) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-red-500 to-amber-500 p-5 text-white sticky top-0 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Tag size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Gestionar Categorías</h2>
                  <p className="text-xs text-amber-100 mt-0.5">Administra las categorías del menú</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {(error || success) && (
            <div className={`p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {error || success}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Categoría
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ej: Postres, Bebidas, etc."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={loading || !newCategory.trim()}
                  className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50 flex items-center space-x-1"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <FolderPlus size={16} />
                  )}
                  <span>Crear</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Categorías existentes ({categories.length})
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {categories.map((category, index) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="flex-1 px-2 py-1 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                        autoFocus
                        onBlur={() => handleUpdateCategory(category, editingValue)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateCategory(category, editingValue)}
                        disabled={loading}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                    )}
                    
                    <div className="flex space-x-2">
                      {editingIndex !== index && (
                        <button
                          onClick={() => {
                            setEditingIndex(index);
                            setEditingValue(category);
                          }}
                          className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                          disabled={loading}
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                        disabled={loading}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-4 bg-gray-50 text-xs text-gray-500">
            <p>Las categorías se sincronizan automáticamente con el Menú</p>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Componente principal QuickMenuManager ─────────────────────────
export const QuickMenuManager: React.FC<QuickMenuManagerProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'inventory'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  
  // Estado para selección múltiple
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const { getAllItems, createItem, updateItem, refreshMenu } = useMenu();
  const { categories: dbCategories, refreshCategories } = useCategories();

  const allItems = useMemo(() => getAllItems(), [getAllItems, isOpen]);

  // Filtrar productos del día (isDailySpecial = true)
  const todayItems = useMemo(() => 
    allItems.filter(item => item.isDailySpecial && item.available)
  , [allItems]);

  // Filtrar inventario (no son del día pero están disponibles)
  const inventoryItems = useMemo(() => 
    allItems.filter(item => !item.isDailySpecial && item.available)
  , [allItems]);

  // Filtrar productos según búsqueda y categoría
  const filteredTodayItems = useMemo(() => {
    let items = todayItems;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }
    if (categoryFilter) {
      items = items.filter(item => item.category === categoryFilter);
    }
    return items;
  }, [todayItems, searchTerm, categoryFilter]);

  const filteredInventoryItems = useMemo(() => {
    let items = inventoryItems;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.price.toString().includes(term)
      );
    }
    if (categoryFilter) {
      items = items.filter(item => item.category === categoryFilter);
    }
    return items;
  }, [inventoryItems, searchTerm, categoryFilter]);

  // ── NUEVO PRODUCTO ─────────────────────────────────────────────
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    type: 'food' as 'food' | 'drink',
    description: '',
    available: true,
    isDailySpecial: true,
  });

  useEffect(() => {
    if (dbCategories.length > 0 && !newProduct.category) {
      setNewProduct(prev => ({ ...prev, category: dbCategories[0] }));
    }
  }, [dbCategories]);

  // ── Función para ejecutar acciones en paralelo ─────────────────
  const executeParallel = async <T,>(
    items: T[],
    action: (item: T, index: number) => Promise<boolean>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: number; errors: number }> => {
    let success = 0;
    let errors = 0;
    let completed = 0;
    const total = items.length;

    const concurrency = 5;
    const batches = [];
    
    for (let i = 0; i < items.length; i += concurrency) {
      batches.push(items.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(async (item, idx) => {
          const result = await action(item, completed + idx);
          return result;
        })
      );
      
      for (const result of results) {
        if (result) success++;
        else errors++;
      }
      
      completed += batch.length;
      if (onProgress) onProgress(completed, total);
    }

    return { success, errors };
  };

  // ── Acciones masivas en Hoy (quitar) ───────────────────────────
  const handleRemoveSelectedFromToday = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmMsg = `¿Quitar ${selectedItems.size} producto(s) del menú de hoy?`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setProgressMessage(`Quitando ${selectedItems.size} productos...`);
    
    const itemsToRemove = Array.from(selectedItems);
    const { success, errors } = await executeParallel(
      itemsToRemove,
      async (id) => {
        const result = await updateItem(id, { isDailySpecial: false });
        return result.success;
      },
      (completed, total) => {
        setProgressMessage(`Procesando... ${completed} de ${total}`);
      }
    );

    setSelectedItems(new Set());
    setSelectMode(false);
    onRefresh();
    setLoading(false);
    setProgressMessage(null);
    
    alert(`✅ ${success} producto(s) quitados del día\n${errors > 0 ? `❌ ${errors} error(es)` : ''}`);
  };

  // ── Acciones masivas en Inventario (agregar a Hoy) ─────────────
  const handleAddSelectedToToday = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmMsg = `¿Agregar ${selectedItems.size} producto(s) al menú de hoy?`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setProgressMessage(`Agregando ${selectedItems.size} productos...`);
    
    const itemsToAdd = Array.from(selectedItems);
    const { success, errors } = await executeParallel(
      itemsToAdd,
      async (id) => {
        const result = await updateItem(id, { isDailySpecial: true });
        return result.success;
      },
      (completed, total) => {
        setProgressMessage(`Procesando... ${completed} de ${total}`);
      }
    );

    setSelectedItems(new Set());
    setSelectMode(false);
    onRefresh();
    setLoading(false);
    setProgressMessage(null);
    
    alert(`✅ ${success} producto(s) agregados al menú de hoy\n${errors > 0 ? `❌ ${errors} error(es)` : ''}`);
  };

  // ── Quitar todos los productos de Hoy ──────────────────────────
  const handleRemoveAllFromToday = async () => {
    if (todayItems.length === 0) return;
    if (!window.confirm(`¿Quitar TODOS los ${todayItems.length} productos del menú de hoy?`)) return;

    setLoading(true);
    setProgressMessage(`Quitando ${todayItems.length} productos...`);
    
    const { success, errors } = await executeParallel(
      todayItems,
      async (item) => {
        const result = await updateItem(item.id, { isDailySpecial: false });
        return result.success;
      },
      (completed, total) => {
        setProgressMessage(`Procesando... ${completed} de ${total}`);
      }
    );

    setSelectedItems(new Set());
    setSelectMode(false);
    onRefresh();
    setLoading(false);
    setProgressMessage(null);
    
    alert(`✅ ${success} producto(s) quitados del día\n${errors > 0 ? `❌ ${errors} error(es)` : ''}`);
  };

  // ── Seleccionar todos los productos filtrados ──────────────────
  const handleSelectAll = () => {
    const items = activeTab === 'today' ? filteredTodayItems : filteredInventoryItems;
    const ids = new Set(items.map(item => item.id));
    setSelectedItems(ids);
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  // ── Acciones individuales ──────────────────────────────────────
  const handleRemoveFromToday = async (itemId: string) => {
    setLoading(true);
    const result = await updateItem(itemId, { isDailySpecial: false });
    if (result.success) {
      onRefresh();
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
    setLoading(false);
  };

  const handleAddToToday = async (itemId: string) => {
    setLoading(true);
    const result = await updateItem(itemId, { isDailySpecial: true });
    if (result.success) onRefresh();
    setLoading(false);
  };

  const handleUpdatePrice = async (itemId: string, newPrice: number) => {
    const result = await updateItem(itemId, { price: newPrice });
    if (result.success) onRefresh();
  };

  const handleUpdateName = async (itemId: string, newName: string) => {
    const result = await updateItem(itemId, { name: newName });
    if (result.success) onRefresh();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.category) return;

    const price = parseFloat(newProduct.price);
    if (isNaN(price) || price <= 0) return;

    setLoading(true);
    const result = await createItem({
      name: newProduct.name,
      price: price,
      category: newProduct.category,
      type: newProduct.type,
      available: newProduct.available,
      isDailySpecial: newProduct.isDailySpecial,
      description: newProduct.description,
    });

    if (result.success) {
      setNewProduct({ 
        name: '', price: '', category: dbCategories[0] || '',
        type: 'food', description: '', available: true, isDailySpecial: true,
      });
      setShowNewProductForm(false);
      onRefresh();
    }
    setLoading(false);
  };

  const handleCategoryCreated = async () => {
    await refreshCategories();
    await refreshMenu();
    onRefresh();
  };

  // Limpiar selección al cambiar de pestaña
  useEffect(() => {
    setSelectedItems(new Set());
    setSelectMode(false);
  }, [activeTab]);

  if (!isOpen) return null;

  const currentItems = activeTab === 'today' ? filteredTodayItems : filteredInventoryItems;
  const totalItems = activeTab === 'today' ? todayItems.length : inventoryItems.length;
  const selectedCount = selectedItems.size;

  return (
    <>
      {/* Overlay con blur y animación fade-in */}
      <div 
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal principal con animación zoom-in */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200 flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-red-500 to-amber-500 p-5 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Settings size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Gestión Rápida de Menú</h2>
                  <p className="text-xs text-red-100 mt-0.5">Administra los productos del día y el inventario</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Gestionar categorías"
                >
                  <Tag size={18} />
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="flex border-b border-gray-200 p-2 flex-shrink-0 gap-1 bg-gray-50/50">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'today'
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Star size={16} />
              <span>📋 Hoy ({todayItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'inventory'
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package size={16} />
              <span>📦 Inventario ({inventoryItems.length})</span>
            </button>
            <button
              onClick={() => setShowNewProductForm(!showNewProductForm)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                showNewProductForm
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Plus size={16} />
              <span>✨ Nuevo Producto</span>
            </button>
          </div>

          {/* Barra de progreso */}
          {progressMessage && (
            <div className="bg-blue-50 border-b border-blue-200 p-2 flex items-center justify-center space-x-2 text-sm text-blue-700 flex-shrink-0">
              <Loader size={16} className="animate-spin" />
              <span>{progressMessage}</span>
            </div>
          )}

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto p-5">
            
            {/* Formulario nuevo producto */}
            {showNewProductForm && (
              <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Plus size={18} className="text-blue-500" />
                    Crear Nuevo Producto
                  </h3>
                  <button
                    onClick={() => setShowNewProductForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <form onSubmit={handleCreateProduct} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Nombre del producto *"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      placeholder="Precio *"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                      required
                    >
                      {dbCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <select
                      value={newProduct.type}
                      onChange={(e) => setNewProduct({...newProduct, type: e.target.value as 'food' | 'drink'})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                    >
                      <option value="food">🍽️ Comida</option>
                      <option value="drink">🥤 Bebida</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-1 text-sm">
                      <input
                        type="checkbox"
                        checked={newProduct.available}
                        onChange={(e) => setNewProduct({...newProduct, available: e.target.checked})}
                        className="rounded text-red-500 focus:ring-red-500"
                      />
                      <span>Disponible</span>
                    </label>
                    <label className="flex items-center space-x-1 text-sm">
                      <input
                        type="checkbox"
                        checked={newProduct.isDailySpecial}
                        onChange={(e) => setNewProduct({...newProduct, isDailySpecial: e.target.checked})}
                        className="rounded text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="flex items-center gap-1"><Star size={12} /> Producto del Día</span>
                    </label>
                  </div>
                  
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Descripción (opcional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  />
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {loading ? 'Creando...' : 'Crear Producto'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewProductForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Acciones masivas */}
            {currentItems.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  {!selectMode ? (
                    <button
                      onClick={() => setSelectMode(true)}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      <CheckSquare size={14} />
                      <span>Seleccionar</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSelectAll}
                        className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center space-x-1 transition-colors"
                      >
                        <CheckSquare size={14} />
                        <span>Seleccionar todo ({currentItems.length})</span>
                      </button>
                      <button
                        onClick={handleDeselectAll}
                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-1 transition-colors"
                      >
                        <Square size={14} />
                        <span>Deseleccionar</span>
                      </button>
                      {activeTab === 'today' ? (
                        <button
                          onClick={handleRemoveSelectedFromToday}
                          disabled={selectedCount === 0}
                          className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center space-x-1 transition-colors"
                        >
                          <Trash size={14} />
                          <span>Quitar ({selectedCount})</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleAddSelectedToToday}
                          disabled={selectedCount === 0}
                          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-1 transition-colors"
                        >
                          <Star size={14} />
                          <span>Agregar hoy ({selectedCount})</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectMode(false)}
                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'today' && todayItems.length > 0 && (
                    <button
                      onClick={handleRemoveAllFromToday}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      <Trash size={14} />
                      <span>Quitar todos</span>
                    </button>
                  )}
                </div>
                
                {(searchTerm || categoryFilter) && (
                  <button
                    onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}

            {/* Buscador y filtro de categoría */}
            <div className="mb-4 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={activeTab === 'today' ? "🔍 Buscar en productos del día..." : "🔍 Buscar en inventario..."}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Filtro por categoría */}
              {dbCategories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">📁 Todas las categorías</option>
                  {dbCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Lista de productos con scroll */}
            <div className="space-y-2 max-h-[calc(100vh-480px)] min-h-[300px] overflow-y-auto pr-1">
              {loading && !progressMessage && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-2">Procesando...</p>
                </div>
              )}

              {!loading && currentItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl text-gray-300 mb-3">
                    {activeTab === 'today' ? '🌟' : '📦'}
                  </div>
                  <p className="text-gray-500 font-medium">
                    {searchTerm || categoryFilter 
                      ? 'No se encontraron productos con estos filtros'
                      : activeTab === 'today' 
                        ? 'No hay productos en el menú de hoy'
                        : 'No hay productos en inventario'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {activeTab === 'today' 
                      ? '💡 Agrega productos desde la pestaña "Inventario"'
                      : '💡 Crea un nuevo producto desde la pestaña "Nuevo Producto"'}
                  </p>
                </div>
              )}

              {!loading && currentItems.length > 0 && (
                <>
                  {currentItems.map(item => {
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                          selectMode && isSelected 
                            ? 'bg-red-50 border-red-300 shadow-sm' 
                            : selectMode
                              ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'
                              : activeTab === 'today'
                                ? 'bg-green-50 border-green-200 hover:shadow-sm'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                        onClick={() => selectMode && handleToggleSelect(item.id)}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {selectMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleSelect(item.id); }}
                              className="flex-shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare size={20} className="text-red-600" />
                              ) : (
                                <Square size={20} className="text-gray-400" />
                              )}
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <InlineEdit
                                value={item.name}
                                onSave={(newName) => handleUpdateName(item.id, newName)}
                                className="font-medium text-gray-900 text-sm"
                              />
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {item.category}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <InlineEdit
                                value={`S/ ${item.price.toFixed(2)}`}
                                onSave={(newVal) => {
                                  const price = parseFloat(newVal.replace('S/ ', ''));
                                  if (!isNaN(price)) handleUpdatePrice(item.id, price);
                                }}
                                type="number"
                                className="text-xs font-semibold text-red-600"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!selectMode && activeTab === 'today' && (
                            <button
                              onClick={() => handleRemoveFromToday(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                              title="Quitar del menú de hoy"
                            >
                              <Minus size={14} />
                            </button>
                          )}
                          {!selectMode && activeTab === 'inventory' && (
                            <button
                              onClick={() => handleAddToToday(item.id)}
                              className="p-1.5 bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-lg hover:shadow-md transition-all"
                              title="Agregar al menú de hoy"
                            >
                              <Star size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Footer con contador */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <span className="font-medium">
                Mostrando {currentItems.length} de {totalItems} productos
              </span>
              {selectMode && selectedCount > 0 && (
                <span className="text-red-600 font-medium">
                  {selectedCount} seleccionado(s)
                </span>
              )}
            </div>
            <button
              onClick={() => { onRefresh(); setSearchTerm(''); setCategoryFilter(''); }}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de categorías con colores rojo/ámbar */}
      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        categories={dbCategories}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
};

export default QuickMenuManager;