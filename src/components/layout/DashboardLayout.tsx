import React, { useState } from 'react';
import { Bell, Settings, User, ChefHat, Sparkles, Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header moderno */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center space-x-3">
              {/* Botón menú móvil */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-orange-600"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md">
                    <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Sparkles className="h-1 w-1 sm:h-2 sm:w-2 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                    Sabores & Sazón
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">Dashboard Restaurant</p>
                </div>
              </div>
            </div>

            {/* Stats móviles */}
            <div className="lg:hidden flex items-center space-x-4">
              <div className="text-center">
                <div className="font-semibold text-gray-900 text-sm">12</div>
                <div className="text-gray-600 text-xs">Órdenes</div>
              </div>
            </div>

            {/* Navegación desktop */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Stats rápidos */}
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">12</div>
                  <div className="text-gray-600 text-xs">Órdenes Hoy</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">S/ 1,240</div>
                  <div className="text-gray-600 text-xs">Ingresos</div>
                </div>
              </div>

              {/* Iconos de acción */}
              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors duration-200">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 text-gray-600 hover:text-orange-600 transition-colors duration-200">
                  <Settings size={20} />
                </button>
                <button className="hidden sm:flex items-center space-x-3 p-2 pl-4 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 border border-white/30">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Admin</div>
                    <div className="text-xs text-gray-600">Restaurant</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Perfil móvil */}
            <div className="lg:hidden">
              <button className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-lg border-t border-white/30">
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl border border-white/30">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Admin Restaurant</div>
                  <div className="text-xs text-gray-600">admin@restaurant.com</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="font-semibold text-gray-900">12</div>
                  <div className="text-gray-600 text-xs">Órdenes</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-600">S/ 1,240</div>
                  <div className="text-gray-600 text-xs">Ingresos</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content con padding mejorado para móviles */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Footer sutil */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-white/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-center">
          <p className="text-gray-600 text-xs sm:text-sm">
            © 2024 Sabores & Sazón. Hecho con ❤️ para tu restaurant
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
