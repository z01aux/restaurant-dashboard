// ============================================
// ARCHIVO: src/types/oep.ts
// ACTUALIZADO: Incluye created_by_id y created_by_name
// ============================================

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
    // ── Quién generó el pedido ──────────────
    created_by_id?:   string | null;
    created_by_name?: string | null;
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
    notes: string | null;
    created_at: string;
    updated_at: string;
    // ── Quién generó el pedido ──────────────
    created_by_id?:   string | null;
    created_by_name?: string | null;
}
