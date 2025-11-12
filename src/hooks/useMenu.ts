import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { supabaseService } from '../lib/supabase';

// Función helper para convertir tipos de string a los literales esperados
const normalizeMenuItem = (item: any): MenuItem => {
  return {
    ...item,
    type: item.type === 'food' || item.type === 'drink' ? item.type : 'food'
  };
};

// Función helper para obtener la clave de categoría con emoji
const getCategoryKey = (category: string) => {
  switch (category) {
    case 'Entradas': return '🥗 Entradas';
    case 'Platos de Fondo': return '🍽️ Platos de Fondo';
    case 'Bebidas': return '🥤 Bebidas';
    default: return category;
  }
};

// Datos de fallback para el menú del día con tipos correctos
const dailyMenuOptions: { [key: number]: { [key: string]: MenuItem[] } } = {
  0: {
    '🥗 Entradas': [
      { id: 'E001', name: 'Papa a la Huancaina', category: 'Entradas', price: 4.00, type: 'food', available: true, description: 'Papa amarilla con salsa huancaina' },
      { id: 'E002', name: 'Causa Rellena', category: 'Entradas', price: 4.00, type: 'food', available: true, description: 'Causa de pollo o atún' },
      { id: 'E003', name: 'Tequeños', category: 'Entradas', price: 4.00, type: 'food', available: true, description: '12 unidades con salsa de ají' },
      { id: 'E004', name: 'Anticuchos', category: 'Entradas', price: 4.00, type: 'food', available: true, description: 'Brochetas de corazón' },
    ],
    '🍽️ Platos de Fondo': [
      { id: 'P001', name: 'Lomo Saltado de Pollo', category: 'Platos de Fondo', price: 8.00, type: 'food', available: true, description: 'Salteado con cebolla, tomate' },
      { id: 'P002', name: 'Lomo Saltado de Res', category: 'Platos de Fondo', price: 8.00, type: 'food', available: true, description: 'Salteado con cebolla, tomate' },
      { id: 'P003', name: 'Arroz con Mariscos', category: 'Platos de Fondo', price: 8.00, type: 'food', available: true, description: 'Arroz verde con mix de mariscos' },
      { id: 'P004', name: 'Aji de Gallina', category: 'Platos de Fondo', price: 8.00, type: 'food', available: true, description: 'Pollo en salsa de ají amarillo' },
    ]
  },
  1: {
    '🥗 Entradas': [
      { id: 'E005', name: 'Ceviche Clásico', category: 'Entradas', price: 5.00, type: 'food', available: true, description: 'Pescado marinado en limón' },
      { id: 'E006', name: 'Choros a la Chalaca', category: 'Entradas', price: 4.50, type: 'food', available: true, description: 'Mejillones con cebolla y maíz' },
      { id: 'E007', name: 'Tamal Verde', category: 'Entradas', price: 4.00, type: 'food', available: true, description: 'Tamal relleno de cerdo' },
      { id: 'E008', name: 'Chicharrón de Calamar', category: 'Entradas', price: 5.50, type: 'food', available: true, description: 'Calamares fritos crujientes' },
    ],
    '🍽️ Platos de Fondo': [
      { id: 'P005', name: 'Pescado a la Chorrillana', category: 'Platos de Fondo', price: 9.00, type: 'food', available: true, description: 'Filete de pescado en salsa' },
      { id: 'P006', name: 'Tallarín Saltado', category: 'Platos de Fondo', price: 8.50, type: 'food', available: true, description: 'Tallarines salteados con carne' },
      { id: 'P007', name: 'Seco de Cordero', category: 'Platos de Fondo', price: 9.50, type: 'food', available: true, description: 'Cordero en salsa de cilantro' },
      { id: 'P008', name: 'Rocoto Relleno', category: 'Platos de Fondo', price: 8.00, type: 'food', available: true, description: 'Rocoto relleno de carne' },
    ]
  }
};

// Datos de bebidas constantes
const bebidasConstant: MenuItem[] = [
  { id: 'B001', name: 'Inca Kola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
  { id: 'B002', name: 'Coca Cola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
  { id: 'B003', name: 'Chicha Morada', category: 'Bebidas', price: 8.00, type: 'drink', available: true },
  { id: 'B004', name: 'Limonada', category: 'Bebidas', price: 7.00, type: 'drink', available: true },
];

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<{ [key: string]: MenuItem[] }>({});
  const [currentDailyMenu, setCurrentDailyMenu] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [bebidas, setBebidas] = useState<MenuItem[]>(bebidasConstant);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar menú del día actual desde localStorage o Supabase
      const savedMenuIndex = await supabaseService.getCurrentDailyMenu();
      setCurrentDailyMenu(savedMenuIndex);

      // Intentar cargar bebidas desde Supabase
      let bebidasFromSupabase: MenuItem[] = bebidasConstant;
      try {
        const bebidasData = await supabaseService.getMenuItemsByCategory('Bebidas');
        if (bebidasData && bebidasData.length > 0) {
          bebidasFromSupabase = bebidasData.map(normalizeMenuItem);
        }
      } catch (error) {
        console.warn('No se pudieron cargar las bebidas de Supabase, usando datos locales');
      }

      setBebidas(bebidasFromSupabase);

      // Combinar menú del día con bebidas
      const combinedMenu = {
        ...dailyMenuOptions[savedMenuIndex],
        '🥤 Bebidas': bebidasFromSupabase
      };

      setMenuItems(combinedMenu);

    } catch (error) {
      console.error('Error loading menu data:', error);
      // Fallback a datos completos locales
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    const fallbackMenu = {
      ...dailyMenuOptions[0],
      '🥤 Bebidas': bebidasConstant
    };
    
    setMenuItems(fallbackMenu);
  };

  // Cambiar el menú del día
  const changeDailyMenu = async (menuIndex: number) => {
    try {
      setLoading(true);
      await supabaseService.setDailyMenu(menuIndex);
      
      // Combinar nuevo menú del día con bebidas existentes
      const combinedMenu = {
        ...dailyMenuOptions[menuIndex],
        '🥤 Bebidas': bebidas
      };

      setMenuItems(combinedMenu);
      setCurrentDailyMenu(menuIndex);
    } catch (error) {
      console.error('Error changing daily menu:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el precio de un item
  const updateItemPrice = async (itemId: string, newPrice: number) => {
    try {
      // Actualizar en Supabase
      await supabaseService.updateMenuItemPrice(itemId, newPrice);
      
      // Actualizar estado local
      setMenuItems(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(category => {
          updated[category] = updated[category].map(item =>
            item.id === itemId ? { ...item, price: newPrice } : item
          );
        });
        return updated;
      });
    } catch (error) {
      console.error('Error updating item price:', error);
      throw error;
    }
  };

  // Función para eliminar un item
  const deleteItem = async (itemId: string) => {
    try {
      await supabaseService.deleteMenuItem(itemId);
      
      // Actualizar estado local
      setMenuItems(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(category => {
          updated[category] = updated[category].filter(item => item.id !== itemId);
        });
        return updated;
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  // Función para crear un nuevo item
  const createItem = async (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Si estás usando Supabase:
      const newItem = await supabaseService.createMenuItem(item);
      
      // Recargar el menú para incluir el nuevo item
      await loadInitialData();
      
      return newItem;
    } catch (error) {
      console.error('Error creating item:', error);
      
      // Fallback local (para desarrollo)
      const newItem: MenuItem = {
        ...item,
        id: `NEW-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Agregar al estado local
      setMenuItems(prev => {
        const updated = { ...prev };
        const categoryKey = getCategoryKey(item.category);
        if (!updated[categoryKey]) {
          updated[categoryKey] = [];
        }
        updated[categoryKey].push(newItem);
        return updated;
      });
      
      return newItem;
    }
  };

  // Función para actualizar disponibilidad
  const updateItemAvailability = async (itemId: string, available: boolean) => {
    try {
      await supabaseService.updateMenuItemAvailability(itemId, available);
      
      // Actualizar estado local
      setMenuItems(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(category => {
          updated[category] = updated[category].map(item =>
            item.id === itemId ? { ...item, available } : item
          );
        });
        return updated;
      });
    } catch (error) {
      console.error('Error updating item availability:', error);
      throw error;
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
    return Object.keys(menuItems);
  };

  // Obtener opciones de menú del día
  const getDailyMenuOptions = () => {
    return dailyMenuOptions;
  };

  // Obtener items por tipo
  const getItemsByType = (type: 'food' | 'drink') => {
    return getAllItems().filter(item => item.type === type);
  };

  // Buscar items por término
  const searchItems = (searchTerm: string) => {
    return getAllItems().filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return {
    menuItems,
    getAllItems,
    getItemsByCategory,
    getCategories,
    updateItemPrice,
    deleteItem,
    createItem,
    updateItemAvailability,
    currentDailyMenu,
    changeDailyMenu,
    getDailyMenuOptions,
    getItemsByType,
    searchItems,
    loading
  };
};
