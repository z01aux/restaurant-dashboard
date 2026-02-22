// ============================================
// NUEVO ARCHIVO: src/contexts/OrderContext.tsx
// ============================================

import React, { createContext, useContext, ReactNode } from 'react';
import { Order } from '../types';

interface OrderContextType {
  refreshOrders: () => Promise<void>;
  addNewOrder: (order: Order) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
  refreshOrders: () => Promise<void>;
  addNewOrder: (order: Order) => void;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({
  children,
  refreshOrders,
  addNewOrder
}) => {
  return (
    <OrderContext.Provider value={{ refreshOrders, addNewOrder }}>
      {children}
    </OrderContext.Provider>
  );
};