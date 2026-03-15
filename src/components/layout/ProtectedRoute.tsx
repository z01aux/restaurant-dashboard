import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Login from '../auth/Login';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    console.log('🛡️ ProtectedRoute - Estado:', {
      loading,
      isAuthenticated,
      user: user?.name
    });
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 Usuario no autenticado, mostrando Login');
    return <Login />;
  }

  console.log('✅ Usuario autenticado, mostrando contenido protegido');
  return <>{children}</>;
};

export default ProtectedRoute;
