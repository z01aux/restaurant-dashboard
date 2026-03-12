// ============================================
// ARCHIVO: src/types/oep.ts
// ACTUALIZADO: Soporte para pago MIXTO
// ============================================

export type OEPOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

// ✅ ACTUALIZADO: Añadido 'MIXTO'
export type OEPPaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'MIXTO';

export interface OEPOrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
    category?: string;
}

export interface OEPOrder {
    id: string;
    order_number: string;
    customer_name: string;
    phone: string | null;
    address: string | null;
    items: OEPOrderItem[];
    status: OEPOrderStatus;
    total: number;
    payment_method: OEPPaymentMethod | null;
    // ✅ NUEVO: Desglose de pago mixto
    mixed_efectivo?: number;
    mixed_yape_plin?: number;
    mixed_tarjeta?: number;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface OEPDatabaseOrder {
    id: string;
    order_number: string;
    customer_name: string;
    phone: string | null;
    address: string | null;
    items: OEPOrderItem[];
    status: string;
    total: number;
    payment_method: string | null;
    // ✅ NUEVO
    mixed_efectivo?: number;
    mixed_yape_plin?: number;
    mixed_tarjeta?: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}
