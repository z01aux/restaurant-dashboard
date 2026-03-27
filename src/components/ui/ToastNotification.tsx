// ============================================
// ARCHIVO: src/components/ui/ToastNotification.tsx
// Toast moderno con barra de progreso y animaciones
// ============================================

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, XCircle, Info, AlertTriangle, 
  X
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';

interface ToastNotificationProps {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'success',
  duration = 3000,
  position = 'top-right',
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Animación de progreso
  useEffect(() => {
    if (!isVisible) return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [duration, isVisible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          border: 'border-green-400',
          text: 'text-white',
          progressBg: 'bg-green-300',
          iconBg: 'bg-white/20',
          ring: 'ring-green-400',
        };
      case 'error':
        return {
          icon: XCircle,
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          border: 'border-red-400',
          text: 'text-white',
          progressBg: 'bg-red-300',
          iconBg: 'bg-white/20',
          ring: 'ring-red-400',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          border: 'border-amber-400',
          text: 'text-white',
          progressBg: 'bg-amber-300',
          iconBg: 'bg-white/20',
          ring: 'ring-amber-400',
        };
      case 'info':
      default:
        return {
          icon: Info,
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          border: 'border-blue-400',
          text: 'text-white',
          progressBg: 'bg-blue-300',
          iconBg: 'bg-white/20',
          ring: 'ring-blue-400',
        };
    }
  };

  const colors = getColors();
  const Icon = colors.icon;

  return (
    <div
      className={`fixed z-[100] ${getPositionClasses()} transform transition-all duration-300 ${
        isVisible
          ? 'animate-in slide-in-from-right-full fade-in duration-300'
          : 'animate-out slide-out-to-right-full fade-out duration-200'
      }`}
    >
      <div className={`
        relative overflow-hidden rounded-xl shadow-2xl 
        border ${colors.border} ${colors.bg} ${colors.text}
        backdrop-blur-sm
      `}>
        {/* Barra de progreso animada */}
        <div 
          className={`absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear ${colors.progressBg}`}
          style={{ width: `${progress}%` }}
        />
        
        {/* Contenido */}
        <div className="flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-[380px]">
          {/* Icono con efecto pulso */}
          <div className={`p-1.5 rounded-full ${colors.iconBg} animate-in zoom-in duration-200`}>
            <Icon size={18} className="drop-shadow-sm" />
          </div>
          
          {/* Mensaje */}
          <div className="flex-1">
            <p className="text-sm font-medium leading-tight">{message}</p>
          </div>
          
          {/* Botón cerrar */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 200);
            }}
            className="p-1 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <X size={14} className="opacity-70 hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;