// ============================================
// ARCHIVO: src/components/ui/ConfirmModal.tsx
// Modal de confirmación con blur y animaciones
// ============================================

import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  loading = false,
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-gradient-to-r from-red-500 to-red-600',
          buttonHover: 'hover:from-red-600 hover:to-red-700',
          borderColor: 'border-red-200',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          buttonHover: 'hover:from-amber-600 hover:to-orange-600',
          borderColor: 'border-amber-200',
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          buttonBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          buttonHover: 'hover:from-green-600 hover:to-emerald-600',
          borderColor: 'border-green-200',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          buttonHover: 'hover:from-blue-600 hover:to-cyan-600',
          borderColor: 'border-blue-200',
        };
    }
  };

  const colors = getColors();
  const Icon = colors.icon;

  return (
    <>
      {/* Overlay con blur */}
      <div 
        className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal de confirmación */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header con color según tipo */}
          <div className={`${colors.iconBg} p-5 border-b ${colors.borderColor}`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${colors.iconBg}`}>
                <Icon size={24} className={colors.iconColor} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Botones */}
          <div className="border-t border-gray-100 p-4 bg-gray-50 flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium text-sm transition-all shadow-sm ${colors.buttonBg} ${colors.buttonHover} disabled:opacity-50 flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;