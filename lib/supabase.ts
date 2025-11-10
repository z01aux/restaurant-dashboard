import { createClient } from '@supabase/supabase-js';

// Configuración para diferentes entornos
const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  };
};

const config = getSupabaseConfig();
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, config.options);

// ... (los tipos permanecen igual)