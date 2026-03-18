// ============================================
// ARCHIVO: src/App.tsx
// ACTUALIZADO: Navegación movida al DashboardLayout (sidebar)
// ============================================

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
import BillingManager from './components/billing/BillingManager';
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

  const baseTabs = [
    { id: 'reception',   name: '🎯 Recepción' },
    { id: 'orders',      name: '📋 Órdenes' },
    { id: 'fullday',     name: '🎒 FullDay' },
    { id: 'loncheritas', name: '🍱 Loncheritas' },
    { id: 'oep',         name: '📦 OEP' },
    { id: 'menu',        name: '🍽️ Menú' },
    { id: 'kitchen',     name: '👨‍🍳 Cocina' },
    { id: 'dashboard',   name: '📊 Dashboard' },
    { id: 'customers',   name: '👥 Clientes' },
    { id: 'students',    name: '🎒 Alumnos' },
    { id: 'billing',     name: '🧾 Facturación' },
  ];

  const adminTabs = user?.role === 'admin'
    ? [{ id: 'users', name: '🔧 Usuarios' }]
    : [];

  const tabs = [...baseTabs, ...adminTabs];

  return (
    <ProtectedRoute>
      <OrderProvider refreshOrders={refreshOrders} addNewOrder={addNewOrder}>
        <DashboardLayout
          activeTab={activeTab}
          tabs={tabs}
          onTabChange={setActiveTab}
        >
          {activeTab === 'reception'   && <OrderReception />}
          {activeTab === 'dashboard'   && (
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
          {activeTab === 'students'    && <StudentManager />}
          {activeTab === 'billing'     && <BillingManager />}
          {activeTab === 'users'       && <UserManager />}
        </DashboardLayout>
      </OrderProvider>
    </ProtectedRoute>
  );
}

export default App;
