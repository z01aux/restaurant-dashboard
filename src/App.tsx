import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import StatsCards from './components/dashboard/StatsCards';
import OrdersManager from './components/orders/OrdersManager';
import MenuManager from './components/menu/MenuManager';
import OrderReception from './components/orders/OrderReception';
import CustomersManager from './components/customers/CustomersManager';
import KitchenManager from './components/kitchen/KitchenManager';
import UserManager from './components/users/UserManager';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { OrderProvider } from './contexts/OrderContext';
import { useOrders } from './hooks/useOrders';

function App() {
  const [activeTab, setActiveTab] = React.useState('reception');
  const { user } = useAuth();
  const { fetchOrders } = useOrders();

  // Función para refrescar órdenes
  const refreshOrders = async () => {
    await fetchOrders(500);
  };

  // Función para agregar nueva orden inmediatamente
  const addNewOrder = (order: any) => {
    const event = new CustomEvent('newOrderCreated', { detail: order });
    window.dispatchEvent(event);
  };

  // Tabs base para todos los usuarios
  const baseTabs = [
    { id: 'reception', name: '🎯 Recepción', shortName: '🎯' },
    { id: 'orders', name: '📋 Órdenes', shortName: '📋' },
    { id: 'menu', name: '🍽️ Menú', shortName: '🍽️' },
    { id: 'kitchen', name: '👨‍🍳 Cocina', shortName: '👨‍🍳' },
    { id: 'customers', name: '👥 Clientes', shortName: '👥' },
    { id: 'dashboard', name: '📊 Dashboard', shortName: '📊' },
  ];

  // Solo administradores ven la pestaña de Usuarios
  const adminTabs = user?.role === 'admin' 
    ? [{ id: 'users', name: '🔧 Usuarios', shortName: '🔧' }]
    : [];

  const tabs = [...baseTabs, ...adminTabs];

  return (
    <ProtectedRoute>
      <OrderProvider refreshOrders={refreshOrders} addNewOrder={addNewOrder}>
        <DashboardLayout>
          {/* Navigation Tabs Responsive */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-1 sm:p-2 w-full max-w-4xl mx-auto">
              <nav className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-red-600 hover:bg-white/50'
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden text-base">{tab.shortName}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'reception' && <OrderReception />}
          
          {activeTab === 'dashboard' && (
            <div>
              <StatsCards />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    Órdenes Recientes
                  </h3>
                  <div className="text-center text-gray-500 py-6 sm:py-8">
                    <div className="text-sm sm:text-lg mb-2">No hay órdenes recientes</div>
                    <div className="text-xs sm:text-sm">Las órdenes aparecerán aquí</div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-white/20">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    Productos Populares
                  </h3>
                  <div className="text-center text-gray-500 py-6 sm:py-8">
                    <div className="text-sm sm:text-lg mb-2">No hay datos disponibles</div>
                    <div className="text-xs sm:text-sm">Los productos populares aparecerán aquí</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && <OrdersManager />}
          {activeTab === 'menu' && <MenuManager />}
          {activeTab === 'customers' && <CustomersManager />}
          {activeTab === 'kitchen' && <KitchenManager />}
          {activeTab === 'users' && <UserManager />}
        </DashboardLayout>
      </OrderProvider>
    </ProtectedRoute>
  );
}

export default App;