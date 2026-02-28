// ============================================
// ARCHIVO: src/components/customers/CustomersManager.tsx
// ============================================

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Phone, MapPin, Save, XCircle, Mail } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';

const CustomersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
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
    fetchCustomers 
  } = useCustomers();

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
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
        handleCloseForm();
        setFormData({ name: '', phone: '', address: '', email: '' });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-gray-600 mt-1">Solo información de contacto - Sin estadísticas de pedidos</p>
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

          {/* FORMULARIO FIJO EN LA PARTE SUPERIOR */}
          {showForm && (
            <div className="mb-6 p-6 bg-white border-2 border-red-200 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCustomer ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
                </h3>
                <button 
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={formLoading}
                >
                  <XCircle size={24} className="text-red-500 hover:text-red-700" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Número de teléfono"
                        required
                        disabled={formLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="correo@ejemplo.com"
                        disabled={formLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Dirección completa"
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={formLoading}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-lg hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
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
          )}

          {/* Lista de Clientes - SOLO INFORMACIÓN DE CONTACTO */}
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
                    : 'Los clientes aparecerán aquí cuando los registres'}
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

                  {/* Información de Contacto SOLAMENTE */}
                  <div className="pr-16">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{customer.name}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Teléfono */}
                        <div className="flex items-start space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Phone size={18} className="text-green-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Teléfono</div>
                            <div className="font-medium text-gray-900">{customer.phone}</div>
                          </div>
                        </div>

                        {/* Email (si existe) */}
                        {customer.email && (
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Mail size={18} className="text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Email</div>
                              <div className="font-medium text-gray-900 break-all">{customer.email}</div>
                            </div>
                          </div>
                        )}

                        {/* Dirección (si existe) */}
                        {customer.address && (
                          <div className="flex items-start space-x-3 md:col-span-2">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <MapPin size={18} className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500">Dirección</div>
                              <div className="font-medium text-gray-900">{customer.address}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fecha de registro (opcional) */}
                      <div className="mt-4 text-xs text-gray-400">
                        Registrado: {new Date(customer.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Estadísticas simples - solo conteo de clientes */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                <div className="text-2xl font-bold text-red-600">{customers.length}</div>
                <div className="text-sm text-gray-600">Total Clientes</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {customers.filter(c => c.email).length}
                </div>
                <div className="text-sm text-gray-600">Con Email</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.address).length}
                </div>
                <div className="text-sm text-gray-600">Con Dirección</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersManager;
