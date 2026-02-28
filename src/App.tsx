// ============================================
// ARCHIVO: src/App.tsx (ACTUALIZADO)
// NUEVO ORDEN: Recepción, Órdenes, FullDay, Menú, Cocina, Dashboard, Clientes, Alumnos, Usuarios
// BARRA DE NAVEGACIÓN MEJORADA - SE ADAPTA AUTOMÁTICAMENTE
// ============================================

import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import StatsCards from './components/dashboard/StatsCards';
import OrdersManager from './components/orders/OrdersManager';
import MenuManager from './components/menu/MenuManager';
import OrderReception from './components/orders/OrderReception';
import CustomersManager from './components/customers/CustomersManager';
import KitchenManager from './components/kitchen/KitchenManager';
import UserManager from './components/users/UserManager';
import StudentManager from './components/students/StudentManager';
import { FullDayOrdersManager } from './components/fullday/FullDayOrdersManager';
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

  // Pestañas base para todos los usuarios - NUEVO ORDEN
  const baseTabs = [
    { id: 'reception', name: '🎯 Recepción', shortName: '🎯' },
    { id: 'orders', name: '📋 Órdenes', shortName: '📋' },
    { id: 'fullday', name: '🎒 FullDay', shortName: '🎒' },
    { id: 'menu', name: '🍽️ Menú', shortName: '🍽️' },
    { id: 'kitchen', name: '👨‍🍳 Cocina', shortName: '👨‍🍳' },
    { id: 'dashboard', name: '📊 Dashboard', shortName: '📊' },
    { id: 'customers', name: '👥 Clientes', shortName: '👥' },
  ];

  // Solo administradores ven Alumnos y Usuarios - NUEVO ORDEN
  const adminTabs = user?.role === 'admin' 
    ? [
        { id: 'students', name: '🎒 Alumnos', shortName: '🎒' },
        { id: 'users', name: '🔧 Usuarios', shortName: '🔧' },
      ]
    : [];

  const tabs = [...baseTabs, ...adminTabs];

  return (
    <ProtectedRoute>
      <OrderProvider refreshOrders={refreshOrders} addNewOrder={addNewOrder}>
        <DashboardLayout>
          {/* Navigation Tabs MEJORADA - SE ADAPTA AUTOMÁTICAMENTE */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-1 sm:p-2 w-full mx-auto">
              {/* Contenedor con scroll horizontal suave en móvil */}
              <div className="overflow-x-auto pb-1 hide-scrollbar">
                <nav className="flex space-x-1 min-w-max sm:min-w-0 sm:justify-center">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-none px-3 sm:px-4 py-2 sm:py-3 
                        rounded-lg sm:rounded-xl font-semibold 
                        text-xs sm:text-sm 
                        transition-all duration-300 whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md scale-105 sm:scale-100'
                          : 'text-gray-600 hover:text-red-600 hover:bg-white/50'
                        }
                      `}
                      title={tab.name} // Tooltip en móvil
                    >
                      {/* En móvil: emoji + texto corto para algunas pestañas */}
                      <span className="sm:hidden">
                        {tab.shortName}
                        {tab.id === 'reception' && ' Recep'}
                        {tab.id === 'orders' && ' Ord'}
                        {tab.id === 'fullday' && ' Full'}
                        {tab.id === 'menu' && ' Menú'}
                        {tab.id === 'kitchen' && ' Cocina'}
                        {tab.id === 'dashboard' && ' Dash'}
                        {tab.id === 'customers' && ' Client'}
                        {tab.id === 'students' && ' Alum'}
                        {tab.id === 'users' && ' User'}
                      </span>
                      {/* En desktop: nombre completo */}
                      <span className="hidden sm:inline">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Indicador de scroll en móvil (solo si hay scroll) */}
              <div className="sm:hidden flex justify-center mt-1">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                </div>
                <span className="text-[8px] text-gray-400 ml-1">desliza para ver más</span>
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
