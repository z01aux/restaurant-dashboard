// ============================================
// ARCHIVO: src/components/ui/ConfirmModal.tsx
// Modal de confirmación con blur y animaciones suaves
// Mejorado: colores rojo/ámbar, sin barrido lateral
// Corregido: texto repetido eliminado
// ============================================

import React from 'react';
import { AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';

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
          icon: Trash2,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-gradient-to-r from-red-500 to-red-600',
          buttonHover: 'hover:from-red-600 hover:to-red-700',
          borderColor: 'border-red-200',
          accentGradient: 'from-red-500 to-red-600',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          buttonHover: 'hover:from-amber-600 hover:to-orange-600',
          borderColor: 'border-amber-200',
          accentGradient: 'from-amber-500 to-orange-500',
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          buttonBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          buttonHover: 'hover:from-green-600 hover:to-emerald-600',
          borderColor: 'border-green-200',
          accentGradient: 'from-green-500 to-emerald-500',
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
          accentGradient: 'from-blue-500 to-cyan-500',
        };
    }
  };

  const colors = getColors();
  const Icon = colors.icon;

  // Texto del subtítulo según el tipo (sin repetir el mensaje de advertencia)
  const getSubtitle = () => {
    switch (type) {
      case 'danger':
        return 'Confirma para eliminar permanentemente';
      case 'warning':
        return 'Confirma tu decisión';
      case 'success':
        return 'Confirmación requerida';
      default:
        return 'Confirma tu decisión';
    }
  };

  return (
    <>
      {/* Overlay con blur suave */}
      <div 
        className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal de confirmación - animación suave fade + zoom */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl pointer-events-auto animate-in fade-in duration-200 zoom-in-95"
          onClick={e => e.stopPropagation()}
        >
          {/* Header con gradiente según tipo */}
          <div className={`bg-gradient-to-r ${colors.accentGradient} p-5 text-white`}>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{title}</h2>
                <p className="text-xs text-white/80 mt-0.5">{getSubtitle()}</p>
              </div>
            </div>
          </div>

          {/* Contenido - aquí va el mensaje de advertencia */}
          <div className="p-6">
            <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Botones */}
          <div className="border-t border-gray-100 p-4 bg-gray-50 flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium text-sm disabled:opacity-50"
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
                <>
                  <Icon size={16} />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;