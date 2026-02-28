// ============================================
// ARCHIVO: src/hooks/useCategories.ts
// Hook unificado para gestionar categorías
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      
      const categoryNames = data?.map(item => item.name) || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (name: string) => {
    try {
      // Obtener el sort_order actual
      const { data: existing } = await supabase
        .from('categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 1;

      const { error } = await supabase
        .from('categories')
        .insert([{ 
          name: name.trim(),
          sort_order: nextSortOrder
        }]);

      if (error) throw error;
      
      await fetchCategories();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (oldName: string, newName: string) => {
    try {
      // Actualizar en tabla categories
      const { error: catError } = await supabase
        .from('categories')
        .update({ name: newName.trim() })
        .eq('name', oldName);

      if (catError) throw catError;

      // Actualizar en menu_items
      const { error: menuError } = await supabase
        .from('menu_items')
        .update({ category: newName.trim() })
        .eq('category', oldName);

      if (menuError) throw menuError;
      
      await fetchCategories();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (categoryName: string) => {
    try {
      // Mover productos a "Sin categoría"
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ category: 'Sin categoría' })
        .eq('category', categoryName);

      if (updateError) throw updateError;

      // Eliminar categoría
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName);

      if (error) throw error;
      
      await fetchCategories();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [fetchCategories]);

  // Función para refrescar categorías (alias de fetchCategories)
  const refreshCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    fetchCategories,
    refreshCategories, // <-- AGREGADO
    createCategory,
    updateCategory,
    deleteCategory
  };
};