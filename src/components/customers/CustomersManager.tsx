import React, { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Phone, MapPin, Save, X, RefreshCw } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';

const CustomersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });
  
  const { 
    customers, 
    loading, 
    createCustomer, 
    updateCustomer,
    deleteCustomer,
    refreshCustomerStats,
    fetchCustomers 
  } = useCustomers();

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir formulario para nuevo cliente
  const handleNewCustomer = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '', email: '' });
    setShowForm(true);
  };

  // Abrir formulario para editar cliente
  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      email: customer.email || ''
    });
    setShowForm(true);
  };

  // Crear o actualizar cliente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validaciones básicas
      if (!formData.name.trim() || !formData.phone.trim()) {
        alert('Por favor completa al menos el nombre y teléfono del cliente');
        return;
      }

      let result;

      if (editingCustomer) {
        // Actualizar cliente existente
        result = await updateCustomer(editingCustomer.id, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address || undefined,
          email: formData.email || undefined
        });
      } else {
        // Crear nuevo cliente
        result = await createCustomer({
          name: formData.name,
          phone: formData.phone,
          address: formData.address || undefined,
          email: formData.email || undefined
        });
      }

      if (result.success) {
        alert(`✅ Cliente ${editingCustomer ? 'actualizado' : 'creado'} exitosamente`);
        setShowForm(false);
        setEditingCustomer(null);
        setFormData({ name: '', phone: '', address: '', email: '' });
        // Recargar la lista para asegurar que se vean los cambios
        await fetchCustomers();
      } else {
        if (result.error?.includes('Ya existe')) {
          alert('❌ ' + result.error);
        } else {
          alert(`❌ Error al ${editingCustomer ? 'actualizar' : 'crear'} cliente: ` + result.error);
        }
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al cliente "${name}"?`)) {
      const result = await deleteCustomer(id);
      if (result.success) {
        alert('✅ Cliente eliminado correctamente');
      } else {
        alert('❌ Error al eliminar cliente: ' + result.error);
      }
    }
  };

  // Función para refrescar estadísticas de un cliente
  const handleRefreshStats = async (customerId: string, customerName: string) => {
    setRefreshingId(customerId);
    try {
      const result = await refreshCustomerStats(customerId);
      if (result.success) {
        alert(`✅ Estadísticas de ${customerName} actualizadas correctamente`);
      } else {
        alert('❌ Error al actualizar estadísticas: ' + result.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-gray-600 mt-1">Administra la información de tus clientes</p>
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
                  placeholder="Buscar clientes..."
                />
              </div>
              
              <button 
                onClick={handleNewCustomer}
                className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium"
              >
                <Plus size={20} />
                <span>Nuevo Cliente</span>
              </button>
            </div>
          </div>

          {/* Formulario Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowForm(false);
                      setEditingCustomer(null);
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
                      placeholder="Nombre completo del cliente"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Número de teléfono"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Dirección completa"
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="correo@ejemplo.com"
                      disabled={formLoading}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCustomer(null);
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
                          ? (editingCustomer ? 'Actualizando...' : 'Creando...') 
                          : (editingCustomer ? 'Actualizar Cliente' : 'Crear Cliente')
                        }
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Clientes */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando clientes...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl text-gray-300 mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda' 
                    : 'Los clientes aparecerán aquí cuando se registren pedidos'}
                </p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200 relative group"
                >
                  {/* Botones de acción */}
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => handleRefreshStats(customer.id, customer.name)}
                      disabled={refreshingId === customer.id}
                      className={`text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm border border-gray-200 ${
                        refreshingId === customer.id ? 'animate-spin' : ''
                      }`}
                      title="Actualizar estadísticas"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      onClick={() => handleEditCustomer(customer)}
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm border border-gray-200"
                      title="Editar cliente"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors bg-white shadow-sm border border-gray-200"
                      title="Eliminar cliente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Información del Cliente */}
                  <div className="pr-16">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{customer.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.address && (
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} />
                            <span className="max-w-xs truncate">{customer.address}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center space-x-1">
                            <span>📧</span>
                            <span className="max-w-xs truncate">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estadísticas del Cliente */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">{customer.orders_count}</div>
                        <div className="text-xs text-gray-500">Pedidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">S/ {customer.total_spent.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Total Gastado</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">
                          S/ {customer.orders_count > 0 ? (customer.total_spent / customer.orders_count).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-xs text-gray-500">Promedio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-700">
                          {customer.last_order ? new Date(customer.last_order).toLocaleDateString() : 'Nunca'}
                        </div>
                        <div className="text-xs text-gray-500">Último Pedido</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Estadísticas generales */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{customers.length}</div>
                <div className="text-sm text-gray-600">Total Clientes</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {customers.reduce((total, customer) => total + customer.orders_count, 0)}
                </div>
                <div className="text-sm text-gray-600">Pedidos Totales</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  S/ {customers.reduce((total, customer) => total + customer.total_spent, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Ingresos Totales</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {customers.length > 0 
                    ? (customers.reduce((total, customer) => total + customer.total_spent, 0) / customers.length).toFixed(2)
                    : '0'
                  }
                </div>
                <div className="text-sm text-gray-600">Promedio por Cliente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersManager;