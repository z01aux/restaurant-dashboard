import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<{ [key: string]: MenuItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Cargar categorías y productos
  const loadMenuData = async () => {
    try {
      setLoading(true);
      
      // Cargar categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Cargar productos
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*, categories(name)')
        .order('sort_order', { ascending: true });

      if (menuItemsError) throw menuItemsError;

      // Organizar productos por categoría
      const organizedMenu: { [key: string]: MenuItem[] } = {};
      
      categoriesData?.forEach(category => {
        organizedMenu[category.name] = menuItemsData
          ?.filter(item => item.categories.name === category.name)
          .map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            category: item.categories.name,
            type: item.type,
            available: item.available
          })) || [];
      });

      setCategories(categoriesData || []);
      setMenuItems(organizedMenu);
      
    } catch (error) {
      console.error('Error loading menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo producto
  const createItem = async (itemData: {
    name: string;
    description?: string;
    price: number;
    category: string;
    type: 'food' | 'drink';
    available?: boolean;
  }) => {
    try {
      // Encontrar el ID de la categoría
      const category = categories.find(cat => cat.name === itemData.category);
      if (!category) {
        throw new Error('Categoría no encontrada');
      }

      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: itemData.name.trim(),
          description: itemData.description?.trim(),
          price: itemData.price,
          category_id: category.id,
          type: itemData.type,
          available: itemData.available ?? true
        }])
        .select('*, categories(name)')
        .single();

      if (error) throw error;

      // Actualizar estado local
      const newItem: MenuItem = {
        id: data.id,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: data.categories.name,
        type: data.type,
        available: data.available
      };

      setMenuItems(prev => ({
        ...prev,
        [itemData.category]: [...(prev[itemData.category] || []), newItem]
      }));

      return { success: true, data: newItem };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Actualizar producto
  const updateItem = async (itemId: string, updates: Partial<{
    name: string;
    description?: string;
    price: number;
    category: string;
    type: 'food' | 'drink';
    available: boolean;
  }>) => {
    try {
      // Si cambia la categoría, necesitamos el nuevo category_id
      let categoryId: string | undefined;
      if (updates.category) {
        const category = categories.find(cat => cat.name === updates.category);
        if (!category) {
          throw new Error('Categoría no encontrada');
        }
        categoryId = category.id;
      }

      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (categoryId) {
        updateData.category_id = categoryId;
        delete updateData.category;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', itemId)
        .select('*, categories(name)')
        .single();

      if (error) throw error;

      // Recargar el menú completo para reflejar cambios de categoría
      await loadMenuData();

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Eliminar producto
  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Recargar el menú
      await loadMenuData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Obtener todos los items del menú
  const getAllItems = () => {
    return Object.values(menuItems).flat();
  };

  // Obtener items por categoría
  const getItemsByCategory = (category: string) => {
    return menuItems[category] || [];
  };

  // Obtener todas las categorías
  const getCategories = () => {
    return categories.map(cat => cat.name);
  };

  // Cargar datos al iniciar
  useEffect(() => {
    loadMenuData();
  }, []);

  return {
    menuItems,
    categories,
    loading,
    getAllItems,
    getItemsByCategory,
    getCategories,
    createItem,
    updateItem,
    deleteItem,
    refreshMenu: loadMenuData
  };
};
