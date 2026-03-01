// ============================================================
// ARCHIVO: src/utils/oepExcelUtils.ts
// Exportación a Excel del módulo OEP
// ============================================================

import * as XLSX from 'xlsx';
import { OEPOrder } from '../types/oep';
import { formatDateForDisplay, formatTimeForDisplay, getStartOfDay, getEndOfDay } from './dateUtils';

export const exportOEPToCSV = (orders: OEPOrder[], fileName: string = 'oep_pedidos') => {
    if (orders.length === 0) {
        alert('No hay pedidos para exportar');
        return;
    }

    const headers = ['Fecha', 'Hora', 'N° Orden', 'Cliente', 'Teléfono', 'Dirección', 'Monto', 'Método Pago', 'Productos'];
    const rows = orders.map(order => [
        formatDateForDisplay(new Date(order.created_at)),
        formatTimeForDisplay(new Date(order.created_at)),
        order.order_number,
        order.customer_name,
        order.phone || '',
        order.address || '',
        order.total.toFixed(2),
        order.payment_method || 'NO APLICA',
        order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportOEPToExcel = (orders: OEPOrder[], tipo: 'today' | 'all' = 'today') => {
    if (orders.length === 0) {
        alert('No hay pedidos para exportar');
        return;
    }

    const data = orders.map(order => ({
        '📅 FECHA': formatDateForDisplay(new Date(order.created_at)),
        '⏰ HORA': formatTimeForDisplay(new Date(order.created_at)),
        '🔢 N° ORDEN': order.order_number,
        '👤 CLIENTE': order.customer_name.toUpperCase(),
        '📞 TELÉFONO': order.phone || '',
        '📍 DIRECCIÓN': order.address || '',
        '💰 MONTO TOTAL': `S/ ${order.total.toFixed(2)}`,
        '💳 MÉTODO PAGO': order.payment_method || 'NO APLICA',
        '📦 PRODUCTOS': order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 30 },
        { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 50 }
    ];

    const nombreHoja = tipo === 'today' ? 'Pedidos del Día' : 'Todos los Pedidos';
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

    const fecha = new Date().toISOString().split('T')[0];
    const tipoText = tipo === 'today' ? 'diarios' : 'todos';
    XLSX.writeFile(wb, `oep_${tipoText}_${fecha}.xlsx`);
};

export const exportOEPByDateRange = (orders: OEPOrder[], startDate: Date, endDate: Date) => {
    const startOfDay = getStartOfDay(startDate);
    const endOfDay = getEndOfDay(endDate);

    const filtered = orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= startOfDay && d <= endOfDay;
    });

    if (filtered.length === 0) {
        alert('No hay pedidos en el rango de fechas seleccionado');
        return;
    }

    const wb = XLSX.utils.book_new();
    const startSt = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const endSt = endDate.toISOString().split('T')[0].replace(/-/g, '');

    // HOJA 1: Resumen general
    const totalOrders = filtered.length;
    const totalVentas = filtered.reduce((s, o) => s + o.total, 0);
    const totalEfectivo = filtered.filter(o => o.payment_method === 'EFECTIVO').reduce((s, o) => s + o.total, 0);
    const totalYape = filtered.filter(o => o.payment_method === 'YAPE/PLIN').reduce((s, o) => s + o.total, 0);
    const totalTarjeta = filtered.filter(o => o.payment_method === 'TARJETA').reduce((s, o) => s + o.total, 0);
    const totalNoAplica = filtered.filter(o => !o.payment_method).reduce((s, o) => s + o.total, 0);

    const summaryData: any[][] = [
        ['REPORTE DE PEDIDOS OEP'],
        ['Período:', `${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
        ['Fecha de generación:', new Date().toLocaleString('es-PE')],
        [],
        ['📊 RESUMEN GENERAL'],
        ['Total de Pedidos', totalOrders],
        ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
        [],
        ['💰 VENTAS POR MÉTODO DE PAGO'],
        ['EFECTIVO', `S/ ${totalEfectivo.toFixed(2)}`, totalVentas > 0 ? `${((totalEfectivo / totalVentas) * 100).toFixed(1)}%` : '0%'],
        ['YAPE/PLIN', `S/ ${totalYape.toFixed(2)}`, totalVentas > 0 ? `${((totalYape / totalVentas) * 100).toFixed(1)}%` : '0%'],
        ['TARJETA', `S/ ${totalTarjeta.toFixed(2)}`, totalVentas > 0 ? `${((totalTarjeta / totalVentas) * 100).toFixed(1)}%` : '0%'],
        ['NO APLICA', `S/ ${totalNoAplica.toFixed(2)}`]
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, '📊 RESUMEN');

    // HOJA 2: Detalle de pedidos
    const detailData: any[][] = [
        ['DETALLE DE PEDIDOS'],
        [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
        [],
        ['FECHA', 'HORA', 'N° ORDEN', 'CLIENTE', 'TELÉFONO', 'DIRECCIÓN', 'MÉTODO PAGO', 'PRODUCTOS', 'TOTAL']
    ];

    [...filtered]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .forEach(order => {
            detailData.push([
                formatDateForDisplay(new Date(order.created_at)),
                formatTimeForDisplay(new Date(order.created_at)),
                order.order_number,
                order.customer_name,
                order.phone || '---',
                order.address || '---',
                order.payment_method || 'NO APLICA',
                order.items.map(item => `${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ''}`).join('\n'),
                `S/ ${order.total.toFixed(2)}`
            ]);
        });

    const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
    wsDetail['!cols'] = [
        { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 30 },
        { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 50 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, '📋 DETALLE');

    // HOJA 3: Top 10 productos
    const productMap = new Map<string, { name: string; quantity: number; total: number }>();
    filtered.forEach(order => {
        order.items.forEach(item => {
            const ex = productMap.get(item.id);
            if (ex) {
                ex.quantity += item.quantity;
                ex.total += item.price * item.quantity;
            } else {
                productMap.set(item.id, { name: item.name, quantity: item.quantity, total: item.price * item.quantity });
            }
        });
    });

    const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)
        .map((p, i) => [i + 1, p.name, p.quantity, `S/ ${p.total.toFixed(2)}`]);

    const wsProducts = XLSX.utils.aoa_to_sheet([
        ['🏆 TOP 10 PRODUCTOS'],
        [`Período: ${formatDateForDisplay(startDate)} al ${formatDateForDisplay(endDate)}`],
        [],
        ['#', 'PRODUCTO', 'CANTIDAD', 'TOTAL VENDIDO'],
        ...topProducts
    ]);
    wsProducts['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsProducts, '🏆 TOP 10');

    XLSX.writeFile(wb, `OEP_${startSt}_al_${endSt}.xlsx`);
};