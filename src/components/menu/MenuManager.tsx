import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Save, X } from 'lucide-react';
import { MenuItem } from '../../types';
import { useMenu } from '../../hooks/useMenu';

const MenuManager: React.FC = () => {
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
    available: true
  });

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Usar el hook del menú - ✅ CORREGIDO: removida la variable menuItems que no se usa
  const { 
    loading, 
    getAllItems, 
    getCategories, 
    createItem,
    updateItem,
    deleteItem 
  } = useMenu();

  const allMenuItems = getAllItems();
  const availableCategories = ['Todas', ...getCategories()];

  // Filtrar items
  const filteredItems = allMenuItems.filter((item: MenuItem) =>
    (activeCategory === 'Todas' || item.category === activeCategory) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Abrir formulario para nuevo producto
  const handleNewItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Entradas',
      type: 'food',
      available: true
    });
    setShowForm(true);
  };

  // Abrir formulario para editar producto
  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      type: item.type,
      available: item.available
    });
    setShowForm(true);
  };

  // Crear o actualizar producto
  const handleSubmit = async (e: React.FormEvent) => {
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
          available: formData.available
        });
      } else {
        // Crear nuevo producto
        result = await createItem({
          name: formData.name,
          description: formData.description || undefined,
          price: price,
          category: formData.category,
          type: formData.type,
          available: formData.available
        });
      }

      if (result.success) {
        alert(`✅ Producto ${editingItem ? 'actualizado' : 'creado'} exitosamente`);
        setShowForm(false);
        setEditingItem(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          category: 'Entradas',
          type: 'food',
          available: true
        });
      } else {
        alert(`❌ Error al ${editingItem ? 'actualizar' : 'crear'} producto: ` + result.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Eliminar producto
  const handleDeleteItem = async (id: string) => {
    const result = await deleteItem(id);
    if (result.success) {
      alert('✅ Producto eliminado correctamente');
      setShowDeleteConfirm(null);
    } else {
      alert('❌ Error al eliminar producto: ' + result.error);
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
              <p className="text-gray-600 mt-1">Administra los productos de tu restaurante</p>
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
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={formLoading}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                        disabled={formLoading}
                      >
                        {getCategories().map(category => (
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
                        onChange={(e) => setFormData({...formData, type: e.target.value as 'food' | 'drink'})}
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
                      onChange={(e) => setFormData({...formData, available: e.target.checked})}
                      className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      disabled={formLoading}
                    />
                    <label htmlFor="available" className="text-sm font-medium text-gray-700">
                      Disponible
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingItem(null);
                      }}
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
          )}

          {/* Modal de confirmación de eliminación */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Eliminación</h3>
                <p className="text-gray-600 mb-4">
                  ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteItem(showDeleteConfirm)}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navegación de Categorías */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {availableCategories.map((category: string) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
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
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando productos...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: MenuItem) => (
                  <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(item.id)}
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
                ))}
              </div>

              {/* Estado vacío */}
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl text-gray-300 mb-4">🍽️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron productos</h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm || activeCategory !== 'Todas' 
                      ? 'Intenta con otros términos de búsqueda' 
                      : 'No hay productos en el menú'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Estadísticas */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{allMenuItems.length}</div>
                <div className="text-sm text-gray-600">Total de Productos</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {allMenuItems.filter((item: MenuItem) => item.available).length}
                </div>
                <div className="text-sm text-gray-600">Disponibles</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {allMenuItems.filter((item: MenuItem) => item.type === 'food').length}
                </div>
                <div className="text-sm text-gray-600">Platos de Comida</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManager;
