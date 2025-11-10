import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = () => {
    try {
      const savedUser = localStorage.getItem('restaurant-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem('restaurant-user');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, _password: string) => { // ✅ Cambiado a _password
    try {
      setLoading(true);
      console.log('🔐 [DEBUG 1] Iniciando login para:', username);
      
      // DEBUG: Probar conexión básica primero
      console.log('🔐 [DEBUG 2] Probando conexión a Supabase...');
      const { data: testData, error: testError } = await supabase
        .from('employees')
        .select('count')
        .limit(1);

      console.log('🔐 [DEBUG 3] Test conexión:', { testData, testError });

      // Buscar usuario por username
      console.log('🔐 [DEBUG 4] Buscando usuario:', username);
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .eq('is_active', true)
        .single();

      console.log('🔐 [DEBUG 5] Resultado completo:', {
        employee,
        error,
        errorDetails: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null,
        hasData: !!employee,
        usernameBuscado: username.trim().toLowerCase()
      });

      if (error) {
        console.error('🔐 [DEBUG 6] Error específico:', error);
        if (error.code === 'PGRST116') {
          throw new Error(`No se encontró el usuario "${username}" en la base de datos`);
        } else {
          throw new Error(`Error de conexión: ${error.message}`);
        }
      }

      if (!employee) {
        console.error('🔐 [DEBUG 7] Employee es null/undefined');
        throw new Error('Usuario no existe en el sistema');
      }

      console.log('✅ [DEBUG 8] USUARIO ENCONTRADO:', {
        id: employee.id,
        username: employee.username,
        name: employee.name,
        role: employee.role,
        is_active: employee.is_active
      });

      // ✅ CUALQUIER CONTRASEÑA VÁLIDA
      console.log('🔐 [DEBUG 9] Contraseña aceptada');
      
      // Guardar sesión
      localStorage.setItem('restaurant-user', JSON.stringify(employee));
      setUser(employee);
      
      console.log('🎉 [DEBUG 10] LOGIN EXITOSO');
      return { success: true, error: null };
      
    } catch (error: any) {
      console.error('💥 [DEBUG 11] ERROR FINAL:', error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('restaurant-user');
      setUser(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
};
