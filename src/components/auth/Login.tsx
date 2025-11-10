import React, { useState } from 'react';
import { ChefHat, Coffee, Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    const result = await signIn(username, password);
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  const handleDemoLogin = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg mb-4">
            <ChefHat className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Sabores & Sazón
          </h1>
          <p className="text-gray-600 mt-2">Sistema de Gestión - Restaurante</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-sm border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Ingresa tu usuario"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-12"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-4 rounded-lg hover:shadow-md transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Iniciando Sesión...</span>
                </>
              ) : (
                <>
                  <Coffee className="h-5 w-5" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              Cuentas de Demo
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin', 'admin123')}
                disabled={loading}
                className="text-xs bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('mesero1', 'mesero123')}
                disabled={loading}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                Mesero
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('cocina1', 'cocina123')}
                disabled={loading}
                className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                Cocina
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('cajero1', 'cajero123')}
                disabled={loading}
                className="text-xs bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                Cajero
              </button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium">¿Problemas para acceder?</p>
              <p className="mt-1">Contacta al administrador del sistema.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2024 Sabores & Sazón. Sistema de gestión restaurant.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            v1.0 - Autenticación Simple
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
