// ============================================================
// ARCHIVO: src/types/oep-sales.ts
// Tipos para caja y cierres del módulo OEP
// ============================================================

export interface OEPTopProduct {
    id: string;
    name: string;
    quantity: number;
    total: number;
    category: string;
}

export interface OEPDailyBreakdown {
    date: string;
    orders: number;
    efectivo: number;
    yapePlin: number;
    tarjeta: number;
    noAplica: number;
    total: number;
}

export interface OEPSalesClosure {
    id: string;
    closure_date: string;
    closure_number: string;
    opened_at: string;
    closed_at: string;
    opened_by: string;
    closed_by: string;
    opened_by_name?: string;
    closed_by_name?: string;
    initial_cash: number;
    final_cash: number;

    total_efectivo: number;
    total_yape_plin: number;
    total_tarjeta: number;
    total_no_aplica: number;

    total_orders: number;
    total_amount: number;

    orders_pending: number;
    orders_preparing: number;
    orders_ready: number;
    orders_delivered: number;
    orders_cancelled: number;

    notes: string;
    top_products: OEPTopProduct[];
    daily_breakdown?: OEPDailyBreakdown[];

    created_at: string;
    updated_at: string;
}

export interface OEPCashRegisterStatus {
    is_open: boolean;
    opened_at: string | null;
    opened_by: string | null;
    opened_by_name?: string;
    initial_cash: number;
    current_cash: number;
    last_closure_id: string | null;
}

export interface OEPDailySummary {
    total_orders: number;
    total_amount: number;
    by_payment_method: {
        EFECTIVO: number;
        YAPE_PLIN: number;
        TARJETA: number;
        NO_APLICA: number;
    };
    by_status: {
        pending: number;
        preparing: number;
        ready: number;
        delivered: number;
        cancelled: number;
    };
    top_products: OEPTopProduct[];
}