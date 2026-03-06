// ============================================================
// ARCHIVO: src/components/oep/OEPPaymentModal.tsx
// Modal para cambiar método de pago en OEP - VERSIÓN MEJORADA
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, Minus } from 'lucide-react';
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

    const handleSave = async () => {
        if (selectedMethod === order.payment_method) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            await onSave(order.id, selectedMethod);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const paymentOptions = [
        { value: 'EFECTIVO', label: 'Efectivo', icon: DollarSign, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-700' },
        { value: 'YAPE/PLIN', label: 'Yape/Plin', icon: Smartphone, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-500', textColor: 'text-purple-700' },
        { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-500', textColor: 'text-blue-700' },
        { value: 'none', label: 'No Aplica', icon: Minus, color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-400', textColor: 'text-gray-600' }
    ];

    const handleSelectOption = (value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none') => {
        if (value === 'none') {
            setSelectedMethod(null);
        } else {
            setSelectedMethod(value);
        }
    };

    const isSelected = (value: 'EFECTIVO' | 'YAPE/PLIN' | 'TARJETA' | 'none') => {
        return value === 'none' ? selectedMethod === null : selectedMethod === value;
    };

    const getOptionClasses = (option: typeof paymentOptions[0]) => {
        const selected = isSelected(option.value as any);
        return `
            p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2
            ${selected 
                ? `${option.bgColor} ${option.borderColor} shadow-lg scale-105` 
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `;
    };

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
                isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            {/* Modal centrado */}
            <div 
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all duration-300 scale-100 opacity-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <CreditCard size={22} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Cambiar Método de Pago</h2>
                                <p className="text-xs text-blue-100 mt-0.5">Pedido #{order.order_number}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" disabled={loading}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Información del pedido */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600">Cliente:</span>
                            <span className="font-semibold text-gray-900">{order.customer_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Monto:</span>
                            <span className="text-xl font-bold text-blue-600">S/ {order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Método actual */}
                    <div className="mb-5">
                        <span className="text-sm font-medium text-gray-700 block mb-2">Método actual:</span>
                        <div className="p-3 bg-gray-100 rounded-lg flex items-center space-x-3 border border-gray-200">
                            {order.payment_method === 'EFECTIVO' && (
                                <>
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <DollarSign size={18} className="text-green-600" />
                                    </div>
                                    <span className="font-semibold text-green-700">EFECTIVO</span>
                                </>
                            )}
                            {order.payment_method === 'YAPE/PLIN' && (
                                <>
                                    <div className="bg-purple-100 p-2 rounded-full">
                                        <Smartphone size={18} className="text-purple-600" />
                                    </div>
                                    <span className="font-semibold text-purple-700">YAPE/PLIN</span>
                                </>
                            )}
                            {order.payment_method === 'TARJETA' && (
                                <>
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <CreditCard size={18} className="text-blue-600" />
                                    </div>
                                    <span className="font-semibold text-blue-700">TARJETA</span>
                                </>
                            )}
                            {!order.payment_method && (
                                <>
                                    <div className="bg-gray-200 p-2 rounded-full">
                                        <Minus size={18} className="text-gray-600" />
                                    </div>
                                    <span className="font-semibold text-gray-600">NO APLICA</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Selección de nuevo método */}
                    <div className="mb-6">
                        <span className="text-sm font-medium text-gray-700 block mb-3">Seleccionar nuevo método:</span>
                        <div className="grid grid-cols-2 gap-3">
                            {paymentOptions.map((option) => {
                                const Icon = option.icon;
                                const selected = isSelected(option.value as any);
                                
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelectOption(option.value as any)}
                                        disabled={loading}
                                        className={getOptionClasses(option)}
                                    >
                                        <div className={`p-2 rounded-full ${selected ? option.bgColor : 'bg-gray-100'}`}>
                                            <Icon size={24} className={selected ? option.textColor : 'text-gray-600'} />
                                        </div>
                                        <span className={`text-sm font-medium ${selected ? option.textColor : 'text-gray-700'}`}>
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedMethod || loading}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard size={18} />
                                    <span>Actualizar</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};