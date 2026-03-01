// =================================================
// ARCHIVO: src/components/orders/OrderReception.tsx (VERSIÓN DE PRUEBA)
// =================================================

import React, { useState } from 'react';

const OrderReception: React.FC = () => {
  // Definición correcta del tipo
  const [activeTab, setActiveTab] = useState<'phone' | 'walk-in' | 'delivery' | 'fullDay' | 'oep'>('phone');

  return (
    <div>
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value as 'phone' | 'walk-in' | 'delivery' | 'fullDay' | 'oep')}
      >
        <option value="phone">📞 Cocina</option>
        <option value="oep">📦 OEP</option>
        <option value="walk-in">👤 Local</option>
        <option value="delivery">🚚 Delivery</option>
        <option value="fullDay">🎒 FullDay</option>
      </select>
      <div>Active Tab: {activeTab}</div>
    </div>
  );
};

export default OrderReception;
