import React from 'react';
import { Bell, Settings, User, ChefHat, Sparkles } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header moderno */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-md">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Sabores & Sazón
                </h1>
                <p className="text-gray-600 text-sm font-medium">Dashboard Restaurant</p>
              </div>
            </div>

            {/* Navegación y acciones */}
            <div className="flex items-center space-x-6">
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
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 text-gray-600 hover:text-orange-600 transition-colors duration-200">
                  <Settings size={20} />
                </button>
                <button className="flex items-center space-x-3 p-2 pl-4 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 border border-gray-200">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-white/20 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2024 Sabores & Sazón. Hecho con ❤️ para tu restaurant
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
