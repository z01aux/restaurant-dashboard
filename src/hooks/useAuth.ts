import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      await signOut();
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // Buscar el usuario por username
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .single();

      if (employeeError || !employee) {
        throw new Error('Usuario no encontrado');
      }

      // ✅ Si el usuario NO tiene email, usar un sistema alternativo
      if (!employee.email) {
        // Para usuarios sin email, usar un sistema de autenticación simple
        // Esto es temporal - podrías implementar tu propio sistema de auth
        throw new Error('Este usuario requiere configuración especial. Contacta al administrador.');
      }

      // Si tiene email, hacer login normal con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: employee.email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
