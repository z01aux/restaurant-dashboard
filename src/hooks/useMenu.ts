import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  category_name?: string;
  category_emoji?: string;
  type: 'food' | 'drink';
  available: boolean;
  image_url?: string;
  sort_order: number;
  is_daily_special: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyMenu, setDailyMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar categorías
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Cargar todos los productos del menú
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories:category_id (
            name,
            emoji
          )
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const itemsWithCategory = (data || []).map(item => ({
        ...item,
        category_name: item.categories?.name,
        category_emoji: item.categories?.emoji
      }));

      setMenuItems(itemsWithCategory);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar menú del día (productos marcados como is_daily_special)
  const fetchDailyMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories:category_id (
            name,
            emoji
          )
        `)
        .eq('is_daily_special', true)
        .eq('available', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const dailyItems = (data || []).map(item => ({
        ...item,
        category_name: item.categories?.name,
        category_emoji: item.categories?.emoji
      }));

      setDailyMenu(dailyItems);
    } catch (error) {
      console.error('Error fetching daily menu:', error);
    }
  };

  // Crear nueva categoría
  const createCategory = async (categoryData: {
    name: string;
    emoji?: string;
    sort_order?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: categoryData.name,
          emoji: categoryData.emoji,
          sort_order: categoryData.sort_order || 0,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Crear nuevo producto
  const createMenuItem = async (menuItemData: {
    name: string;
    description?: string;
    price: number;
    category_id: string;
    type: 'food' | 'drink';
    available?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: menuItemData.name,
          description: menuItemData.description,
          price: menuItemData.price,
          category_id: menuItemData.category_id,
          type: menuItemData.type,
          available: menuItemData.available ?? true,
          is_daily_special: false,
          sort_order: 0
        }])
        .select(`
          *,
          categories:category_id (
            name,
            emoji
          )
        `)
        .single();

      if (error) throw error;

      const itemWithCategory = {
        ...data,
        category_name: data.categories?.name,
        category_emoji: data.categories?.emoji
      };

      setMenuItems(prev => [...prev, itemWithCategory]);
      return { success: true, data: itemWithCategory };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Actualizar producto
  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select(`
          *,
          categories:category_id (
            name,
            emoji
          )
        `)
        .single();

      if (error) throw error;

      const itemWithCategory = {
        ...data,
        category_name: data.categories?.name,
        category_emoji: data.categories?.emoji
      };

      setMenuItems(prev => prev.map(item => 
        item.id === id ? itemWithCategory : item
      ));

      // Si se actualiza el estado de is_daily_special, actualizar dailyMenu
      if (updates.is_daily_special !== undefined) {
        if (updates.is_daily_special) {
          setDailyMenu(prev => [...prev, itemWithCategory]);
        } else {
          setDailyMenu(prev => prev.filter(item => item.id !== id));
        }
      }

      return { success: true, data: itemWithCategory };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Eliminar producto
  const deleteMenuItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMenuItems(prev => prev.filter(item => item.id !== id));
      setDailyMenu(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Marcar/desmarcar como plato del día
  const toggleDailySpecial = async (id: string, isDaily: boolean) => {
    return await updateMenuItem(id, { is_daily_special: isDaily });
  };

  // Obtener productos por categoría
  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

  // Obtener productos del día por categoría (máximo 4 por categoría)
  const getDailyItemsByCategory = (categoryId: string) => {
    return dailyMenu
      .filter(item => item.category_id === categoryId)
      .slice(0, 4); // Limitar a 4 productos por categoría
  };

  // Verificar si una categoría ya tiene 4 platos del día
  const hasMaxDailyItems = (categoryId: string) => {
    return getDailyItemsByCategory(categoryId).length >= 4;
  };

  // Obtener categorías con información de platos del día
  const getCategoriesWithDailyCount = () => {
    return categories.map(category => ({
      ...category,
      daily_items_count: getDailyItemsByCategory(category.id).length,
      max_daily_items: 4
    }));
  };

  // Formatear menú para OrderReception (compatibilidad con versión anterior)
  const getMenuForReception = () => {
    const grouped: { [key: string]: MenuItem[] } = {};
    
    categories.forEach(category => {
      const dailyItems = getDailyItemsByCategory(category.id);
      if (dailyItems.length > 0) {
        grouped[category.name] = dailyItems;
      }
    });

    return grouped;
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
    fetchDailyMenu();
  }, []);

  return {
    // Estados
    menuItems,
    categories,
    dailyMenu,
    loading,

    // Funciones de categorías
    fetchCategories,
    createCategory,

    // Funciones de productos
    fetchMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,

    // Funciones del menú del día
    fetchDailyMenu,
    toggleDailySpecial,
    getItemsByCategory,
    getDailyItemsByCategory,
    hasMaxDailyItems,
    getCategoriesWithDailyCount,
    getMenuForReception,

    // Funciones de utilidad (compatibilidad)
    getAllItems: () => menuItems,
    getCategories: () => categories,
  };
};
