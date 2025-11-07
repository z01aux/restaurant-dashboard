import { useState, useEffect } from 'react';
import { MenuItem } from '../types';

// Menú inicial por defecto
const initialMenuData: { [key: string]: MenuItem[] } = {
  '🥗 Entradas': [
    { id: 'E001', name: 'Papa a la Huancaina', category: 'Entradas', price: 18.00, type: 'food', available: true, description: 'Papa amarilla con salsa huancaina' },
    { id: 'E002', name: 'Causa Rellena', category: 'Entradas', price: 16.00, type: 'food', available: true, description: 'Causa de pollo o atún' },
    { id: 'E003', name: 'Tequeños', category: 'Entradas', price: 15.00, type: 'food', available: true, description: '12 unidades con salsa de ají' },
    { id: 'E004', name: 'Anticuchos', category: 'Entradas', price: 22.00, type: 'food', available: true, description: 'Brochetas de corazón' },
  ],
  '🍽️ Platos de Fondo': [
    { id: 'P001', name: 'Lomo Saltado de Pollo', category: 'Platos de Fondo', price: 28.00, type: 'food', available: true, description: 'Salteado con cebolla, tomate' },
    { id: 'P002', name: 'Lomo Saltado de Res', category: 'Platos de Fondo', price: 32.00, type: 'food', available: true, description: 'Salteado con cebolla, tomate' },
    { id: 'P003', name: 'Arroz con Mariscos', category: 'Platos de Fondo', price: 35.00, type: 'food', available: true, description: 'Arroz verde con mix de mariscos' },
    { id: 'P004', name: 'Aji de Gallina', category: 'Platos de Fondo', price: 25.00, type: 'food', available: true, description: 'Pollo en salsa de ají amarillo' },
  ],
  '🥤 Bebidas': [
    { id: 'B001', name: 'Inca Kola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
    { id: 'B002', name: 'Coca Cola 500ml', category: 'Bebidas', price: 6.00, type: 'drink', available: true },
    { id: 'B003', name: 'Chicha Morada', category: 'Bebidas', price: 8.00, type: 'drink', available: true },
    { id: 'B004', name: 'Limonada', category: 'Bebidas', price: 7.00, type: 'drink', available: true },
  ]
};

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<{ [key: string]: MenuItem[] }>({});

  // Cargar menú desde localStorage al iniciar
  useEffect(() => {
    const savedMenu = localStorage.getItem('restaurant-menu');
    if (savedMenu) {
      setMenuItems(JSON.parse(savedMenu));
    } else {
      // Si no hay menú guardado, usar el inicial
      setMenuItems(initialMenuData);
      localStorage.setItem('restaurant-menu', JSON.stringify(initialMenuData));
    }
  }, []);

  // Actualizar menú en localStorage cuando cambie
  useEffect(() => {
    if (Object.keys(menuItems).length > 0) {
      localStorage.setItem('restaurant-menu', JSON.stringify(menuItems));
    }
  }, [menuItems]);

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

  return {
    menuItems,
    getAllItems,
    getItemsByCategory,
    getCategories,
    updateItemPrice,
    deleteItem,
    setMenuItems
  };
};
