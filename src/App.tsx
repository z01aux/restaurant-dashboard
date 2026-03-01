// ============================================
// ARCHIVO: src/App.tsx (CON OEP)
// ============================================

import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import StatsCards from './components/dashboard/StatsCards';
import OrdersManager from './components/orders/OrdersManager';
import MenuManager from './components/menu/MenuManager';
import OrderReception from './components/orders/OrderReception';
import CustomersManager from './components/customers/CustomersManager_NUEVO';
import KitchenManager from './components/kitchen/KitchenManager';
import UserManager from './components/users/UserManager';
import StudentManager from './components/students/StudentManager';
import { FullDayOrdersManager } from './components/fullday/FullDayOrdersManager';
import { OEPOrdersManager } from './components/oep/OEPOrdersManager';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { OrderProvider } from './contexts/OrderContext';
import { useOrders } from './hooks/useOrders';

function App() {
  const [activeTab, setActiveTab] = React.useState('reception');
  const { user } = useAuth();
  const { fetchOrders } = useOrders();

  const refreshOrders = async () => {
    await fetchOrders(500);
  };

  const addNewOrder = (order: any) => {
    const event = new CustomEvent('newOrderCreated', { detail: order });
    window.dispatchEvent(event);
  };

  // Pestañas base para todos los usuarios - CON OEP
  const baseTabs = [
    { id: 'reception', name: '🎯 Recepción' },
    { id: 'orders', name: '📋 Órdenes' },
    { id: 'fullday', name: '🎒 FullDay' },
    { id: 'oep', name: '📦 OEP' },
    { id: 'menu', name: '🍽️ Menú' },
    { id: 'kitchen', name: '👨‍🍳 Cocina' },
    { id: 'dashboard', name: '📊 Dashboard' },
    { id: 'customers', name: '👥 Clientes' },
  ];

  // Solo administradores ven Alumnos y Usuarios
  const adminTabs = user?.role === 'admin' 
    ? [
        { id: 'students', name: '🎒 Alumnos' },
        { id: 'users', name: '🔧 Usuarios' },
      ]
    : [];

  const tabs = [...baseTabs, ...adminTabs];

  return (
    <ProtectedRoute>
      <OrderProvider refreshOrders={refreshOrders} addNewOrder={addNewOrder}>
        <DashboardLayout>
          {/* Navigation Tabs */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-2 w-full mx-auto">
              <div className="overflow-x-auto pb-1 hide-scrollbar">
                <nav className="flex space-x-2 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center sm:gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-none px-4 py-2.5 sm:px-4 sm:py-2.5 
                        rounded-xl font-semibold 
                        text-sm sm:text-sm 
                        transition-all duration-300 whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-red-600 hover:bg-white/50'
                        }
                      `}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
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
          {activeTab === 'fullday' && <FullDayOrdersManager />}
          {activeTab === 'oep' && <OEPOrdersManager />}
          {activeTab === 'menu' && <MenuManager />}
          {activeTab === 'kitchen' && <KitchenManager />}
          {activeTab === 'customers' && <CustomersManager />}
          {activeTab === 'students' && <StudentManager />}
          {activeTab === 'users' && <UserManager />}
        </DashboardLayout>
      </OrderProvider>
    </ProtectedRoute>
  );
}

export default App;