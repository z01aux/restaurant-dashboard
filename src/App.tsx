import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import StatsCards from './components/dashboard/StatsCards';
import FullDayDashboard from './components/dashboard/FullDayDashboard';
import LoncheritasDashboard from './components/dashboard/LoncheritasDashboard';
import OrdersManager from './components/orders/OrdersManager';
import MenuManager from './components/menu/MenuManager';
import OrderReception from './components/orders/OrderReception';
import CustomersManager from './components/customers/CustomersManager';
import KitchenManager from './components/kitchen/KitchenManager';
import UserManager from './components/users/UserManager';
import StudentManager from './components/students/StudentManager';
import { FullDayOrdersManager } from './components/fullday/FullDayOrdersManager';
import { OEPOrdersManager } from './components/oep/OEPOrdersManager';
import { LoncheritasOrdersManager } from './components/loncheritas/LoncheritasOrdersManager';
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

  // Pestañas base para todos los usuarios (AHORA INCLUYE 'students')
  const baseTabs = [
    { id: 'reception',    name: '🎯 Recepción' },
    { id: 'orders',       name: '📋 Órdenes' },
    { id: 'fullday',      name: '🎒 FullDay' },
    { id: 'loncheritas',  name: '🍱 Loncheritas' },
    { id: 'oep',          name: '📦 OEP' },
    { id: 'menu',         name: '🍽️ Menú' },
    { id: 'kitchen',      name: '👨‍🍳 Cocina' },
    { id: 'dashboard',    name: '📊 Dashboard' },
    { id: 'customers',    name: '👥 Clientes' },
    { id: 'students',     name: '🎒 Alumnos' }, // <-- MOVIDA AQUÍ PARA TODOS
  ];

  // Solo administradores ven la pestaña de Usuarios (AHORA ES LA ÚNICA EXCLUSIVA)
  const adminTabs = user?.role === 'admin'
    ? [
        { id: 'users',    name: '🔧 Usuarios' }, // Solo 'users' queda como admin
      ]
    : [];

  // Se combinan las pestañas base (que ahora incluye 'students') con las exclusivas de admin
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
            <div className="space-y-6">
              <StatsCards />
              <FullDayDashboard />
              <LoncheritasDashboard />
            </div>
          )}

          {activeTab === 'orders'      && <OrdersManager />}
          {activeTab === 'fullday'     && <FullDayOrdersManager />}
          {activeTab === 'loncheritas' && <LoncheritasOrdersManager />}
          {activeTab === 'oep'         && <OEPOrdersManager />}
          {activeTab === 'menu'        && <MenuManager />}
          {activeTab === 'kitchen'     && <KitchenManager />}
          {activeTab === 'customers'   && <CustomersManager />}
          {activeTab === 'students'    && <StudentManager />}    {/* <-- AHORA ACCESIBLE PARA TODOS */}
          {activeTab === 'users'       && <UserManager />}       {/* <-- SOLO ADMIN */}
        </DashboardLayout>
      </OrderProvider>
    </ProtectedRoute>
  );
}

export default App;