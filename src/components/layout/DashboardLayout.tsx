// ============================================
// ARCHIVO: src/components/layout/DashboardLayout.tsx
// ACTUALIZADO: Sidebar colapsable en desktop + Drawer en móvil
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Bell, User, Sparkles, LogOut, ChevronLeft, ChevronRight,
  Menu, X, WifiOff,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  tabs: Array<{ id: string; name: string }>;
  onTabChange: (tabId: string) => void;
}

// ── Modal de confirmación de logout ───────────────────────────────────────────
const LogoutModal: React.FC<{ onConfirm: () => void; onCancel: () => void; userName?: string }> = ({
  onConfirm, onCancel, userName
}) => (
  <>
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Icono */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">¿Cerrar sesión?</h2>
          {userName && (
            <p className="text-sm text-gray-500 mt-1 text-center">
              Conectado como <span className="font-semibold text-gray-700">{userName}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-3 text-center leading-relaxed">
            Se cerrará tu sesión y tendrás que volver a iniciarla para acceder al sistema.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-2 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm hover:shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <LogOut size={16} />
            <span>Sí, desconectarme</span>
          </button>
        </div>
      </div>
    </div>
  </>
);

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  tabs,
  onTabChange,
}) => {
  const { user, signOut } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  // Cerrar drawer al hacer resize a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Extraer emoji e texto del nombre del tab ──────────────────────────────
  const getTabParts = (name: string) => {
    const match = name.match(/^(\S+)\s(.+)$/);
    if (match) return { icon: match[1], label: match[2] };
    return { icon: '📋', label: name };
  };

  // ── Sidebar content (compartido entre desktop y drawer móvil) ─────────────
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`flex items-center px-3 py-4 border-b border-white/20 ${
        collapsed && !mobile ? 'justify-center' : 'space-x-3'
      }`}>
        <div className="relative flex-shrink-0">
          <img
            src="/logo_marys.png"
            alt="Mary's"
            className="w-10 h-10 object-contain"
          />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles className="h-1.5 w-1.5 text-white" />
          </div>
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <div className="text-sm font-black bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent leading-tight">
              Mary's
            </div>
            <div className="text-xs text-gray-500 truncate">Restaurant</div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {tabs.map((tab) => {
          const { icon, label } = getTabParts(tab.name);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              title={collapsed && !mobile ? label : undefined}
              className={`
                w-full flex items-center rounded-xl transition-all duration-200 group
                ${collapsed && !mobile
                  ? 'justify-center px-2 py-2.5'
                  : 'space-x-3 px-3 py-2.5'
                }
                ${isActive
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/60 hover:text-red-600'
                }
              `}
            >
              <span className="text-base flex-shrink-0">{icon}</span>
              {(!collapsed || mobile) && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Usuario + Logout */}
      <div className={`border-t border-white/20 p-3 ${
        collapsed && !mobile ? 'flex flex-col items-center space-y-2' : 'space-y-2'
      }`}>
        {/* Info usuario */}
        <div className={`flex items-center ${
          collapsed && !mobile ? 'justify-center' : 'space-x-2 px-1'
        }`}>
          <div className="w-7 h-7 bg-gradient-to-r from-red-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-900 truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
          )}
        </div>

        {/* Botón logout */}
        <button
          onClick={() => setShowLogoutModal(true)}
          title={collapsed && !mobile ? 'Cerrar Sesión' : undefined}
          className={`
            flex items-center rounded-lg text-red-600 hover:bg-red-50 transition-colors text-xs font-medium
            ${collapsed && !mobile
              ? 'justify-center w-full p-2'
              : 'space-x-2 w-full px-2 py-1.5'
            }
          `}
        >
          <LogOut size={15} className="flex-shrink-0" />
          {(!collapsed || mobile) && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 flex">

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
          userName={user?.name}
        />
      )}

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className={`
        hidden lg:flex flex-col flex-shrink-0
        bg-white/80 backdrop-blur-lg border-r border-white/30
        transition-all duration-300 ease-in-out relative
        ${collapsed ? 'w-16' : 'w-52'}
      `}>
        <SidebarContent />

        {/* Botón colapsar */}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
        >
          {collapsed
            ? <ChevronRight size={12} className="text-gray-500" />
            : <ChevronLeft  size={12} className="text-gray-500" />
          }
        </button>
      </aside>

      {/* ── DRAWER MÓVIL ── */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white/95 backdrop-blur-lg z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">Menú</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent mobile />
            </div>
          </div>
        </>
      )}

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header compacto */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-white/30 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-2.5">

            {/* Izquierda: hamburguesa (móvil) + tab activo */}
            <div className="flex items-center space-x-3">
              {/* Botón hamburguesa solo en móvil */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>

              {/* Título del tab activo */}
              <div>
                <h1 className="text-base font-bold text-gray-900">
                  {tabs.find(t => t.id === activeTab)?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            {/* Derecha: usuario + bell (desktop) */}
            <div className="flex items-center space-x-2">
              <button className="relative p-2 text-gray-500 hover:text-red-600 transition-colors">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>
              {/* Info usuario solo desktop — ya está en el sidebar */}
              <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-4 sm:p-5 lg:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-lg border-t border-white/30 px-4 py-2 text-center flex-shrink-0">
          <p className="text-gray-500 text-xs">© 2025 MARY'S RESTAURANT</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
