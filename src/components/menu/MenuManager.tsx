import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Save, X, Star, StarOff } from 'lucide-react';
import { MenuItem } from '../../types';
import { useMenu } from '../../hooks/useMenu';

// Componente Skeleton para productos - Memoizado
const MenuItemSkeleton: React.FC = React.memo(() => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="flex space-x-2 opacity-0">
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
    <div className="flex justify-between items-center">
      <div className="h-6 bg-gray-300 rounded w-20"></div>
      <div className="h-6 bg-gray-300 rounded w-16"></div>
    </div>
  </div>
));

// Componente de Producto Individual - Memoizado
const ProductCard: React.FC<{
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onToggleDailySpecial: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
}> = React.memo(({ item, onEdit, onToggleDailySpecial, onDelete }) => {
  const handleEdit = useCallback(() => {
    onEdit(item);
  }, [item, onEdit]);

  const handleToggleSpecial = useCallback(() => {
    onToggleDailySpecial(item);
  }, [item, onToggleDailySpecial]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200 group relative">
      {/* Badge de producto del día */}
      {item.isDailySpecial && (
        <div className="absolute -top-2 -left-2 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center space-x-1">
          <Star size={12} />
          <span>Del Día</span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleToggleSpecial}
            className={`p-2 rounded-lg transition-colors ${
              item.isDailySpecial 
                ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={item.isDailySpecial ? 'Quitar del menú del día' : 'Agregar al menú del día'}
          >
            {item.isDailySpecial ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
          </button>
          <button 
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {item.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <span className="text-2xl font-bold text-red-600">
            S/ {item.price.toFixed(2)}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {item.type === 'food' ? '🍽️ Comida' : '🥤 Bebida'}
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          item.available 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {item.available ? 'Disponible' : 'No disponible'}
        </span>
      </div>
    </div>
  );
});

// Componente del Formulario - Memoizado
const ProductForm: React.FC<{
  showForm: boolean;
  editingItem: MenuItem | null;
  formData: any;
  formLoading: boolean;
  categories: string[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (field: string, value: any) => void;
}> = React.memo(({
  showForm,
  editingItem,
  formData,
  formLoading,
  categories,
  onClose,
  onSubmit,
  onFormDataChange
}) => {
  if (!showForm) return null;

  const handleInputChange = useCallback((field: string) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onFormDataChange(field, e.target.value);
    }, [onFormDataChange]);

  const handleCheckboxChange = useCallback((field: string) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFormDataChange(field, e.target.checked);
    }, [onFormDataChange]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={formLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Nombre del producto"
              required
              disabled={formLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={handleInputChange('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Descripción del producto"
              disabled={formLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleInputChange('price')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="0.00"
              required
              disabled={formLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={handleInputChange('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
                disabled={formLoading}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={handleInputChange('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
                disabled={formLoading}
              >
                <option value="food">Comida</option>
                <option value="drink">Bebida</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={handleCheckboxChange('available')}
              className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
              disabled={formLoading}
            />
            <label htmlFor="available" className="text-sm font-medium text-gray-700">
              Disponible
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDailySpecial"
              checked={formData.isDailySpecial}
              onChange={handleCheckboxChange('isDailySpecial')}
              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
              disabled={formLoading}
            />
            <label htmlFor="isDailySpecial" className="text-sm font-medium text-gray-700">
              Producto del Día (aparece en Recepción)
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={formLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
            >
              <Save size={16} />
              <span>
                {formLoading 
                  ? (editingItem ? 'Actualizando...' : 'Creando...') 
                  : (editingItem ? 'Actualizar' : 'Crear Producto')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// Componente de Confirmación de Eliminación - Memoizado
const DeleteConfirmation: React.FC<{
  showDeleteConfirm: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = React.memo(({ showDeleteConfirm, onCancel, onConfirm }) => {
  if (!showDeleteConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Eliminación</h3>
        <p className="text-gray-600 mb-4">
          ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
});

const MenuManager: React.FC = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Entradas',
    type: 'food' as 'food' | 'drink',
    available: true,
    isDailySpecial: false
  });

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

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

  // Datos memoizados
  const allMenuItems = useMemo(() => getAllItems(), [getAllItems]);
  const availableCategories = useMemo(() => 
    ['Todas', ...getCategories()], [getCategories()]
  );

  // Items filtrados memoizados
  const filteredItems = useMemo(() => 
    allMenuItems.filter((item: MenuItem) =>
      (activeCategory === 'Todas' || item.category === activeCategory) &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [allMenuItems, activeCategory, searchTerm]
  );

  // Estadísticas memoizadas
  const stats = useMemo(() => ({
    total: allMenuItems.length,
    available: allMenuItems.filter((item: MenuItem) => item.available).length,
    food: allMenuItems.filter((item: MenuItem) => item.type === 'food').length,
    dailySpecial: allMenuItems.filter((item: MenuItem) => item.isDailySpecial).length
  }), [allMenuItems]);

  // Callbacks optimizados
  const handleNewItem = useCallback(() => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Entradas',
      type: 'food',
      available: true,
      isDailySpecial: false
    });
    setShowForm(true);
  }, []);

  const handleEditItem = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      type: item.type,
      available: item.available,
      isDailySpecial: item.isDailySpecial || false
    });
    setShowForm(true);
  }, []);

  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  // Toggle producto del día
  const handleToggleDailySpecial = useCallback(async (item: MenuItem) => {
    const result = await toggleDailySpecial(item.id, !item.isDailySpecial);
    if (!result.success) {
      alert('❌ Error al actualizar producto del día');
    }
  }, [toggleDailySpecial]);

  // Crear o actualizar producto
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validaciones
      if (!formData.name.trim() || !formData.price) {
        alert('Por favor completa al menos el nombre y precio del producto');
        return;
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        alert('Por favor ingresa un precio válido');
        return;
      }

      let result;

      if (editingItem) {
        // Actualizar producto existente
        result = await updateItem(editingItem.id, {
          name: formData.name,
          description: formData.description || undefined,
          price: price,
          category: formData.category,
          type: formData.type,
          available: formData.available,
          isDailySpecial: formData.isDailySpecial
        });
      } else {
        // Crear nuevo producto
        result = await createItem({
          name: formData.name,
          description: formData.description || undefined,
          price: price,
          category: formData.category,
          type: formData.type,
          available: formData.available,
          isDailySpecial: formData.isDailySpecial
        });
      }

      if (result.success) {
        alert(`✅ Producto ${editingItem ? 'actualizado' : 'creado'} exitosamente`);
        handleCloseForm();
      } else {
        alert(`❌ Error al ${editingItem ? 'actualizar' : 'crear'} producto: ` + result.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  }, [formData, editingItem, updateItem, createItem, handleCloseForm]);

  // Eliminar producto
  const handleDeleteItem = useCallback(async (id: string) => {
    const result = await deleteItem(id);
    if (result.success) {
      alert('✅ Producto eliminado correctamente');
      setShowDeleteConfirm(null);
    } else {
      alert('❌ Error al eliminar producto: ' + result.error);
    }
  }, [deleteItem]);

  const handleDeleteClick = useCallback((itemId: string) => {
    setShowDeleteConfirm(itemId);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (showDeleteConfirm) {
      handleDeleteItem(showDeleteConfirm);
    }
  }, [showDeleteConfirm, handleDeleteItem]);

  // Handlers de búsqueda y filtros
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  // Renderizado de productos memoizado - AHORA SÍ USANDO EL SKELETON
  const renderedProducts = useMemo(() => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <MenuItemSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl text-gray-300 mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || activeCategory !== 'Todas' 
              ? 'No se encontraron productos' 
              : 'No hay productos en el menú'
            }
          </h3>
          <p className="text-gray-500 text-sm">
            {searchTerm || activeCategory !== 'Todas' 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Los productos aparecerán aquí cuando los agregues'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item: MenuItem) => (
          <ProductCard
            key={item.id}
            item={item}
            onEdit={handleEditItem}
            onToggleDailySpecial={handleToggleDailySpecial}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>
    );
  }, [loading, filteredItems, searchTerm, activeCategory, handleEditItem, handleToggleDailySpecial, handleDeleteClick]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión del Menú</h1>
              <p className="text-gray-600 mt-1">Administra los productos de tu restaurante</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full sm:w-64"
                  placeholder="Buscar productos..."
                />
              </div>
              
              <button 
                onClick={handleNewItem}
                className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium"
              >
                <Plus size={20} />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Formulario Modal */}
          <ProductForm
            showForm={showForm}
            editingItem={editingItem}
            formData={formData}
            formLoading={formLoading}
            categories={getCategories()}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            onFormDataChange={handleFormDataChange}
          />

          {/* Modal de confirmación de eliminación */}
          <DeleteConfirmation
            showDeleteConfirm={showDeleteConfirm}
            onCancel={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />

          {/* Navegación de Categorías */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {availableCategories.map((category: string) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grid de Productos */}
          {renderedProducts}

          {/* Estadísticas */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total de Productos</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                <div className="text-sm text-gray-600">Disponibles</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.food}</div>
                <div className="text-sm text-gray-600">Platos de Comida</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.dailySpecial}</div>
                <div className="text-sm text-gray-600">Productos del Día</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MenuManager;
