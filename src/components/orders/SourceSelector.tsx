// ============================================
// ARCHIVO: src/components/orders/SourceSelector.tsx
// Selector visual de tipo de pedido para OrderReception.
// - layout="pill"  → grid 2×3 en móvil, pills en desktop
// - layout="grid"  → grid 3×2 siempre (panel lateral desktop)
// ============================================

import React from 'react';

type SourceType = 'phone' | 'walk-in' | 'delivery' | 'fullDay' | 'oep' | 'loncheritas';

interface SourceSelectorProps {
  value: SourceType;
  onChange: (value: SourceType) => void;
  layout?: 'pill' | 'grid';
}

const SOURCES: Array<{
  value: SourceType;
  label: string;
  icon: string;
  activeBg: string;
  activeText: string;
  activeRing: string;
}> = [
  { value: 'phone',       label: 'Cocina',      icon: '🍳', activeBg: 'bg-green-500',   activeText: 'text-white', activeRing: 'ring-green-300'   },
  { value: 'walk-in',     label: 'Local',       icon: '👤', activeBg: 'bg-blue-500',    activeText: 'text-white', activeRing: 'ring-blue-300'    },
  { value: 'delivery',    label: 'Delivery',    icon: '🚚', activeBg: 'bg-orange-500',  activeText: 'text-white', activeRing: 'ring-orange-300'  },
  { value: 'fullDay',     label: 'FullDay',     icon: '🎒', activeBg: 'bg-purple-500',  activeText: 'text-white', activeRing: 'ring-purple-300'  },
  { value: 'loncheritas', label: 'Loncheritas', icon: '🍱', activeBg: 'bg-emerald-500', activeText: 'text-white', activeRing: 'ring-emerald-300' },
  { value: 'oep',         label: 'OEP',         icon: '📦', activeBg: 'bg-cyan-500',    activeText: 'text-white', activeRing: 'ring-cyan-300'    },
];

// Botón individual reutilizable
const SourceButton: React.FC<{
  src: typeof SOURCES[0];
  isActive: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}> = ({ src, isActive, onClick, size = 'md' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center rounded-xl transition-all duration-200 select-none
      ${size === 'sm' ? 'py-2 px-1 gap-0.5' : 'py-3 px-1 gap-1'}
      ${isActive
        ? `${src.activeBg} ${src.activeText} shadow-md ring-2 ${src.activeRing} scale-105`
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
      }
    `}
  >
    <span className={size === 'sm' ? 'text-xl' : 'text-2xl'}>{src.icon}</span>
    <span className={`font-semibold leading-tight text-center ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
      {src.label}
    </span>
  </button>
);

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  value,
  onChange,
  layout = 'pill',
}) => {
  if (layout === 'grid') {
    // Grid 3×2 compacto para panel lateral desktop
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {SOURCES.map(src => (
          <SourceButton
            key={src.value}
            src={src}
            isActive={value === src.value}
            onClick={() => onChange(src.value)}
            size="sm"
          />
        ))}
      </div>
    );
  }

  // Móvil/tablet: grid 3×2 más grande y cómodo para dedo
  return (
    <div className="grid grid-cols-3 gap-2">
      {SOURCES.map(src => (
        <SourceButton
          key={src.value}
          src={src}
          isActive={value === src.value}
          onClick={() => onChange(src.value)}
          size="md"
        />
      ))}
    </div>
  );
};
