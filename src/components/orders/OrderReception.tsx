import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, Minus, X, ShoppingBag, Trash2, Edit2, Check, DollarSign, 
  Settings, RotateCcw, Search, Tag, FolderPlus, Edit
} from 'lucide-react';
import { MenuItem, OrderItem, Order } from '../../types';
//import OrderTicket from './OrderTicket';
import { useMenu } from '../../hooks/useMenu';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { useStudents } from '../../hooks/useStudents';
import { useFullDay } from '../../hooks/useFullDay';
import { GRADES, SECTIONS, Grade, Section } from '../../types/student';
import { supabase } from '../../lib/supabase';

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
    <div className="bg-white rounded-lg p-2 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all relative group">
      {quantityInCart > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white z-10">
          {quantityInCart}
        </div>
      )}
      
      <div className="mb-1">
        <div className="font-semibold text-gray-900 text-xs mb-1 line-clamp-2 min-h-[2rem]">
          {item.name}
        </div>
        <div className="font-bold text-red-600 text-sm">
          S/ {item.price.toFixed(2)}
        </div>
      </div>

      {quantityInCart > 0 ? (
        <div className="flex items-center justify-between space-x-1">
          <button
            onClick={handleDecrement}
            className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="text-xs font-medium w-6 text-center">{quantityInCart}</span>
          <button
            onClick={handleIncrement}
            className="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleAddClick}
          className="w-full bg-red-500 text-white py-1.5 rounded-lg flex items-center justify-center space-x-1 text-xs font-medium hover:bg-red-600 transition-colors"
        >
          <Plus size={12} />
          <span>Agregar</span>
        </button>
      )}
    </div>
  );
});

const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { error, data } = await supabase
        .from('categories')
        .select('name')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      
      const categoryNames = data?.map(item => item.name) || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, refreshCategories: fetchCategories };
};

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
      const { error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategory.trim(),
          sort_order: categories.length + 1
        }]);

      if (error) {
        if (error.code === '23505') {
          setError('Esta categoría ya existe en la base de datos');
        } else {
          setError(`Error al crear la categoría: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      setSuccess('Categoría creada exitosamente');
      setNewCategory('');
      onCategoryCreated();
      
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
      const { error } = await supabase
        .from('categories')
        .update({ name: newName.trim() })
        .eq('name', oldName);

      if (error) throw error;
      
      setSuccess('Categoría actualizada exitosamente');
      setEditingIndex(null);
      onCategoryCreated();
    } catch (error: any) {
      setError(`Error al actualizar: ${error.message}`);
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
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ category: 'Sin categoría' })
        .eq('category', categoryName);

      if (updateError) throw updateError;

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName);

      if (error) throw error;
      
      setSuccess('Categoría eliminada exitosamente');
      onCategoryCreated();
    } catch (error: any) {
      setError(`Error al eliminar: ${error.message}`);
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
          <p>Las categorías se sincronizan automáticamente con Supabase</p>
        </div>
      </div>
    </div>
  );
};

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

const OrderReception: React.FC = React.memo(() => {
  const [activeTab, setActiveTab] = useState<'phone' | 'walk-in' | 'delivery' | 'fullDay'>('phone');
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
  const { categories: dbCategories } = useCategories();
  const { createOrder } = useOrders();
  const { createOrder: createFullDayOrder } = useFullDay();
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
  // FUNCIÓN GENERATE TICKET CONTENT CORREGIDA
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
      // Cálculos con IGV 10% incluido en el precio
      const subtotal = order.total / 1.10;
      const igv = order.total - subtotal;
      
      let customerInfo = '';
      
      // PARA PEDIDOS FULLDAY - CORREGIDO: nombres completos en una línea y con teléfono
      if (order.source.type === 'fullDay' && order.studentInfo) {
        customerInfo = `
          <div class="info-row" style="flex-wrap: wrap;">
            <span class="label">ALUMNO:</span>
            <span class="customer-name-bold" style="max-width: 70%; word-wrap: break-word; white-space: normal;">${order.studentInfo.fullName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="label">GRADO:</span>
            <span class="value">${order.studentInfo.grade} "${order.studentInfo.section}"</span>
          </div>
          <div class="info-row">
            <span class="label">APODERADO:</span>
            <span class="value" style="max-width: 70%; word-wrap: break-word; white-space: normal;">${order.studentInfo.guardianName.toUpperCase()}</span>
          </div>
          ${order.phone ? `
          <div class="info-row">
            <span class="label">TELÉFONO:</span>
            <span class="value">${order.phone}</span>
          </div>
          ` : ''}
        `;
      } else {
        // PARA PEDIDOS REGULARES
        customerInfo = `
          <div class="info-row">
            <span class="label">CLIENTE:</span>
            <span class="customer-name-bold" style="max-width: 70%; word-wrap: break-word;">${order.customerName.toUpperCase()}</span>
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
                white-space: normal;
                line-height: 1.3;
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
    } else {
      if (!customerName || !phone) {
        showToast('Completa los datos del cliente', 'error');
        return;
      }
    }

    if (activeTab === 'walk-in' && !tableNumber) {
      showToast('Ingresa el número de mesa', 'error');
      return;
    }

    if ((activeTab === 'walk-in' || activeTab === 'delivery' || activeTab === 'fullDay') && !paymentMethod) {
      showToast('Selecciona un método de pago', 'error');
      return;
    }

    if (isCreatingOrder) return;

    setIsCreatingOrder(true);

    try {
      const total = getTotal();
      
      if (activeTab === 'fullDay') {
        // Crear pedido en tabla fullday
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
          
          // Crear orden temporal solo para imprimir ticket - CON IGV 10%
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
      } else {
        // Crear pedido regular en tabla orders
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
          paymentMethod: activeTab !== 'phone' ? paymentMethod : undefined,
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

        // Crear orden temporal para imprimir ticket - CON IGV 10%
        const tempOrder: Order = {
          id: 'temp-' + Date.now(),
          orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
          kitchenNumber: activeTab === 'phone' ? `COM-${Date.now().toString().slice(-8)}` : undefined,
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
          paymentMethod: orderData.paymentMethod,
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
      
      // Limpiar todo después de crear el pedido
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
    paymentMethod, createOrder, createFullDayOrder, getTotal, showToast, 
    printOrderImmediately, isCreatingOrder, studentName, guardianName, 
    selectedGrade, selectedSection, selectedStudentId
  ]);

  const isFormValid = useMemo(() => {
    if (cart.length === 0) return false;
    
    if (activeTab === 'fullDay') {
      return studentName && guardianName;
    }
    
    if (activeTab === 'walk-in') {
      return customerName && phone && tableNumber;
    }
    
    if (activeTab === 'delivery') {
      return customerName && phone && address;
    }
    
    return customerName && phone;
  }, [cart, activeTab, customerName, phone, tableNumber, address, studentName, guardianName]);

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
          onRefresh={refreshMenu}
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
                      <option value="phone">📞 Cocina</option>
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
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white">
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

                    {activeTab === 'delivery' && (
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Dirección de envío *"
                        required
                      />
                    )}
                  </>
                )}

                {(activeTab === 'walk-in' || activeTab === 'delivery' || activeTab === 'fullDay') && (
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

              {!searchTerm && categories.length > 0 && (
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeCategory === category
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
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
                      <option value="phone">📞 Cocina</option>
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

                        {activeTab === 'delivery' && (
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Dirección *"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        )}
                      </>
                    )}

                    {(activeTab === 'walk-in' || activeTab === 'delivery' || activeTab === 'fullDay') && (
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

                  {!searchTerm && categories.length > 0 && (
                    <div className="flex space-x-2 mb-4 overflow-x-auto">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
                            activeCategory === category
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
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
                      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
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
