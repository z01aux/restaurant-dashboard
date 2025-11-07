import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import StatsCards from './components/dashboard/StatsCards';
import OrdersManager from './components/orders/OrdersManager';
import MenuManager from './components/menu/MenuManager';
import OrderReception from './components/orders/OrderReception';
import CustomersManager from './components/customers/CustomersManager';

function App() {
  const [activeTab, setActiveTab] = React.useState('reception');

  // Tabs para móvil y desktop - Agregada pestaña de Clientes
  const tabs = [
    { id: 'reception', name: '🎯 Recepción', shortName: '🎯' },
    { id: 'dashboard', name: '📊 Dashboard', shortName: '📊' },
    { id: 'orders', name: '📋 Órdenes', shortName: '📋' },
    { id: 'menu', name: '🍽️ Menú', shortName: '🍽️' },
    { id: 'customers', name: '👥 Clientes', shortName: '👥' },
  ];

  return (
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
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-white/50'
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

      {/* ✅ CORREGIDO: Solo OrdersManager en la pestaña Órdenes */}
      {activeTab === 'orders' && <OrdersManager />}
      
      {activeTab === 'menu' && <MenuManager />}
      {activeTab === 'customers' && <CustomersManager />}
    </DashboardLayout>
  );
}

export default App;
