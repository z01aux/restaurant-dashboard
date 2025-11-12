import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Save, X, Calendar } from 'lucide-react';
import { MenuItem } from '../../types';
import { useMenu } from '../../hooks/useMenu';

const MenuManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [showDailyMenuModal, setShowDailyMenuModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Entradas',
    type: 'food' as 'food' | 'drink',
    available: true
  });

  // Usar el hook centralizado del menú
  const { 
    getAllItems, 
    getCategories, 
    updateItemPrice, 
    deleteItem,
    createItem, // ✅ Ahora está disponible
    currentDailyMenu,
    changeDailyMenu,
    getDailyMenuOptions
  } = useMenu();

  const allMenuItems = getAllItems();
  const categories = ['Todas', ...getCategories()];
  const dailyOptions = getDailyMenuOptions();

  // Filtrar items
  const filteredItems = allMenuItems.filter((item: MenuItem) =>
    (activeCategory === 'Todas' || item.category === activeCategory.replace(/[🥗🍽️🥤]/g, '').trim()) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Función para editar precio
  const startEditPrice = (item: MenuItem) => {
    setEditingItem(item);
    setEditPrice(item.price.toString());
  };

  const savePrice = () => {
    if (editingItem && editPrice) {
      const newPrice = parseFloat(editPrice);
      if (!isNaN(newPrice)) {
        updateItemPrice(editingItem.id, newPrice);
        setEditingItem(null);
        setEditPrice('');
      }
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditPrice('');
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      deleteItem(id);
    }
  };

  // Función para cambiar el menú del día
  const handleChangeDailyMenu = (menuIndex: number) => {
    if (window.confirm(`¿Cambiar al Menú del Día ${menuIndex + 1}? Esto actualizará las entradas y platos de fondo.`)) {
      changeDailyMenu(menuIndex);
      setShowDailyMenuModal(false);
    }
  };

  // Función para agregar nuevo producto
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Por favor completa los campos obligatorios: Nombre y Precio');
      return;
    }

    try {
      const price = parseFloat(newProduct.price);
      if (isNaN(price)) {
        alert('El precio debe ser un número válido');
        return;
      }

      await createItem({
        name: newProduct.name,
        description: newProduct.description,
        price: price,
        category: newProduct.category,
        type: newProduct.type,
        available: newProduct.available
      });

      // Resetear formulario
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: 'Entradas',
        type: 'food',
        available: true
      });
      
      setShowAddProductModal(false);
      alert('Producto agregado exitosamente!');
      
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar el producto. Por favor intenta nuevamente.');
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
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-500">Menú del día actual:</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                  Opción {currentDailyMenu + 1}
                </span>
              </div>
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
              
              {/* Botón para cambiar menú del día */}
              <button 
                onClick={() => setShowDailyMenuModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium"
              >
                <Calendar size={20} />
                <span>Menú del Día</span>
              </button>

              <button 
                onClick={() => setShowAddProductModal(true)}
                className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium"
              >
                <Plus size={20} />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Modal para agregar nuevo producto */}
          {showAddProductModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Agregar Nuevo Producto</h3>
                  <button 
                    onClick={() => setShowAddProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Ej: Papa a la Huancaina"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Descripción del producto..."
                    />
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio (S/) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Entradas">🥗 Entradas</option>
                      <option value="Platos de Fondo">🍽️ Platos de Fondo</option>
                      <option value="Bebidas">🥤 Bebidas</option>
                    </select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Producto *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="food"
                          checked={newProduct.type === 'food'}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, type: e.target.value as 'food' | 'drink' }))}
                          className="mr-2 text-red-500 focus:ring-red-500"
                        />
                        <span>🍽️ Comida</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="drink"
                          checked={newProduct.type === 'drink'}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, type: e.target.value as 'food' | 'drink' }))}
                          className="mr-2 text-red-500 focus:ring-red-500"
                        />
                        <span>🥤 Bebida</span>
                      </label>
                    </div>
                  </div>

                  {/* Disponibilidad */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.available}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, available: e.target.checked }))}
                        className="mr-2 text-red-500 focus:ring-red-500 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Disponible para la venta</span>
                    </label>
                  </div>

                  {/* Botones */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowAddProductModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddProduct}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Agregar Producto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* El resto del código del MenuManager permanece igual */}
          {/* ... (código de categorías, grid de productos, etc.) */}
        </div>
      </div>
    </div>
  );
};

export default MenuManager;
