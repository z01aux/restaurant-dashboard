// =================================================
// ARCHIVO: src/components/orders/OrderReception.tsx (MODIFICADO - CON OEP)
// =================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, Minus, X, ShoppingBag, Trash2, Edit2, Check, DollarSign, 
  Settings, RotateCcw, Search, Tag, FolderPlus, Edit
} from 'lucide-react';
import { MenuItem, OrderItem, Order } from '../../types';
import { useMenu } from '../../hooks/useMenu';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { useStudents } from '../../hooks/useStudents';
import { useFullDay } from '../../hooks/useFullDay';
import { useCategories } from '../../hooks/useCategories';
import { useOEP } from '../../hooks/useOEP'; // <-- NUEVA IMPORTACIÓN
import { GRADES, SECTIONS, Grade, Section } from '../../types/student';

const styles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }

  /* Mejora para el contador de productos */
  .product-counter {
    position: absolute;
    top: -8px;
    right: -8px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border-radius: 9999px;
    min-width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    border: 2px solid white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 20;
    animation: popIn 0.2s ease-out;
  }

  @keyframes popIn {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Mejora para las cards de productos */
  .product-card {
    transition: all 0.2s ease-in-out;
    position: relative;
    overflow: hidden;
  }

  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .product-card:hover .product-counter {
    transform: scale(1.1);
  }

  /* Barra de categorías mejorada */
  .categories-container {
    background: white;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    margin-bottom: 16px;
  }

  .categories-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
    scrollbar-color: #f97316 #fee2e2;
  }

  .categories-scroll::-webkit-scrollbar {
    height: 6px;
  }

  .categories-scroll::-webkit-scrollbar-track {
    background: #fee2e2;
    border-radius: 20px;
  }

  .categories-scroll::-webkit-scrollbar-thumb {
    background: #f97316;
    border-radius: 20px;
  }

  .categories-scroll::-webkit-scrollbar-thumb:hover {
    background: #ea580c;
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
    box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
  }

  .category-button-inactive {
    background: #f3f4f6;
    color: #4b5563;
    border: 1px solid #e5e7eb;
  }

  .category-button-inactive:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }

  /* Vista compacta para móvil */
  @media (max-width: 640px) {
    .category-button {
      padding: 6px 12px;
      font-size: 0.75rem;
    }
  }
`;

const ToastNotification: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}> = React.memo(({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      isVisible 
        ? 'animate-in slide-in-from-right-full opacity-100' 
        : 'animate-out slide-out-to-right-full opacity-0'
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
}> = React.memo(({
  item,
  onUpdateQuantity,
  onRemove,
  onPriceChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrice, setTempPrice] = useState(item.menuItem.price.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempPrice(item.menuItem.price.toString());
  }, [item.menuItem.price]);

  const handleCancelEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setTempPrice(item.menuItem.price.toString());
  }, [item.menuItem.price]);

  const handleSavePrice = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceChange(item.menuItem.id, newPrice);
      setIsEditing(false);
    }
  }, [tempPrice, item.menuItem.id, onPriceChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const newPrice = parseFloat(tempPrice);
      if (!isNaN(newPrice) && newPrice > 0) {
        onPriceChange(item.menuItem.id, newPrice);
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempPrice(item.menuItem.price.toString());
    }
  }, [tempPrice, item.menuItem.id, item.menuItem.price, onPriceChange]);

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-2">
          <div className="font-medium text-gray-900 text-sm break-words flex items-center gap-2">
            {item.menuItem.name}
            <button
              onClick={handleStartEdit}
              className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
              title="Editar precio"
            >
              <Edit2 size={12} />
            </button>
          </div>
          
          <div className="mt-1">
            {isEditing ? (
              <div className="flex items-center space-x-1 bg-blue-50 p-1 rounded-lg border border-blue-200">
                <DollarSign size={14} className="text-blue-600" />
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-20 px-1 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Precio"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={handleSavePrice}
                  className="text-green-600 hover:text-green-800 p-1 hover:bg-green-100 rounded transition-colors"
                  title="Guardar"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded transition-colors"
                  title="Cancelar"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className="text-gray-600 text-xs">
                S/ {item.menuItem.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-1 py-1">
            <button
              onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center font-medium text-xs">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          <button
            onClick={() => onRemove(item.menuItem.id)}
            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar del carrito"
          >
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
  const handleAddClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item);
  }, [item, onAddToCart]);

  const handleDecrement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(item.id, quantityInCart - 1);
  }, [item.id, quantityInCart, onUpdateQuantity]);

  const handleIncrement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(item.id, quantityInCart + 1);
  }, [item.id, quantityInCart, onUpdateQuantity]);

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 product-card group">
      {/* CONTADOR MEJORADO - MÁS VISIBLE EN DESKTOP */}
      {quantityInCart > 0 && (
        <div className="product-counter">
          {quantityInCart}
        </div>
      )}
      
      <div className="mb-2">
        <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
          {item.name}
        </div>
        <div className="font-bold text-red-600 text-base">
          S/ {item.price.toFixed(2)}
        </div>
      </div>

      {quantityInCart > 0 ? (
        <div className="flex items-center justify-between space-x-1 mt-2">
          <button
            onClick={handleDecrement}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-bold text-red-600 text-sm">{quantityInCart}</span>
          <button
            onClick={handleIncrement}
            className="flex-1 py-2 bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-lg hover:from-red-600 hover:to-amber-600 transition-colors flex items-center justify-center"
          >
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleAddClick}
          className="w-full mt-2 bg-gradient-to-r from-red-500 to-amber-500 text-white py-2 rounded-lg flex items-center justify-center space-x-1 text-sm font-medium hover:from-red-600 hover:to-amber-600 transition-colors"
        >
          <Plus size={14} />
          <span>Agregar</span>
        </button>
      )}
    </div>
  );
});

// ============================================
// MODAL DE GESTIÓN DE CATEGORÍAS
// ============================================
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tag size={20} />
              <h2 className="text-lg font-bold">Gestionar Categorías</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {(error || success) && (
          <div className={`p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {error || success}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <button
                onClick={handleCreateCategory}
                disabled={loading || !newCategory.trim()}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
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
            <div className="space-y-2">
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
                      className="flex-1 px-2 py-1 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
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

        <div className="border-t border-gray-200 p-3 bg-gray-50 text-xs text-gray-500 flex-shrink-0">
          <p>Las categorías se sincronizan automáticamente con el Menú</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODAL DE GESTIÓN RÁPIDA DE MENÚ
// ============================================
const QuickMenuManager: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}> = ({ isOpen, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'inventory' | 'deleted'>('today');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const { getAllItems, createItem, updateItem, deleteItem, refreshMenu } = useMenu();
  const { categories: dbCategories, refreshCategories } = useCategories();
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    type: 'food' as 'food' | 'drink'
  });

  const allItems = useMemo(() => getAllItems(), [getAllItems, isOpen]);

  useEffect(() => {
    if (dbCategories.length > 0 && !newProduct.category) {
      setNewProduct(prev => ({ ...prev, category: dbCategories[0] }));
    }
  }, [dbCategories]);

  const todayItems = useMemo(() => allItems.filter(item => item.isDailySpecial && item.available), [allItems]);
  const inventoryItems = useMemo(() => allItems.filter(item => !item.isDailySpecial && item.available), [allItems]);
  const deletedItems = useMemo(() => allItems.filter(item => !item.available), [allItems]);

  const filteredInventoryItems = useMemo(() => {
    if (!inventorySearchTerm.trim()) return inventoryItems;
    
    const term = inventorySearchTerm.toLowerCase();
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.price.toString().includes(term)
    );
  }, [inventoryItems, inventorySearchTerm]);

  const handleRemoveFromToday = useCallback(async (itemId: string) => {
    setLoading(true);
    const result = await updateItem(itemId, { isDailySpecial: false });
    if (result.success) {
      onRefresh();
    }
    setLoading(false);
  }, [updateItem, onRefresh]);

  const handlePermanentDelete = useCallback(async (itemId: string, itemName: string) => {
    if (window.confirm(`¿Eliminar PERMANENTEMENTE "${itemName}"? Esta acción no se puede deshacer.`)) {
      setLoading(true);
      const result = await deleteItem(itemId);
      if (result.success) {
        onRefresh();
      }
      setLoading(false);
    }
  }, [deleteItem, onRefresh]);

  const handleAddToToday = useCallback(async (itemId: string) => {
    setLoading(true);
    const result = await updateItem(itemId, { isDailySpecial: true });
    if (result.success) {
      onRefresh();
    }
    setLoading(false);
  }, [updateItem, onRefresh]);

  const handleRestore = useCallback(async (itemId: string) => {
    setLoading(true);
    const result = await updateItem(itemId, { available: true });
    if (result.success) {
      onRefresh();
    }
    setLoading(false);
  }, [updateItem, onRefresh]);

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
      available: true,
      isDailySpecial: true
    });

    if (result.success) {
      setNewProduct({ 
        name: '', 
        price: '', 
        category: dbCategories[0] || '', 
        type: 'food' 
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
          <div className="bg-gradient-to-r from-red-500 to-amber-500 p-4 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings size={20} />
                <h2 className="text-lg font-bold">Gestión Rápida de Menú</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  title="Gestionar categorías"
                >
                  <Tag size={18} />
                </button>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200 p-2 flex-shrink-0">
            {[
              { id: 'today', label: `📋 Hoy (${todayItems.length})` },
              { id: 'inventory', label: `📦 Inventario (${inventoryItems.length})` },
              { id: 'deleted', label: `🗑️ Eliminados (${deletedItems.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setInventorySearchTerm('');
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
              </div>
            )}

            {!loading && activeTab === 'today' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Productos activos hoy:</p>
                {todayItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-gray-600 ml-2">S/ {item.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 ml-2">({item.category})</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFromToday(item.id)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors ml-2 flex-shrink-0"
                      title="Quitar del menú de hoy"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                {todayItems.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No hay productos en el menú de hoy</p>
                )}
              </div>
            )}

            {!loading && activeTab === 'inventory' && (
              <div className="space-y-3">
                <div className="relative sticky top-0 bg-white pt-1 pb-2 z-10">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={inventorySearchTerm}
                    onChange={(e) => setInventorySearchTerm(e.target.value)}
                    placeholder="Buscar en inventario por nombre, categoría o precio..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    autoFocus={activeTab === 'inventory'}
                  />
                  {inventorySearchTerm && (
                    <button
                      onClick={() => setInventorySearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-600 px-1">
                  {filteredInventoryItems.length} producto(s) encontrado(s)
                </p>

                <div className="space-y-2 pb-2">
                  {filteredInventoryItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm block truncate">{item.name}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-semibold text-red-600">S/ {item.price.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">({item.category})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToToday(item.id)}
                        className="text-xs bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1 ml-2 flex-shrink-0"
                      >
                        <Plus size={12} />
                        <span>Agregar hoy</span>
                      </button>
                    </div>
                  ))}
                </div>

                {filteredInventoryItems.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl text-gray-300 mb-2">🔍</div>
                    <p className="text-gray-500">No se encontraron productos</p>
                    {inventorySearchTerm && (
                      <button
                        onClick={() => setInventorySearchTerm('')}
                        className="text-sm text-red-500 hover:text-red-700 mt-2"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'deleted' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Productos eliminados (ocultos):</p>
                {deletedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block truncate">{item.name}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs font-semibold text-red-600">S/ {item.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">({item.category})</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-2 flex-shrink-0">
                      <button
                        onClick={() => handleRestore(item.id)}
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(item.id, item.name)}
                        className="text-xs bg-red-700 text-white px-2 py-1 rounded-lg hover:bg-red-800 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {deletedItems.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No hay productos eliminados</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
            {!showNewProductForm ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowNewProductForm(true)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span>Nuevo producto</span>
                </button>
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Actualizar"
                >
                  <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateProduct} className="space-y-3">
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Nombre del producto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  autoFocus
                  disabled={loading}
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="Precio"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    disabled={loading}
                  />
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    disabled={loading || dbCategories.length === 0}
                  >
                    {dbCategories.length === 0 ? (
                      <option value="">Cargando...</option>
                    ) : (
                      dbCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading || !newProduct.category}
                    className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewProductForm(false)}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        categories={dbCategories}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
};

// ============================================
// FUNCIÓN PARA LIMITAR NOMBRES LARGOS
// ============================================
const limitNameLength = (fullName: string): string => {
  if (fullName.length > 35) {
    const parts = fullName.split(',');
    
    if (parts.length >= 2) {
      const lastName = parts[0].trim();
      const firstNames = parts[1].trim().split(' ');
      
      if (firstNames.length >= 2) {
        return `${lastName}, ${firstNames[0]}`;
      }
    }
    
    return fullName.substring(0, 35) + '...';
  }
  return fullName;
};

// ============================================
// COMPONENTE PRINCIPAL ORDER RECEPTION
// ============================================
const OrderReception: React.FC = React.memo(() => {
  const [activeTab, setActiveTab] = useState<'phone' | 'walk-in' | 'delivery' | 'fullDay' | 'oep'>('phone');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA'>('EFECTIVO');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showMenuManager, setShowMenuManager] = useState(false);
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedGrade, setSelectedGrade] = useState<Grade>(GRADES[0]);
  const [selectedSection, setSelectedSection] = useState<Section>(SECTIONS[0]);
  const [studentName, setStudentName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const studentSuggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { customers } = useCustomers();
  const { getDailySpecialsByCategory, getAllDailySpecials, refreshMenu } = useMenu();
  const { categories: dbCategories, refreshCategories } = useCategories();
  const { createOrder } = useOrders();
  const { createOrder: createFullDayOrder } = useFullDay();
  const { createOrder: createOEPOrder } = useOEP(); // <-- NUEVO HOOK OEP
  const { searchStudents, searchResults } = useStudents();

  const isAdmin = user?.role === 'admin';

  const categories = useMemo(() => dbCategories, [dbCategories]);
  
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
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
      const searchLower = customerSearchTerm.toLowerCase();
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phone.includes(customerSearchTerm)
      ).slice(0, 5);
      
      setCustomerSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  }, [customerSearchTerm, customers, activeTab]);

  useEffect(() => {
    if (studentSearchTerm.trim().length > 1 && activeTab === 'fullDay') {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (studentSuggestionsRef.current && !studentSuggestionsRef.current.contains(event.target as Node)) {
        setShowStudentSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const selectCustomer = useCallback((customer: any) => {
    setCustomerName(customer.name);
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setCustomerSearchTerm('');
    setShowSuggestions(false);
    showToast(`Cliente seleccionado`, 'success');
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
    showToast(`Alumno seleccionado`, 'success');
  }, [showToast]);

  const handleCustomerSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setCustomerName(value);
  }, []);

  const handleStudentSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStudentSearchTerm(value);
    setStudentName(value);
  }, []);

  const addToCart = useCallback((menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        showToast(`${menuItem.name} +1`, 'success');
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1, menuItem }
            : item
        );
      }
      showToast(`${menuItem.name} añadido`, 'success');
      return [...prev, { menuItem, quantity: 1, notes: '' }];
    });
  }, [showToast]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => {
      const itemToRemove = prev.find(item => item.menuItem.id === itemId);
      if (itemToRemove) showToast(`${itemToRemove.menuItem.name} eliminado del carrito`, 'info');
      return prev.filter(item => item.menuItem.id !== itemId);
    });
  }, [showToast]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.menuItem.id === itemId ? { ...item, quantity } : item
    ));
  }, [removeFromCart]);

  const handlePriceChange = useCallback((itemId: string, newPrice: number) => {
    setCart(prev => prev.map(item => 
      item.menuItem.id === itemId 
        ? { ...item, menuItem: { ...item.menuItem, price: newPrice } }
        : item
    ));
    showToast(`Precio actualizado`, 'info');
  }, [showToast]);

  const getTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  }, [cart]);

  const totalItems = useMemo(() => 
    cart.reduce((total, item) => total + item.quantity, 0), 
    [cart]
  );

  const handleCategoryChange = useCallback((category: string) => setActiveCategory(category), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value), []);
  const handlePaymentMethodChange = useCallback((method: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA') => setPaymentMethod(method), []);
  const handleShowCartDrawer = useCallback((show: boolean) => setShowCartDrawer(show), []);
  
  const clearCart = useCallback(() => {
    if (cart.length > 0 && window.confirm('¿Vaciar carrito?')) {
      setCart([]);
      showToast('Carrito vaciado', 'info');
    }
  }, [cart.length, showToast]);

  // ============================================
  // FUNCIÓN GENERATE TICKET CONTENT
  // ============================================
  const generateTicketContent = useCallback((order: Order, isKitchenTicket: boolean) => {
    const getCurrentUserName = () => {
      try {
        const savedUser = localStorage.getItem('restaurant-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          return userData.name || 'Sistema';
        }
      } catch (error) {
        console.error('Error obteniendo usuario:', error);
      }
      return 'Sistema';
    };

    if (isKitchenTicket) {
      return `
        <div class="ticket">
          <div class="center">
            <div class="header-title uppercase" style="font-size: 16px; margin-bottom: 5px;">${order.customerName.toUpperCase()}</div>
            <div class="header-title">** COCINA **</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="label">CLIENTE:</span>
            <span class="customer-name-bold">${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">AREA:</span>
            <span class="value">COCINA</span>
          </div>
          <div class="info-row">
            <span class="label">COMANDA:</span>
            <span class="value">#${order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`}</span>
          </div>
          <div class="info-row">
            <span class="label">FECHA:</span>
            <span class="value">${order.createdAt.toLocaleDateString('es-ES')} - ${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span class="label">ATENDIDO POR:</span>
            <span class="value">${getCurrentUserName().toUpperCase()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="products-header">DESCRIPCION</div>
          
          <div class="divider"></div>
          
          ${order.items.map(item => `
            <div class="product-row">
              <div class="quantity">${item.quantity}x</div>
              <div class="product-name bold">${item.menuItem.name.toUpperCase()}</div>
            </div>
            ${item.notes && item.notes.trim() !== '' ? `<div class="notes">- ${item.notes}</div>` : ''}
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="asterisk-line">********************************</div>
          </div>
        </div>
      `;
    } else {
      const subtotal = order.total / 1.10;
      const igv = order.total - subtotal;
      
      let customerInfo = '';
      
      if (order.source.type === 'fullDay' && order.studentInfo) {
        const limitedStudentName = limitNameLength(order.studentInfo.fullName);
        const limitedGuardianName = limitNameLength(order.studentInfo.guardianName);
        
        customerInfo = `
          <div class="info-row">
            <span class="label">ALUMNO:</span>
            <span class="customer-name-bold">${limitedStudentName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">GRADO:</span>
            <span class="value">${order.studentInfo.grade} "${order.studentInfo.section}"</span>
          </div>
          <div class="info-row">
            <span class="label">APODERADO:</span>
            <span class="value">${limitedGuardianName.toUpperCase()}</span>
          </div>
          ${order.phone ? `
          <div class="info-row">
            <span class="label">TELÉFONO:</span>
            <span class="value">${order.phone}</span>
          </div>
          ` : ''}
        `;
      } else {
        customerInfo = `
          <div class="info-row">
            <span class="label">CLIENTE:</span>
            <span class="customer-name-bold">${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">TELÉFONO:</span>
            <span class="value">${order.phone}</span>
          </div>
        `;
      }
      
      return `
        <div class="ticket">
          <div class="center">
            <div class="header-title" style="font-size: 14px;">MARY'S RESTAURANT</div>
            <div class="header-subtitle">INVERSIONES AROMO S.A.C.</div>
            <div class="header-subtitle">RUC: 20505262086</div>
            <div class="header-subtitle">AV. ISABEL LA CATOLICA 1254</div>
            <div class="header-subtitle">Tel: 941 778 599</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="label">ORDEN:</span>
            <span class="value">${order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`}</span>
          </div>
          <div class="info-row">
            <span class="label">TIPO:</span>
            <span class="value">${order.source.type === 'phone' ? 'COCINA' : order.source.type === 'walk-in' ? 'LOCAL' : order.source.type === 'delivery' ? 'DELIVERY' : 'FULLDAY'}</span>
          </div>
          <div class="info-row">
            <span class="label">FECHA:</span>
            <span class="value">${order.createdAt.toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="label">HORA:</span>
            <span class="value">${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span class="label">PAGO:</span>
            <span class="value">${order.paymentMethod || 'NO APLICA'}</span>
          </div>
          
          <div class="divider"></div>
          
          ${customerInfo}
          
          ${order.address ? `
          <div class="info-row">
            <span class="label">DIRECCIÓN:</span>
            <span class="value" style="max-width: 60%; word-wrap: break-word;">${order.address}</span>
          </div>
          ` : ''}
          ${order.tableNumber ? `
          <div class="info-row">
            <span class="label">MESA:</span>
            <span class="value">${order.tableNumber}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Cant</th>
                <th>Descripción</th>
                <th style="text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td class="quantity" style="vertical-align: top;">${item.quantity}x</td>
                  <td style="vertical-align: top;">
                    <div class="product-name bold">${item.menuItem.name}</div>
                    ${item.notes && item.notes.trim() !== '' ? `<div class="table-notes">Nota: ${item.notes}</div>` : ''}
                  </td>
                  <td style="text-align: right; vertical-align: top;">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div style="font-size: 11px;">
            <div class="info-row">
              <span class="normal">Subtotal:</span>
              <span class="normal">S/ ${subtotal.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="normal">IGV (10%):</span>
              <span class="normal">S/ ${igv.toFixed(2)}</span>
            </div>
            <div class="info-row" style="border-top: 2px solid #000; padding-top: 5px; margin-top: 5px;">
              <span class="label">TOTAL:</span>
              <span class="label">S/ ${order.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="header-title">¡GRACIAS POR SU PEDIDO!</div>
            <div class="normal">*** ${order.source.type === 'phone' ? 'COCINA' : order.source.type === 'walk-in' ? 'LOCAL' : order.source.type === 'delivery' ? 'DELIVERY' : 'FULLDAY'} ***</div>
            <div class="normal" style="margin-top: 10px; font-size: 10px;">
              ${new Date().toLocaleString('es-ES', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      `;
    }
  }, []);

  const printOrderImmediately = useCallback((order: Order) => {
    const isPhoneOrder = order.source.type === 'phone';
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);

    const ticketContent = generateTicketContent(order, isPhoneOrder);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket ${isPhoneOrder ? (order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`) : (order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`)}</title>
            <style>
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                  padding: 0;
                }
                body {
                  width: 80mm !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                  font-size: 12px !important;
                  font-family: "Helvetica", "Arial", sans-serif !important;
                  font-weight: normal !important;
                }
                * {
                  font-family: inherit !important;
                }
              }
              body {
                font-family: "Helvetica", "Arial", sans-serif;
                font-weight: normal;
                font-size: 12px;
                line-height: 1.2;
                width: 80mm;
                margin: 0 auto;
                padding: 8px;
                background: white;
                color: black;
              }
              .ticket, .ticket *, div, span, td, th {
                font-family: "Helvetica", "Arial", sans-serif !important;
              }
              .center {
                text-align: center;
              }
              .bold {
                font-weight: bold !important;
              }
              .normal {
                font-weight: normal !important;
              }
              .uppercase {
                text-transform: uppercase;
              }
              .divider {
                border-top: 1px solid #000;
                margin: 6px 0;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
              }
              .label {
                font-weight: bold !important;
              }
              .value {
                font-weight: normal !important;
              }
              .customer-name-bold {
                font-weight: bold !important;
                max-width: 70%;
                word-wrap: break-word;
              }
              .header-title {
                font-weight: bold !important;
              }
              .header-subtitle {
                font-weight: normal !important;
              }
              .notes {
                font-style: italic;
                font-size: 10px;
                margin-left: 15%;
                margin-bottom: 3px;
                display: block;
                width: 85%;
                font-weight: normal !important;
              }
              .table-notes {
                font-style: italic;
                font-size: 10px;
                margin-left: 0;
                margin-top: 2px;
                display: block;
                font-weight: normal !important;
              }
              .products-header {
                text-align: center;
                font-weight: bold !important;
                margin: 6px 0;
                text-transform: uppercase;
                border-bottom: 1px solid #000;
                padding-bottom: 3px;
              }
              .product-row {
                display: flex;
                margin-bottom: 4px;
              }
              .quantity {
                width: 15%;
                font-weight: bold !important;
              }
              .product-name {
                width: 85%;
                font-weight: bold !important;
                text-transform: uppercase;
              }
              .asterisk-line {
                text-align: center;
                font-size: 9px;
                letter-spacing: 1px;
                margin: 3px 0;
                font-weight: normal !important;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
              }
              th, td {
                padding: 2px 0;
                text-align: left;
                vertical-align: top;
              }
              th {
                border-bottom: 1px solid #000;
                font-weight: bold !important;
              }
              .notes-row td {
                padding-top: 0;
                padding-bottom: 3px;
              }
            </style>
          </head>
          <body>
            ${ticketContent}
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 50);
    }
  }, [generateTicketContent]);

  const handleCreateOrder = useCallback(async () => {
    if (cart.length === 0) {
      showToast('El pedido está vacío', 'error');
      return;
    }

    if (activeTab === 'fullDay') {
      if (!studentName || !guardianName) {
        showToast('Completa los datos del alumno', 'error');
        return;
      }
    } else if (activeTab === 'oep' || activeTab === 'phone' || activeTab === 'walk-in' || activeTab === 'delivery') {
      if (!customerName || !phone) {
        showToast('Completa los datos del cliente', 'error');
        return;
      }
    }

    if (activeTab === 'walk-in' && !tableNumber) {
      showToast('Ingresa el número de mesa', 'error');
      return;
    }

    if ((activeTab === 'walk-in' || activeTab === 'delivery' || activeTab === 'fullDay' || activeTab === 'oep' || activeTab === 'phone') && !paymentMethod) {
      showToast('Selecciona un método de pago', 'error');
      return;
    }

    if (isCreatingOrder) return;

    setIsCreatingOrder(true);

    try {
      const total = getTotal();
      
      if (activeTab === 'fullDay') {
        const result = await createFullDayOrder({
          student_id: selectedStudentId,
          student_name: studentName,
          grade: selectedGrade,
          section: selectedSection,
          guardian_name: guardianName,
          phone: phone || undefined,
          items: cart.map(item => ({
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
            },
            quantity: item.quantity,
            notes: item.notes,
          })),
          payment_method: paymentMethod,
          notes: orderNotes
        });

        if (result.success) {
          showToast('✅ Pedido FullDay guardado', 'success');
          
          const tempOrder: Order = {
            id: 'temp-' + Date.now(),
            orderNumber: `FLD-${Date.now().toString().slice(-8)}`,
            items: cart,
            status: 'pending',
            createdAt: new Date(),
            total: total,
            customerName: studentName,
            phone: phone || 'Sin teléfono',
            source: { type: 'fullDay' },
            notes: orderNotes,
            paymentMethod: paymentMethod,
            studentInfo: {
              fullName: studentName,
              grade: selectedGrade,
              section: selectedSection,
              guardianName: guardianName,
              phone: phone
            },
            orderType: 'fullday',
            igvRate: 10
          };
          
          printOrderImmediately(tempOrder);
        } else {
          showToast('❌ Error al guardar: ' + result.error, 'error');
        }
      }
      // ============================================
      // CASO 2: PEDIDO OEP (oep) - USA OEP
      // ============================================
      else if (activeTab === 'oep') {
        console.log('📦 Creando pedido OEP con datos:', {
          customer_name: customerName,
          phone: phone,
          address: address || undefined,
          items: cart.map(item => ({
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
            },
            quantity: item.quantity,
            notes: item.notes,
          })),
          payment_method: paymentMethod,
          notes: orderNotes
        });

        const result = await createOEPOrder({
          customer_name: customerName,
          phone: phone,
          address: address || undefined,
          items: cart.map(item => ({
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
            },
            quantity: item.quantity,
            notes: item.notes,
          })),
          payment_method: paymentMethod,
          notes: orderNotes
        });

        if (result.success) {
          showToast('✅ Pedido OEP guardado', 'success');

          // Orden temporal para imprimir ticket
          const tempOrder: Order = {
            id: 'temp-' + Date.now(),
            orderNumber: `OEP-${Date.now().toString().slice(-8)}`,
            kitchenNumber: `COM-${Date.now().toString().slice(-8)}`,
            items: cart,
            status: 'pending',
            createdAt: new Date(),
            total: total,
            customerName: customerName,
            phone: phone,
            address: address,
            source: { type: 'oep' },
            notes: orderNotes,
            paymentMethod: paymentMethod,
            orderType: 'regular',
            igvRate: 10
          };
          printOrderImmediately(tempOrder);
          // Notificar al OEPOrdersManager que hay un nuevo pedido OEP
          window.dispatchEvent(new CustomEvent('newOrderCreated', {
            detail: { ...tempOrder, orderType: 'oep', source: { type: 'oep' } }
          }));
        } else {
          showToast('❌ Error al guardar: ' + result.error, 'error');
        }
      }
      // ============================================
      // CASO 3: PEDIDO DE COCINA (phone) - AHORA USA OEP
      // ============================================
      else if (activeTab === 'phone') {
        console.log('📞 Creando pedido de COCINA (OEP) con datos:', {
          customer_name: customerName,
          phone: phone,
          address: address || undefined,
          items: cart.map(item => ({
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
            },
            quantity: item.quantity,
            notes: item.notes,
          })),
          payment_method: paymentMethod,
          notes: orderNotes
        });

        const result = await createOEPOrder({
          customer_name: customerName,
          phone: phone,
          address: address || undefined,
          items: cart.map(item => ({
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
            },
            quantity: item.quantity,
            notes: item.notes,
          })),
          payment_method: paymentMethod,
          notes: orderNotes
        });

        if (result.success) {
          showToast('✅ Pedido de Cocina (OEP) guardado', 'success');

          // Orden temporal para imprimir ticket
          const tempOrder: Order = {
            id: 'temp-' + Date.now(),
            orderNumber: `OEP-${Date.now().toString().slice(-8)}`,
            kitchenNumber: `COM-${Date.now().toString().slice(-8)}`,
            items: cart,
            status: 'pending',
            createdAt: new Date(),
            total: total,
            customerName: customerName,
            phone: phone,
            address: address,
            source: { type: 'phone' },
            notes: orderNotes,
            paymentMethod: paymentMethod,
            orderType: 'regular',
            igvRate: 10
          };
          printOrderImmediately(tempOrder);
          // Notificar al OEPOrdersManager que hay un nuevo pedido de Cocina
          window.dispatchEvent(new CustomEvent('newOrderCreated', {
            detail: { ...tempOrder, orderType: 'oep', source: { type: 'phone' } }
          }));
        } else {
          showToast('❌ Error al guardar: ' + result.error, 'error');
        }
      }
      // ============================================
      // CASO 4: OTROS PEDIDOS (walk-in, delivery) - Van a pedidos regulares
      // ============================================
      else {
        const orderData: any = {
          customerName: customerName,
          phone: phone,
          address: activeTab === 'delivery' ? address : undefined,
          tableNumber: activeTab === 'walk-in' ? tableNumber : undefined,
          source: {
            type: activeTab,
            ...(activeTab === 'delivery' && { deliveryAddress: address })
          },
          notes: orderNotes,
          paymentMethod: paymentMethod,
          items: cart.map(item => ({
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
            },
            quantity: item.quantity,
            notes: item.notes,
          })),
          orderType: 'regular'
        };

        const tempOrder: Order = {
          id: 'temp-' + Date.now(),
          orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
          kitchenNumber: undefined,
          items: cart,
          status: 'pending',
          createdAt: new Date(),
          total: total,
          customerName: customerName,
          phone: phone,
          address: address,
          tableNumber: tableNumber,
          source: orderData.source,
          notes: orderNotes,
          paymentMethod: paymentMethod,
          orderType: 'regular',
          igvRate: 10
        };

        printOrderImmediately(tempOrder);

        const result = await createOrder(orderData);

        if (result.success) {
          showToast('✅ Orden guardada', 'success');
        } else {
          showToast('❌ Error al guardar: ' + result.error, 'error');
        }
      }
      
      // Limpiar formulario después de guardar
      setCart([]);
      setCustomerName('');
      setPhone('');
      setAddress('');
      setTableNumber('');
      setOrderNotes('');
      setCustomerSearchTerm('');
      setStudentName('');
      setGuardianName('');
      setStudentSearchTerm('');
      setSelectedStudentId(null);
      setShowCartDrawer(false);
      
    } catch (error: any) {
      showToast('❌ Error: ' + error.message, 'error');
      console.error('Error in handleCreateOrder:', error);
    } finally {
      setIsCreatingOrder(false);
    }
  }, [
    cart, customerName, phone, activeTab, tableNumber, address, orderNotes, 
    paymentMethod, createOrder, createFullDayOrder, createOEPOrder,
    getTotal, showToast, printOrderImmediately, isCreatingOrder, 
    studentName, guardianName, selectedGrade, selectedSection, selectedStudentId
  ]);

  const isFormValid = useMemo(() => {
    if (cart.length === 0) return false;
    
    if (activeTab === 'fullDay') {
      return studentName && guardianName;
    }
    
    if (activeTab === 'walk-in') {
      return customerName && phone && tableNumber;
    }
    
    if (activeTab === 'delivery' || activeTab === 'oep' || activeTab === 'phone') {
      return customerName && phone;
    }
    
    return customerName && phone;
  }, [cart, activeTab, customerName, phone, tableNumber, studentName, guardianName]);

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 pb-20 lg:pb-6">
        {toast && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <QuickMenuManager
          isOpen={showMenuManager}
          onClose={() => setShowMenuManager(false)}
          onRefresh={() => {
            refreshMenu();
            refreshCategories();
          }}
        />

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Header Móvil */}
          <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-red-200">
            <div className="px-3 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Recepción</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as any)}
                      className="text-xs bg-gray-100 rounded-lg px-2 py-1 border border-gray-300"
                    >
                      <option value="phone">📞 Cocina (OEP)</option>
                      <option value="oep">📦 OEP</option>
                      <option value="walk-in">👤 Local</option>
                      <option value="delivery">🚚 Delivery</option>
                      <option value="fullDay">🎒 FullDay</option>
                    </select>
                    
                    {isAdmin && (
                      <button
                        onClick={() => setShowMenuManager(true)}
                        className="p-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Gestionar menú"
                      >
                        <Settings size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleShowCartDrawer(true)}
                  className="relative bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2"
                >
                  <ShoppingBag size={20} />
                  <div className="text-left">
                    <div className="text-xs font-medium">Pedido</div>
                    <div className="text-xs opacity-90">{totalItems} items</div>
                  </div>
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white product-counter">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Contenido Móvil */}
          <div className="lg:hidden px-3 pt-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                {activeTab === 'fullDay' ? 'Datos del Alumno' : 'Datos del Cliente'}
              </h3>
              
              <div className="space-y-3">
                {activeTab === 'fullDay' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grado y Sección *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={selectedGrade}
                          onChange={(e) => setSelectedGrade(e.target.value as Grade)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {GRADES.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                        <select
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value as Section)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {SECTIONS.map(section => (
                            <option key={section} value={section}>"{section}"</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={studentSearchTerm}
                        onChange={handleStudentSearchChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Buscar alumno por nombre..."
                      />
                      {showStudentSuggestions && studentSearchResults.length > 0 && (
                        <div 
                          ref={studentSuggestionsRef}
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {studentSearchResults.map((student) => (
                            <div
                              key={student.id}
                              onMouseDown={() => selectStudent(student)}
                              className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100"
                            >
                              <div className="font-medium text-gray-900 text-sm">{student.full_name}</div>
                              <div className="text-gray-600 text-xs">
                                {student.grade} "{student.section}" - Apoderado: {student.guardian_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
                      placeholder="Nombre del alumno"
                      readOnly
                    />

                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Nombre del apoderado *"
                      required
                    />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Teléfono (opcional)"
                    />
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={customerSearchTerm}
                        onChange={handleCustomerSearchChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Buscar cliente por nombre o teléfono..."
                        required
                      />
                      {showSuggestions && customerSuggestions.length > 0 && (
                        <div 
                          ref={suggestionsRef}
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {customerSuggestions.map((customer) => (
                            <div
                              key={customer.id}
                              onMouseDown={() => selectCustomer(customer)}
                              className="p-3 hover:bg-red-50 cursor-pointer border-b border-gray-100"
                            >
                              <div className="font-medium text-gray-900 text-sm">{customer.name}</div>
                              <div className="text-gray-600 text-xs">📞 {customer.phone}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50"
                      placeholder="Nombre del cliente"
                      readOnly
                    />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Teléfono *"
                      required
                    />

                    {activeTab === 'walk-in' && (
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Número de mesa *"
                        required
                      />
                    )}

                    {(activeTab === 'delivery' || activeTab === 'oep' || activeTab === 'phone') && (
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Dirección (opcional)"
                      />
                    )}
                  </>
                )}

                {(activeTab === 'walk-in' || activeTab === 'delivery' || activeTab === 'fullDay' || activeTab === 'oep' || activeTab === 'phone') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'EFECTIVO', label: '💵', color: 'bg-green-500' },
                        { value: 'YAPE/PLIN', label: '📱', color: 'bg-purple-500' },
                        { value: 'TARJETA', label: '💳', color: 'bg-blue-500' }
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => handlePaymentMethodChange(method.value as any)}
                          className={`p-2 rounded-lg text-white font-medium text-xs transition-all ${
                            paymentMethod === method.value 
                              ? `${method.color} shadow-md transform scale-105` 
                              : 'bg-gray-300 text-gray-600'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">Menú del Día</h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowMenuManager(true)}
                    className="text-xs bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1"
                  >
                    <Settings size={12} />
                    <span>Gestionar</span>
                  </button>
                )}
              </div>
              
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                placeholder="Buscar productos..."
              />

              {/* BARRA DE CATEGORÍAS MEJORADA */}
              {!searchTerm && categories.length > 0 && (
                <div className="categories-container">
                  <div className="categories-scroll">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`category-button ${
                          activeCategory === category
                            ? 'category-button-active'
                            : 'category-button-inactive'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {currentItems.map((item: MenuItem) => {
                  const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  
                  return (
                    <MenuProduct
                      key={item.id}
                      item={item}
                      quantityInCart={quantityInCart}
                      onAddToCart={addToCart}
                      onUpdateQuantity={updateQuantity}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {showCartDrawer && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => handleShowCartDrawer(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Tu Pedido</h3>
                      <p className="text-sm text-gray-600">{totalItems} productos</p>
                    </div>
                    <button
                      onClick={() => handleShowCartDrawer(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Tu pedido está vacío</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {cart.map((item, index) => (
                          <CartItem
                            key={`${item.menuItem.id}-${index}`}
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                            onPriceChange={handlePriceChange}
                          />
                        ))}
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-red-600">
                            S/ {getTotal().toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={clearCart}
                          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                        >
                          Vaciar Carrito
                        </button>
                        <button
                          onClick={handleCreateOrder}
                          disabled={!isFormValid}
                          className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white py-4 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                        >
                          Confirmar Pedido
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="hidden lg:block">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeTab === 'fullDay' ? 'Nuevo Pedido FullDay' : 'Nuevo Pedido'}
                    </h2>
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="phone">📞 Cocina (OEP)</option>
                      <option value="oep">📦 OEP</option>
                      <option value="walk-in">👤 Local</option>
                      <option value="delivery">🚚 Delivery</option>
                      <option value="fullDay">🎒 FullDay</option>
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    {activeTab === 'fullDay' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grado y Sección *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={selectedGrade}
                              onChange={(e) => setSelectedGrade(e.target.value as Grade)}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              {GRADES.map(grade => (
                                <option key={grade} value={grade}>{grade} Grado</option>
                              ))}
                            </select>
                            <select
                              value={selectedSection}
                              onChange={(e) => setSelectedSection(e.target.value as Section)}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              {SECTIONS.map(section => (
                                <option key={section} value={section}>Sección "{section}"</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar alumno existente
                          </label>
                          <input
                            type="text"
                            value={studentSearchTerm}
                            onChange={handleStudentSearchChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Escribe para buscar..."
                          />
                          {showStudentSuggestions && studentSearchResults.length > 0 && (
                            <div 
                              ref={studentSuggestionsRef}
                              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                            >
                              {studentSearchResults.map((student) => (
                                <div
                                  key={student.id}
                                  onMouseDown={() => selectStudent(student)}
                                  className="p-2 hover:bg-purple-50 cursor-pointer border-b"
                                >
                                  <div className="font-medium">{student.full_name}</div>
                                  <div className="text-xs text-gray-500">
                                    {student.grade} "{student.section}" - {student.guardian_name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Alumno *
                          </label>
                          <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            placeholder="Se llena automáticamente"
                            readOnly
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Apoderado *
                          </label>
                          <input
                            type="text"
                            value={guardianName}
                            onChange={(e) => setGuardianName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ej: María Pérez"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono (Opcional)
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ej: 987654321"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar cliente</label>
                          <div className="relative mb-2">
                            <input
                              ref={inputRef}
                              type="text"
                              value={customerSearchTerm}
                              onChange={handleCustomerSearchChange}
                              placeholder="Buscar por nombre o teléfono..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            {showSuggestions && customerSuggestions.length > 0 && (
                              <div 
                                ref={suggestionsRef}
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                              >
                                {customerSuggestions.map((customer) => (
                                  <div
                                    key={customer.id}
                                    onMouseDown={() => selectCustomer(customer)}
                                    className="p-2 hover:bg-red-50 cursor-pointer border-b border-gray-100"
                                  >
                                    <div className="font-medium text-gray-900 text-sm">{customer.name}</div>
                                    <div className="text-gray-600 text-xs">📞 {customer.phone}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Se llena automáticamente"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            readOnly
                          />
                        </div>

                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Teléfono *"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />

                        {activeTab === 'walk-in' && (
                          <input
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="Mesa *"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        )}

                        {(activeTab === 'delivery' || activeTab === 'oep' || activeTab === 'phone') && (
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Dirección (opcional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        )}
                      </>
                    )}

                    {(activeTab === 'walk-in' || activeTab === 'delivery' || activeTab === 'fullDay' || activeTab === 'oep' || activeTab === 'phone') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pago</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['EFECTIVO', 'YAPE/PLIN', 'TARJETA'].map(method => (
                            <button
                              key={method}
                              onClick={() => handlePaymentMethodChange(method as any)}
                              className={`p-2 rounded-lg text-xs font-medium ${
                                paymentMethod === method
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {method === 'EFECTIVO' ? '💵' : method === 'YAPE/PLIN' ? '📱' : '💳'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-1">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Menú</h2>
                    {isAdmin && (
                      <button
                        onClick={() => setShowMenuManager(true)}
                        className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1"
                      >
                        <Settings size={14} />
                        <span>Gestionar</span>
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Buscar..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                  />

                  {/* BARRA DE CATEGORÍAS MEJORADA EN DESKTOP */}
                  {!searchTerm && categories.length > 0 && (
                    <div className="categories-container">
                      <div className="categories-scroll">
                        {categories.map(category => (
                          <button
                            key={category}
                            onClick={() => handleCategoryChange(category)}
                            className={`category-button ${
                              activeCategory === category
                                ? 'category-button-active'
                                : 'category-button-inactive'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                    {currentItems.map((item: MenuItem) => {
                      const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
                      const quantityInCart = cartItem ? cartItem.quantity : 0;
                      
                      return (
                        <MenuProduct
                          key={item.id}
                          item={item}
                          quantityInCart={quantityInCart}
                          onAddToCart={addToCart}
                          onUpdateQuantity={updateQuantity}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="col-span-1">
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
                        {cart.map((item, index) => (
                          <CartItem
                            key={`${item.menuItem.id}-${index}`}
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                            onPriceChange={handlePriceChange}
                          />
                        ))}
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Total:</span>
                          <span className="text-xl font-bold text-red-600">
                            S/ {getTotal().toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={clearCart}
                          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mb-2"
                        >
                          Vaciar
                        </button>
                        <button
                          onClick={handleCreateOrder}
                          disabled={!isFormValid}
                          className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white py-3 rounded-lg hover:shadow-md disabled:opacity-50 font-semibold"
                        >
                          Confirmar
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
----------------------------------------

ARCHIVO: restaurant-dashboard-main/src/components/orders/OrdersManager.tsx
Tamaño: 35.64 KB
Tipo: application/typescript+jsx
Contenido:
----------------------------------------
// ============================================
// ARCHIVO: src/components/orders/OrdersManager.tsx
// CON FILTRO POR ÁREA Y SELECTOR DE FECHA ESTILO FULLDAY
// SIN TARJETAS DE ESTADÍSTICAS
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Pencil, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Order } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { usePagination, isDesktopPagination, isMobilePagination } from '../../hooks/usePagination';
import { PaginationControls } from '../ui/PaginationControls';
import { OrderPreview } from './OrderPreview';
import OrderTicket from './OrderTicket';
import { exportOrdersToExcel, exportOrdersByDateRange } from '../../utils/exportUtils';
import { generateTicketSummary, printResumenTicket } from '../../utils/ticketUtils';
import { useSalesClosure } from '../../hooks/useSalesClosure';
import { CashRegisterModal } from '../sales/CashRegisterModal';
import { SalesHistory } from '../sales/SalesHistory';
import { PaymentMethodModal } from './PaymentMethodModal';
import { DateRangeModal } from './DateRangeModal';

// ============================================
// COMPONENTE DE SELECCIÓN DE FECHA (ESTILO FULLDAY)
// ============================================
const DateSelector: React.FC<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  showOnlyToday: boolean;
  onToggleShowOnlyToday: () => void;
}> = ({ selectedDate, onDateChange, showOnlyToday, onToggleShowOnlyToday }) => {
  
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Si showOnlyToday está activo, mostramos un selector simplificado
  if (showOnlyToday) {
    return (
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-2">
        <div className="flex items-center space-x-2">
          <Calendar size={18} className="text-gray-500" />
          <span className="font-medium text-gray-700">Hoy: {formatDate(new Date())}</span>
        </div>
        <button
          onClick={onToggleShowOnlyToday}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Ver todas las fechas
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Selector de fecha con flechas */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Día anterior"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
            <Calendar size={18} className="text-red-600" />
            <span className="font-medium text-red-800">
              {formatDate(selectedDate)}
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Día siguiente"
            disabled={isToday(selectedDate)}
          >
            <ChevronRight size={20} className={`${isToday(selectedDate) ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center space-x-2">
          {!isToday(selectedDate) && (
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Ver Hoy
            </button>
          )}
          <button
            onClick={onToggleShowOnlyToday}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Volver a "Solo Hoy"
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE MEMOIZADO PARA CADA FILA DE ORDEN
// ============================================
const OrderRow = React.memo(({
  order,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  onEditPayment,
  user,
  getDisplayNumber,
  getNumberType,
  getSourceText,
  getPaymentColor,
  getPaymentText,
  getAreaIcon
}: {
  order: Order;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onDelete: (orderId: string, displayNumber: string) => void;
  onEditPayment: (order: Order) => void;
  user: any;
  getDisplayNumber: (order: Order) => string;
  getNumberType: (order: Order) => string;
  getSourceText: (type: string) => string;
  getPaymentColor: (method?: string) => string;
  getPaymentText: (method?: string) => string;
  getAreaIcon: (type: string) => string;
}) => {
  const displayNumber = getDisplayNumber(order);
  const numberType = getNumberType(order);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEditPayment(order);
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer group relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-2 mb-1">
          <div className={`text-sm font-medium ${
            numberType === 'kitchen' ? 'text-green-600' : 'text-blue-600'
          }`}>
            {displayNumber}
          </div>
          {numberType === 'kitchen' ? (
            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
              COCINA
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              NORMAL
            </span>
          )}
        </div>
        <div className="font-medium text-gray-900">{order.customerName}</div>
        <div className="text-sm font-bold text-red-600">
          S/ {order.total.toFixed(2)}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="mb-1">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 items-center space-x-1">
            <span>{getAreaIcon(order.source.type)}</span>
            <span>{getSourceText(order.source.type)}</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.paymentMethod)}`}>
            {getPaymentText(order.paymentMethod)}
          </span>

          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee') && (
            <button
              onClick={handleEditClick}
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm border border-blue-300"
              title="Cambiar método de pago"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleTimeString()}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="text-sm text-gray-900">
          {order.items.length} producto(s)
        </div>
        <div className="text-xs text-gray-500 truncate max-w-xs">
          {order.items.map((item: any) => item.menuItem.name).join(', ')}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 text-sm font-medium">
        <div className="flex space-x-2">
          <OrderTicket order={order} />
          {user?.role === 'admin' && (
            <button
              onClick={() => onDelete(order.id, displayNumber)}
              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar orden"
            >
              🗑️
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const OrdersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>(''); // '' = todas, 'phone', 'walk-in', 'delivery'
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentSort, setCurrentSort] = useState('status-time');
  const [deletedOrder, setDeletedOrder] = useState<{id: string, number: string} | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open');
  const [showOnlyToday, setShowOnlyToday] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { user } = useAuth();
  const {
    orders,
    loading,
    deleteOrder,
    updateOrderPayment,
    exportOrdersToCSV,
    getTodayOrders,
    fetchOrders,
    getRegularOrders
  } = useOrders();

  const {
    cashRegister,
    loading: salesLoading,
    openCashRegister,
    closeCashRegister,
    getTodaySummary
  } = useSalesClosure();

  const regularOrders = useMemo(() => getRegularOrders(), [getRegularOrders, orders]);

  useEffect(() => {
    if (regularOrders.length > 0 && !isInitialized) {
      setLocalOrders(regularOrders);
      setIsInitialized(true);
    }
  }, [regularOrders, isInitialized]);

  useEffect(() => {
    const handleNewOrder = (event: CustomEvent) => {
      const newOrder = event.detail;
      if (newOrder.orderType !== 'fullday') {
        setLocalOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
      }
      setTimeout(() => fetchOrders(500), 100);
    };
    window.addEventListener('newOrderCreated', handleNewOrder as EventListener);
    return () => window.removeEventListener('newOrderCreated', handleNewOrder as EventListener);
  }, [fetchOrders]);

  useEffect(() => {
    if (regularOrders.length > 0) {
      setLocalOrders(prev => {
        const merged = [...regularOrders];
        const existingIds = new Set(merged.map(o => o.id));
        prev.forEach(order => {
          if (order.id.startsWith('temp-') && !existingIds.has(order.id)) merged.push(order);
        });
        return merged.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
  }, [regularOrders]);

  const sortOptions = useMemo(() => [
    { value: 'status-time',       label: '🔄 Estado + Tiempo' },
    { value: 'waiting-time',      label: '⏱️ Tiempo Espera' },
    { value: 'delivery-priority', label: '🚚 Delivery Priority' },
    { value: 'total-desc',        label: '💰 Mayor Monto' },
    { value: 'created-desc',      label: '📅 Más Recientes' },
    { value: 'created-asc',       label: '📅 Más Antiguas' },
  ], []);

  // Filtrar por fecha según el modo seleccionado
  const dateFilteredOrders = useMemo(() => {
    if (showOnlyToday) {
      // Modo "Solo Hoy" - usa la función existente
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return localOrders.filter(order => {
        const d = new Date(order.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else {
      // Modo selector de fecha - filtrar por la fecha seleccionada
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      return localOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
    }
  }, [localOrders, showOnlyToday, selectedDate]);

  const filteredAndSortedOrders = useMemo(() => {
    if (!dateFilteredOrders.length) return [];
    let filtered = dateFilteredOrders;

    // Filtrar por área
    if (areaFilter) {
      filtered = filtered.filter(o => o.source.type === areaFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.customerName?.toLowerCase().includes(term) ||
        o.orderNumber?.toLowerCase().includes(term) ||
        o.kitchenNumber?.toLowerCase().includes(term) ||
        o.phone?.includes(term)
      );
    }

    // Filtrar por método de pago
    if (paymentFilter) {
      filtered = filtered.filter(o => o.paymentMethod === paymentFilter);
    }

    // Ordenar
    if (filtered.length > 1) {
      filtered = [...filtered].sort((a, b) => {
        switch (currentSort) {
          case 'status-time': {
            const so: Record<string, number> = { pending: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 5 };
            if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status];
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          case 'waiting-time':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'delivery-priority': {
            const to: Record<string, number> = { delivery: 1, phone: 2, 'walk-in': 3 };
            return to[a.source.type] - to[b.source.type];
          }
          case 'total-desc':      return b.total - a.total;
          case 'created-desc':    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'created-asc':     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          default: return 0;
        }
      });
    }

    return filtered;
  }, [dateFilteredOrders, searchTerm, areaFilter, paymentFilter, currentSort]);

  const pagination = usePagination({
    items: filteredAndSortedOrders,
    itemsPerPage,
    mobileBreakpoint: 768
  });

  const getDisplayNumber = useCallback((order: Order) => {
    if (order.source.type === 'phone') return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  }, []);

  const getNumberType   = useCallback((order: Order) => order.source.type === 'phone' ? 'kitchen' : 'order', []);
  const getSourceText   = useCallback((t: string) => ({ phone: 'Teléfono', 'walk-in': 'Presencial', delivery: 'Delivery' }[t] || t), []);
  const getAreaIcon     = useCallback((t: string) => ({ phone: '🍳', 'walk-in': '👤', delivery: '🚚' }[t] || '📋'), []);
  
  const getPaymentColor = useCallback((m?: string) => ({
    'EFECTIVO':  'bg-green-100 text-green-800 border-green-200',
    'YAPE/PLIN': 'bg-purple-100 text-purple-800 border-purple-200',
    'TARJETA':   'bg-blue-100 text-blue-800 border-blue-200',
  }[m || ''] || 'bg-gray-100 text-gray-800 border-gray-200'), []);
  
  const getPaymentText  = useCallback((m?: string) => ({ EFECTIVO: 'EFECTIVO', 'YAPE/PLIN': 'YAPE/PLIN', TARJETA: 'TARJETA' }[m || ''] || 'NO APLICA'), []);

  const handleRowMouseEnter = useCallback((order: Order, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewOrder(order);
    setPreviewPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);
  const handleRowMouseLeave = useCallback(() => setPreviewOrder(null), []);

  const handleDeleteOrder = useCallback(async (orderId: string, orderNumber: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la orden ${orderNumber}?`)) {
      setLocalOrders(prev => prev.filter(o => o.id !== orderId));
      const result = await deleteOrder(orderId);
      if (result.success) {
        setDeletedOrder({ id: orderId, number: orderNumber });
        setTimeout(() => setDeletedOrder(null), 3000);
      }
    }
  }, [deleteOrder]);

  const handleEditPayment = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handleSavePaymentMethod = useCallback(async (orderId: string, newPaymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | undefined) => {
    try {
      const previousMethod = localOrders.find(o => o.id === orderId)?.paymentMethod;
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentMethod: newPaymentMethod } : o));
      const result = await updateOrderPayment(orderId, newPaymentMethod);
      if (!result.success) {
        setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentMethod: previousMethod } : o));
        alert('❌ Error al actualizar el método de pago: ' + result.error);
      } else {
        alert('✅ Método de pago actualizado correctamente');
      }
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      alert('❌ Error inesperado: ' + error.message);
    }
  }, [updateOrderPayment, localOrders]);

  const handleExportExcel = useCallback(async (startDate: Date, endDate: Date) => {
    if (exporting) return;
    setExporting(true);
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
    toast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generando reporte...</span></div>';
    document.body.appendChild(toast);
    try {
      const todaySummary = await getTodaySummary(regularOrders);
      console.log('📊 Resumen:', todaySummary);
      await exportOrdersByDateRange(regularOrders, startDate, endDate);
    } catch (error: any) {
      const errToast = document.createElement('div');
      errToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
      errToast.innerHTML = `<div>❌ Error: ${error.message}</div>`;
      document.body.appendChild(errToast);
      setTimeout(() => { if (document.body.contains(errToast)) document.body.removeChild(errToast); }, 3000);
    } finally {
      if (document.body.contains(toast)) document.body.removeChild(toast);
      setExporting(false);
    }
  }, [regularOrders, getTodaySummary, exporting]);

  const handlePrintTicket = useCallback((startDate: Date, endDate: Date) => {
    const filtered = regularOrders.filter(o => {
      const d = new Date(o.createdAt); d.setHours(0, 0, 0, 0);
      const s = new Date(startDate);   s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);     e.setHours(23, 59, 59, 999);
      return d >= s && d <= e;
    });
    if (!filtered.length) { alert('No hay órdenes en el rango seleccionado'); return; }
    printResumenTicket(generateTicketSummary(filtered, startDate, endDate), startDate, endDate);
  }, [regularOrders]);

  const handleExportTodayCSV  = useCallback(() => exportOrdersToCSV(getTodayOrders().filter(o => o.orderType !== 'fullday')), [getTodayOrders, exportOrdersToCSV]);
  const handleExportAllCSV    = useCallback(() => exportOrdersToCSV(regularOrders), [regularOrders, exportOrdersToCSV]);
  const handleExportTodayExcel= useCallback(() => exportOrdersToExcel(getTodayOrders().filter(o => o.orderType !== 'fullday'), 'today'), [getTodayOrders]);
  const handleExportAllExcel  = useCallback(() => exportOrdersToExcel(regularOrders, 'all'), [regularOrders]);

  const handleOpenCashRegister  = useCallback(() => { setCashModalType('open');  setShowCashModal(true); }, []);
  const handleCloseCashRegister = useCallback(() => { setCashModalType('close'); setShowCashModal(true); }, []);

  const handleCashConfirm = useCallback(async (data: { initialCash?: number; finalCash?: number; notes?: string }) => {
    if (cashModalType === 'open') {
      const result = await openCashRegister(data.initialCash!);
      if (result.success) { alert('✅ Caja abierta correctamente'); setShowCashModal(false); }
      else alert('❌ Error al abrir caja: ' + result.error);
    } else {
      const result = await closeCashRegister(regularOrders, data.finalCash!, data.notes || '');
      if (result.success) {
        alert('✅ Caja cerrada correctamente');
        setShowCashModal(false);
        const t = document.createElement('div');
        t.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
        t.innerHTML = `<div>✅ Cierre #${result.closure?.closure_number} guardado</div>`;
        document.body.appendChild(t);
        setTimeout(() => { if (document.body.contains(t)) document.body.removeChild(t); }, 3000);
      } else {
        alert('❌ Error al cerrar caja: ' + result.error);
      }
    }
  }, [cashModalType, openCashRegister, closeCashRegister, regularOrders]);

  const handleToggleHistory = useCallback(() => setShowHistory(prev => !prev), []);
  const handleToggleShowOnlyToday = useCallback(() => setShowOnlyToday(prev => !prev), []);
  const handleDateChange = useCallback((date: Date) => setSelectedDate(date), []);

  const handleClearFilters = useCallback(() => {
    setAreaFilter('');
    setPaymentFilter('');
    setSearchTerm('');
  }, []);

  const desktopProps = isDesktopPagination(pagination) ? {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    startIndex: pagination.startIndex,
    endIndex: pagination.endIndex,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
  } : {};

  const mobileProps = isMobilePagination(pagination) ? {
    hasMoreItems: pagination.hasMoreItems,
    loadedItems: pagination.loadedItems,
    onLoadMore: pagination.loadMore,
  } : {};

  // Determinar si hay filtros activos
  const hasActiveFilters = areaFilter !== '' || paymentFilter !== '' || searchTerm !== '';

  return (
    <div className="space-y-4 sm:space-y-6">

      {deletedOrder && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full">
          <span>Orden {deletedOrder.number} eliminada</span>
        </div>
      )}

      {previewOrder && (
        <OrderPreview order={previewOrder} isVisible={true} position={previewPosition} />
      )}

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
        order={selectedOrder}
        onSave={handleSavePaymentMethod}
      />

      <DateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onConfirmExcel={handleExportExcel}
        onConfirmTicket={handlePrintTicket}
      />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedOrders.length} órdenes encontradas
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">Caja: {cashRegister?.is_open ? 'Abierta' : 'Cerrada'}</span>
          </div>
          {!cashRegister?.is_open ? (
            <button onClick={handleOpenCashRegister} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Abrir Caja</button>
          ) : (
            <button onClick={handleCloseCashRegister} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">Cerrar Caja</button>
          )}
          <button onClick={handleToggleHistory} className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
            {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
          </button>
        </div>
      </div>

      {/* SELECTOR DE FECHA ESTILO FULLDAY */}
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        showOnlyToday={showOnlyToday}
        onToggleShowOnlyToday={handleToggleShowOnlyToday}
      />

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleExportTodayCSV} disabled={exporting} className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>CSV Hoy</span>
        </button>
        <button onClick={handleExportAllCSV} disabled={exporting} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>CSV Todo</span>
        </button>
        <button onClick={handleExportTodayExcel} disabled={exporting} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>Excel Hoy</span>
        </button>
        <button onClick={handleExportAllExcel} disabled={exporting} className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>Excel Todo</span>
        </button>
        <button onClick={() => setShowDateRangeModal(true)} disabled={exporting} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center space-x-1 disabled:opacity-50">
          <Download size={16} /><span>Reportes por Fechas</span>
          {exporting && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
        </button>
        <button onClick={() => { window.location.hash = '#reception'; }} className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-3 py-2 rounded-lg text-sm hover:from-red-600 hover:to-amber-600 flex items-center space-x-1" disabled={exporting}>
          <span>➕</span><span>Nueva Orden</span>
        </button>
      </div>

      <CashRegisterModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        type={cashModalType}
        cashRegister={cashRegister}
        todaySummary={undefined}
        onConfirm={handleCashConfirm}
        loading={salesLoading}
      />

      {showHistory && <SalesHistory />}

      {/* FILTROS - Buscar, Área, Método de Pago */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, teléfono..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              disabled={exporting}
            />
          </div>

          {/* Selector de Área */}
          <select 
            value={areaFilter} 
            onChange={(e) => setAreaFilter(e.target.value)} 
            className="px-3 py-2 border rounded-lg text-sm min-w-[140px]"
            disabled={exporting}
          >
            <option value="">📋 Todas las áreas</option>
            <option value="phone">🍳 Cocina</option>
            <option value="walk-in">👤 Local</option>
            <option value="delivery">🚚 Delivery</option>
          </select>

          {/* Selector de Método de Pago */}
          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)} 
            className="px-3 py-2 border rounded-lg text-sm min-w-[160px]"
            disabled={exporting}
          >
            <option value="">💰 Todos los pagos</option>
            <option value="EFECTIVO">💵 Efectivo</option>
            <option value="YAPE/PLIN">📱 Yape/Plin</option>
            <option value="TARJETA">💳 Tarjeta</option>
          </select>
        </div>

        {/* Indicadores de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {areaFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  📋 Área: {areaFilter === 'phone' ? 'Cocina' : areaFilter === 'walk-in' ? 'Local' : 'Delivery'}
                </span>
              )}
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
            <button
              onClick={handleClearFilters}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      <PaginationControls
        {...desktopProps}
        onPageChange={pagination.goToPage}
        {...mobileProps}
        isMobile={pagination.isMobile}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        onSortChange={setCurrentSort}
        currentSort={currentSort}
        sortOptions={sortOptions}
      />

      {/* TABLA */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading && !isInitialized ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando...</p>
          </div>
        ) : pagination.currentItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {showOnlyToday 
              ? 'No hay órdenes regulares para hoy' 
              : `No hay órdenes para el ${selectedDate.toLocaleDateString('es-PE')}`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente / Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área / Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagination.currentItems.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onMouseEnter={(e) => handleRowMouseEnter(order, e)}
                    onMouseLeave={handleRowMouseLeave}
                    onDelete={handleDeleteOrder}
                    onEditPayment={handleEditPayment}
                    user={user}
                    getDisplayNumber={getDisplayNumber}
                    getNumberType={getNumberType}
                    getSourceText={getSourceText}
                    getPaymentColor={getPaymentColor}
                    getPaymentText={getPaymentText}
                    getAreaIcon={getAreaIcon}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredAndSortedOrders.length > 0 && (
        <div className="bg-white rounded-lg p-4 border text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">Mostrando:</span>{' '}
              {isDesktopPagination(pagination) ? (
                <>{pagination.startIndex || 0}-{pagination.endIndex || 0} de {filteredAndSortedOrders.length} órdenes</>
              ) : (
                <>{pagination.loadedItems || 0} de {filteredAndSortedOrders.length} órdenes</>
              )}
            </div>
            <div>
              <span className="font-semibold">Total mostrado:</span> S/ {filteredAndSortedOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}
            </div>
          </div>
          {exporting && (
            <div className="mt-2 text-xs text-blue-600 flex items-center justify-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              Generando reporte, por favor espera...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
