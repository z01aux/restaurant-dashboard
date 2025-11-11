import React, { useState } from 'react';
import { ChefHat, Coffee, Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      setIsLoggingIn(false);
      return;
    }

    try {
      const result = await signIn(username, password);
      if (result.success) {
        console.log('✅ Login exitoso, redirigiendo...');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #d97706 100%)'
            }}
          >
            <ChefHat className="h-10 w-10 text-white" />
          </div>
          <h1 
            className="text-3xl font-black mb-2"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            MARY'S RESTAURANT
          </h1>
          <p className="text-gray-600">Sistema de Gestión - Restaurante</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-white/30">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Ingresa tu usuario"
                disabled={isLoggingIn}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors pr-12"
                  placeholder="Ingresa tu contraseña"
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoggingIn}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-lg hover:shadow-md transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-white"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #d97706 100%)'
              }}
            >
              {isLoggingIn ? (
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
            © 2025 MARY'S RESTAURANT
          </p>
          <p className="text-xs text-gray-400 mt-1">
            @JozzyMar
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
