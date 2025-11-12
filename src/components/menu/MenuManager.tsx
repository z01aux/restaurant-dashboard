import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Save, X, Tag, Star, StarOff } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';

const MenuManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editPrice, setEditPrice] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    type: 'food' as 'food' | 'drink',
    available: true
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    emoji: ''
  });

  const { 
    menuItems, 
    categories, 
    loading,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    createCategory,
    toggleDailySpecial,
    hasMaxDailyItems,
    getCategoriesWithDailyCount
  } = useMenu();

  // Filtrar items
  const filteredItems = menuItems.filter(item =>
    (activeCategory === 'all' || item.category_id === activeCategory) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Categorías con conteo de platos del día
  const categoriesWithCount = getCategoriesWithDailyCount();

  // Función para editar precio
  const startEditPrice = (item: any) => {
    setEditingItem(item);
    setEditPrice(item.price.toString());
  };

  const savePrice = async () => {
    if (editingItem && editPrice) {
      const newPrice = parseFloat(editPrice);
      if (!isNaN(newPrice)) {
        await updateMenuItem(editingItem.id, { price: newPrice });
        setEditingItem(null);
        setEditPrice('');
      }
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditPrice('');
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      await deleteMenuItem(id);
    }
  };

  // Crear nuevo producto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const result = await createMenuItem({
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category_id: productForm.category_id,
        type: productForm.type,
        available: productForm.available
      });

      if (result.success) {
        alert('✅ Producto creado exitosamente');
        setShowProductForm(false);
        setProductForm({
          name: '',
          description: '',
          price: '',
          category_id: '',
          type: 'food',
          available: true
        });
      } else {
        alert('❌ Error al crear producto: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Crear nueva categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const result = await createCategory({
        name: categoryForm.name,
        emoji: categoryForm.emoji
      });

      if (result.success) {
        alert('✅ Categoría creada exitosamente');
        setShowCategoryForm(false);
        setCategoryForm({ name: '', emoji: '' });
      } else {
        alert('❌ Error al crear categoría: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle plato del día
  const handleToggleDailySpecial = async (item: any) => {
    const categoryId = item.category_id;
    
    if (!item.is_daily_special && hasMaxDailyItems(categoryId)) {
      alert('❌ Esta categoría ya tiene 4 platos del día. Elimina uno primero.');
      return;
    }

    const result = await toggleDailySpecial(item.id, !item.is_daily_special);
    if (result.success) {
      alert(item.is_daily_special ? '❌ Removido del menú del día' : '✅ Agregado al menú del día');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión del Menú</h1>
              <p className="text-gray-600 mt-1">Administra productos, categorías y menú del día</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full sm:w-64"
                  placeholder="Buscar productos..."
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowCategoryForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium"
                >
                  <Tag size={20} />
                  <span>Nueva Categoría</span>
                </button>
                
                <button 
                  onClick={() => setShowProductForm(true)}
                  className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium"
                >
                  <Plus size={20} />
                  <span>Nuevo Producto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navegación de Categorías */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos los Productos
            </button>
            
            {categoriesWithCount.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center space-x-2 ${
                  activeCategory === category.id
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.emoji} {category.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === category.id 
                    ? 'bg-white text-red-500' 
                    : 'bg-red-500 text-white'
                }`}>
                  {category.daily_items_count}/{category.max_daily_items}
                </span>
              </button>
            ))}
          </div>

          {/* Formulario Modal - Nueva Categoría */}
          {showCategoryForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Nueva Categoría</h3>
                  <button 
                    onClick={() => setShowCategoryForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={formLoading}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Categoría *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Ej: Postres"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emoji (opcional)
                    </label>
                    <input
                      type="text"
                      value={categoryForm.emoji}
                      onChange={(e) => setCategoryForm({...categoryForm, emoji: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-2xl"
                      placeholder="🍰"
                      maxLength={2}
                      disabled={formLoading}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      disabled={formLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
                    >
                      <Save size={16} />
                      <span>{formLoading ? 'Creando...' : 'Crear Categoría'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Formulario Modal - Nuevo Producto */}
          {showProductForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Nuevo Producto</h3>
                  <button 
                    onClick={() => setShowProductForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={formLoading}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Ej: Lomo Saltado"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Descripción del producto..."
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio (S/) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0.00"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                      disabled={formLoading}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.emoji} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={productForm.type}
                      onChange={(e) => setProductForm({...productForm, type: e.target.value as 'food' | 'drink'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                      disabled={formLoading}
                    >
                      <option value="food">🍽️ Comida</option>
                      <option value="drink">🥤 Bebida</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="available"
                      checked={productForm.available}
                      onChange={(e) => setProductForm({...productForm, available: e.target.checked})}
                      className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                      disabled={formLoading}
                    />
                    <label htmlFor="available" className="text-sm font-medium text-gray-700">
                      Producto disponible
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
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
                      <span>{formLoading ? 'Creando...' : 'Crear Producto'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Grid de Productos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando productos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.category_emoji} {item.category_name}
                      </p>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleDailySpecial(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.is_daily_special
                            ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                        title={item.is_daily_special ? 'Quitar del menú del día' : 'Agregar al menú del día'}
                      >
                        {item.is_daily_special ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                      </button>
                      <button 
                        onClick={() => startEditPrice(item)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
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
                      {editingItem?.id === item.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            step="0.01"
                            min="0"
                          />
                          <button
                            onClick={savePrice}
                            className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-red-600">
                          S/ {item.price.toFixed(2)}
                        </span>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {item.type === 'food' ? '🍽️ Comida' : '🥤 Bebida'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        item.available 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {item.available ? 'Disponible' : 'No disponible'}
                      </span>
                      {item.is_daily_special && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                          🍽️ Menú del Día
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío */}
          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl text-gray-300 mb-4">🍽️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-gray-500 text-sm">
                {searchTerm || activeCategory !== 'all' 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'No hay productos en el menú'}
              </p>
            </div>
          )}

          {/* Estadísticas */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{menuItems.length}</div>
                <div className="text-sm text-gray-600">Total de Productos</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {menuItems.filter(item => item.available).length}
                </div>
                <div className="text-sm text-gray-600">Disponibles</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {menuItems.filter(item => item.is_daily_special).length}
                </div>
                <div className="text-sm text-gray-600">En Menú del Día</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {categories.length}
                </div>
                <div className="text-sm text-gray-600">Categorías</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManager;
