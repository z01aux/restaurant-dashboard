// ============================================================
// ARCHIVO: src/components/oep/OEPPaymentModal.tsx (VERSIÓN CORREGIDA)
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { OEPOrder } from '../../types/oep';

interface OEPPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OEPOrder | null;
    onSave: (orderId: string, paymentMethod: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null) => Promise<void>;
}

export const OEPPaymentModal: React.FC<OEPPaymentModalProps> = ({
    isOpen,
    onClose,
    order,
    onSave,
}) => {
    const [selectedMethod, setSelectedMethod] = useState<'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (order) setSelectedMethod(order.payment_method);
    }, [order]);

    if (!isOpen || !order) return null;

    const handleSelectMethod = (value: string) => {
        if (value === 'EFECTIVO' || value === 'YAPE/PLIN' || value === 'TARJETA') {
            setSelectedMethod(value);
        }
    };

    const handleSave = async () => {
        if (selectedMethod === order.payment_method) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            await onSave(order.id, selectedMethod);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Cambiar Método de Pago</h2>
                        <p className="text-sm text-gray-500 mt-1">Pedido #{order.order_number} — {order.customer_name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Monto:</span>
                            <span className="font-bold text-blue-600">S/ {order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">Método actual:</span>
                        <div className="p-3 bg-gray-100 rounded-lg flex items-center space-x-2">
                            {order.payment_method ? (
                                <>
                                    {order.payment_method === 'EFECTIVO' && <DollarSign size={18} className="text-green-600" />}
                                    {order.payment_method === 'YAPE/PLIN' && <Smartphone size={18} className="text-purple-600" />}
                                    {order.payment_method === 'TARJETA' && <CreditCard size={18} className="text-blue-600" />}
                                    <span className="font-medium">{order.payment_method}</span>
                                </>
                            ) : (
                                <span className="font-medium">NO APLICA</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button
                            onClick={() => handleSelectMethod('EFECTIVO')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center space-y-2 ${
                                selectedMethod === 'EFECTIVO'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <DollarSign size={24} className="text-green-600" />
                            <span className="text-sm font-medium">Efectivo</span>
                        </button>

                        <button
                            onClick={() => handleSelectMethod('YAPE/PLIN')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center space-y-2 ${
                                selectedMethod === 'YAPE/PLIN'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <Smartphone size={24} className="text-purple-600" />
                            <span className="text-sm font-medium">Yape/Plin</span>
                        </button>

                        <button
                            onClick={() => handleSelectMethod('TARJETA')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center space-y-2 ${
                                selectedMethod === 'TARJETA'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <CreditCard size={24} className="text-blue-600" />
                            <span className="text-sm font-medium">Tarjeta</span>
                        </button>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedMethod || loading}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-md disabled:opacity-50 font-semibold"
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};