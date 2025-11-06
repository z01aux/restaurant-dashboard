import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Phone, MapPin } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string;
}

const CustomersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'Juan Pérez',
      phone: '+51 987 654 321',
      address: 'Av. Siempre Viva 123',
      ordersCount: 5,
      totalSpent: 245.50,
      lastOrder: '2024-01-15'
    },
    {
      id: '2',
      name: 'María García',
      phone: '+51 955 444 333',
      ordersCount: 3,
      totalSpent: 128.00,
      lastOrder: '2024-01-14'
    },
    {
      id: '3',
      name: 'Carlos López',
      phone: '+51 966 777 888',
      address: 'Calle Los Olivos 456',
      ordersCount: 8,
      totalSpent: 420.75,
      lastOrder: '2024-01-15'
    }
  ]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const deleteCustomer = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      setCustomers(customers.filter(customer => customer.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
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
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-64"
                  placeholder="Buscar clientes..."
                />
              </div>
              
              <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 font-medium">
                <Plus size={20} />
                <span>Nuevo Cliente</span>
              </button>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Información del Cliente */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Phone size={14} />
                            <span>{customer.phone}</span>
                          </div>
                          {customer.address && (
                            <div className="flex items-center space-x-1">
                              <MapPin size={14} />
                              <span>{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Estadísticas del Cliente */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{customer.ordersCount}</div>
                        <div className="text-xs text-gray-500">Pedidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">S/ {customer.totalSpent.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Total Gastado</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">S/ {(customer.totalSpent / customer.ordersCount).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Promedio por Pedido</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-700">{customer.lastOrder}</div>
                        <div className="text-xs text-gray-500">Último Pedido</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Estado vacío */}
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl text-gray-300 mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'Los clientes aparecerán aquí cuando realicen pedidos'}
              </p>
            </div>
          )}

          {/* Estadísticas generales */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{customers.length}</div>
                <div className="text-sm text-gray-600">Total Clientes</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {customers.reduce((total, customer) => total + customer.ordersCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Pedidos Totales</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  S/ {customers.reduce((total, customer) => total + customer.totalSpent, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Ingresos Totales</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {customers.length > 0 
                    ? (customers.reduce((total, customer) => total + customer.totalSpent, 0) / customers.length).toFixed(2)
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
