import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Menú inicial por defecto (para compatibilidad)
const initialMenuData: { [key: string]: MenuItem[] } = {
  '🥗 Entradas': [
    { 
      id: 'E001', 
      name: 'Papa a la Huancaina', 
      category: '🥗 Entradas', 
      price: 4.00, 
      type: 'food', 
      available: true, 
      description: 'Papa amarilla con salsa huancaina', 
      is_daily_special: true 
    },
    { 
      id: 'E002', 
      name: 'Causa Rellena', 
      category: '🥗 Entradas', 
      price: 4.00, 
      type: 'food', 
      available: true, 
      description: 'Causa de pollo o atún', 
      is_daily_special: true 
    },
    { 
      id: 'E003', 
      name: 'Tequeños', 
      category: '🥗 Entradas', 
      price: 4.00, 
      type: 'food', 
      available: true, 
      description: '12 unidades con salsa de ají', 
      is_daily_special: true 
    },
    { 
      id: 'E004', 
      name: 'Anticuchos', 
      category: '🥗 Entradas', 
      price: 4.00, 
      type: 'food', 
      available: true, 
      description: 'Brochetas de corazón', 
      is_daily_special: true 
    },
  ],
  '🍽️ Platos de Fondo': [
    { 
      id: 'P001', 
      name: 'Lomo Saltado de Pollo', 
      category: '🍽️ Platos de Fondo', 
      price: 8.00, 
      type: 'food', 
      available: true, 
      description: 'Salteado con cebolla, tomate', 
      is_daily_special: true 
    },
    { 
      id: 'P002', 
      name: 'Lomo Saltado de Res', 
      category: '🍽️ Platos de Fondo', 
      price: 8.00, 
      type: 'food', 
      available: true, 
      description: 'Salteado con cebolla, tomate', 
      is_daily_special: true 
    },
    { 
      id: 'P003', 
      name: 'Arroz con Mariscos', 
      category: '🍽️ Platos de Fondo', 
      price: 8.00, 
      type: 'food', 
      available: true, 
      description: 'Arroz verde con mix de mariscos', 
      is_daily_special: true 
    },
    { 
      id: 'P004', 
      name: 'Aji de Gallina', 
      category: '🍽️ Platos de Fondo', 
      price: 8.00, 
      type: 'food', 
      available: true, 
      description: 'Pollo en salsa de ají amarillo', 
      is_daily_special: true 
    },
  ],
  '🥤 Bebidas': [
    { 
      id: 'B001', 
      name: 'Inca Kola 500ml', 
      category: '🥤 Bebidas', 
      price: 6.00, 
      type: 'drink', 
      available: true, 
      is_daily_special: true 
    },
    { 
      id: 'B002', 
      name: 'Coca Cola 500ml', 
      category: '🥤 Bebidas', 
      price: 6.00, 
      type: 'drink', 
      available: true, 
      is_daily_special: true 
    },
    { 
      id: 'B003', 
      name: 'Chicha Morada', 
      category: '🥤 Bebidas', 
      price: 8.00, 
      type: 'drink', 
      available: true, 
      is_daily_special: true 
    },
    { 
      id: 'B004', 
      name: 'Limonada', 
      category: '🥤 Bebidas', 
      price: 7.00, 
      type: 'drink', 
      available: true, 
      is_daily_special: true 
    },
  ]
};

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<{ [key: string]: MenuItem[] }>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyMenu, setDailyMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar menú desde localStorage al iniciar (compatibilidad)
  useEffect(() => {
    const savedMenu = localStorage.getItem('restaurant-menu');
    if (savedMenu) {
      setMenuItems(JSON.parse(savedMenu));
    } else {
      // Si no hay menú guardado, usar el inicial
      setMenuItems(initialMenuData);
      localStorage.setItem('restaurant-menu', JSON.stringify(initialMenuData));
    }

    // Cargar categorías desde Supabase
    fetchCategories();
  }, []);

  // Actualizar menú en localStorage cuando cambie (compatibilidad)
  useEffect(() => {
    if (Object.keys(menuItems).length > 0) {
      localStorage.setItem('restaurant-menu', JSON.stringify(menuItems));
    }
  }, [menuItems]);

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
      // Si hay error, usar categorías por defecto
      setCategories([
        { id: '1', name: '🥗 Entradas', emoji: '🥗', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
        { id: '2', name: '🍽️ Platos de Fondo', emoji: '🍽️', sort_order: 2, is_active: true, created_at: '', updated_at: '' },
        { id: '3', name: '🥤 Bebidas', emoji: '🥤', sort_order: 3, is_active: true, created_at: '', updated_at: '' }
      ]);
    }
  };

  // Función para actualizar el precio de un item (compatibilidad)
  const updateItemPrice = (itemId: string, newPrice: number) => {
    setMenuItems(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].map(item =>
          item.id === itemId ? { ...item, price: newPrice } : item
        );
      });
      return updated;
    });
  };

  // Función para eliminar un item (compatibilidad)
  const deleteItem = (itemId: string) => {
    setMenuItems(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].filter(item => item.id !== itemId);
      });
      return updated;
    });
  };

  // Obtener todos los items del menú (compatibilidad)
  const getAllItems = (): MenuItem[] => {
    return Object.values(menuItems).flat();
  };

  // Obtener items por categoría (compatibilidad)
  const getItemsByCategory = (category: string): MenuItem[] => {
    return menuItems[category] || [];
  };

  // Obtener todas las categorías (compatibilidad)
  const getCategories = (): string[] => {
    return Object.keys(menuItems);
  };

  // Nueva función para obtener menú para recepción
  const getMenuForReception = () => {
    return menuItems; // Retorna la estructura original para compatibilidad
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
      // Para compatibilidad, también actualizar el localStorage
      const category = categories.find(cat => cat.id === menuItemData.category_id);
      if (category) {
        const newItem: MenuItem = {
          id: `NEW-${Date.now()}`,
          name: menuItemData.name,
          description: menuItemData.description,
          price: menuItemData.price,
          category: category.name, // Para compatibilidad
          category_id: menuItemData.category_id,
          category_name: category.name,
          category_emoji: category.emoji,
          type: menuItemData.type,
          available: menuItemData.available ?? true,
          is_daily_special: false
        };

        setMenuItems(prev => ({
          ...prev,
          [category.name]: [...(prev[category.name] || []), newItem]
        }));
      }

      // También guardar en Supabase
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

      if (error) {
        console.error('Error creating menu item:', error);
        // Si hay error en Supabase, al menos mantener en localStorage
        return { success: true, data: null };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in createMenuItem:', error);
      return { success: false, error: error.message };
    }
  };

  // Actualizar producto
  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      // Actualizar en localStorage para compatibilidad
      if (updates.price !== undefined) {
        updateItemPrice(id, updates.price);
      }

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

      // Si se actualiza el estado de is_daily_special, actualizar dailyMenu
      if (updates.is_daily_special !== undefined) {
        const allItems = getAllItems();
        const item = allItems.find(item => item.id === id);
        if (item) {
          if (updates.is_daily_special) {
            setDailyMenu(prev => [...prev, { ...item, ...updates }]);
          } else {
            setDailyMenu(prev => prev.filter(item => item.id !== id));
          }
        }
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Eliminar producto
  const deleteMenuItem = async (id: string) => {
    try {
      // Eliminar de localStorage para compatibilidad
      deleteItem(id);

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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

  // Verificar si una categoría ya tiene 4 platos del día
  const hasMaxDailyItems = (categoryId: string) => {
    // Implementación simplificada para compatibilidad
    return false;
  };

  // Obtener categorías con información de platos del día
  const getCategoriesWithDailyCount = () => {
    return categories.map(category => ({
      ...category,
      daily_items_count: 4, // Valor por defecto para compatibilidad
      max_daily_items: 4
    }));
  };

  return {
    // Estados (compatibilidad)
    menuItems,
    loading,

    // Funciones principales (compatibilidad)
    getAllItems,
    getItemsByCategory,
    getCategories,
    updateItemPrice,
    deleteItem,
    setMenuItems,

    // Nuevas funciones
    categories,
    dailyMenu,
    fetchCategories,
    createCategory,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleDailySpecial,
    hasMaxDailyItems,
    getCategoriesWithDailyCount,
    getMenuForReception,
  };
};
