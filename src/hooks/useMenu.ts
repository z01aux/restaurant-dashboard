import { useState, useEffect } from 'react';
import { MenuItem } from '../types';

// Datos del menú local (como fallback)
const menuData = {
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
    ],
    '🥤 Bebidas': [
      { id: 'B001', name: 'Inca Kola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
      { id: 'B002', name: 'Coca Cola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
      { id: 'B003', name: 'Chicha Morada', category: 'Bebidas', price: 8.00, type: 'drink', available: true },
      { id: 'B004', name: 'Limonada', category: 'Bebidas', price: 7.00, type: 'drink', available: true },
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
    ],
    '🥤 Bebidas': [
      { id: 'B001', name: 'Inca Kola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
      { id: 'B002', name: 'Coca Cola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
      { id: 'B003', name: 'Chicha Morada', category: 'Bebidas', price: 8.00, type: 'drink', available: true },
      { id: 'B004', name: 'Limonada', category: 'Bebidas', price: 7.00, type: 'drink', available: true },
    ]
  }
};

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<{ [key: string]: MenuItem[] }>({});
  const [currentDailyMenu, setCurrentDailyMenu] = useState<number>(0);

  // Cargar datos iniciales
  useEffect(() => {
    const savedMenuIndex = localStorage.getItem('current-daily-menu');
    const menuIndex = savedMenuIndex ? parseInt(savedMenuIndex) : 0;
    setCurrentDailyMenu(menuIndex);
    setMenuItems(menuData[menuIndex]);
  }, []);

  // Cambiar el menú del día
  const changeDailyMenu = (menuIndex: number) => {
    localStorage.setItem('current-daily-menu', menuIndex.toString());
    setCurrentDailyMenu(menuIndex);
    setMenuItems(menuData[menuIndex]);
  };

  // Función para actualizar el precio de un item
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

  // Función para eliminar un item
  const deleteItem = (itemId: string) => {
    setMenuItems(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].filter(item => item.id !== itemId);
      });
      return updated;
    });
  };

  // Función para crear un nuevo item
  const createItem = async (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
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
    return menuData;
  };

  return {
    menuItems,
    getAllItems,
    getItemsByCategory,
    getCategories,
    updateItemPrice,
    deleteItem,
    createItem, // ✅ Ahora está incluido
    currentDailyMenu,
    changeDailyMenu,
    getDailyMenuOptions,
    loading: false
  };
};
