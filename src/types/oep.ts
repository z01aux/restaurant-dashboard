// ============================================================
// ARCHIVO: src/types/oep.ts
// Tipos para el módulo OEP (basado en clientes)
// ============================================================

export type OEPOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OEPPaymentMethod = 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA';

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
    customer_id: string | null;
    customer_name: string;
    phone: string | null;
    address: string | null;
    items: OEPOrderItem[];
    status: OEPOrderStatus;
    total: number;
    payment_method: OEPPaymentMethod | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

// Tipo de la base de datos (antes de convertir fechas)
export interface OEPDatabaseOrder {
    id: string;
    order_number: string;
    customer_id: string | null;
    customer_name: string;
    phone: string | null;
    address: string | null;
    items: OEPOrderItem[];
    status: string;
    total: number;
    payment_method: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// Tipo para el resumen de caja
export interface OEPDailySummary {
    total_orders: number;
    total_amount: number;
    by_payment_method: {
        EFECTIVO: number;
        YAPE_PLIN: number;
        TARJETA: number;
        NO_APLICA: number;
    };
    top_products: Array<{
        name: string;
        quantity: number;
        total: number;
    }>;
}