import React from 'react';
import { ChevronLeft, ChevronRight, Smartphone, Monitor } from 'lucide-react';

interface PaginationControlsProps {
  // Desktop props
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onPageChange?: (page: number) => void;
  
  // Mobile props
  hasMoreItems?: boolean;
  loadedItems?: number;
  onLoadMore?: () => void;
  
  // Common props
  isMobile: boolean;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onSortChange: (value: string) => void;
  currentSort: string;
  sortOptions: Array<{ value: string; label: string }>;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  // Desktop
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
  hasNextPage = false,
  hasPrevPage = false,
  onPageChange,
  
  // Mobile
  hasMoreItems = false,
  loadedItems = 0,
  onLoadMore,
  
  // Common
  isMobile,
  itemsPerPage,
  onItemsPerPageChange,
  onSortChange,
  currentSort,
  sortOptions
}) => {
  
  // Generar números de página para desktop
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (isMobile) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-lg p-4 border border-gray-200 mb-4">
        <div className="flex flex-col space-y-3">
          {/* Contador */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              {loadedItems} de {totalItems} órdenes
            </span>
          </div>
          
          {/* Botón Cargar Más */}
          {hasMoreItems && (
            <button
              onClick={onLoadMore}
              className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white py-3 rounded-lg hover:shadow-md transition-all duration-300 font-medium"
            >
              ↓ Cargar más órdenes
            </button>
          )}
          
          {/* Controles de Ordenamiento */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={30}>30 por página</option>
            </select>
          </div>
          
          {/* Indicador de Vista Móvil */}
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Smartphone size={14} />
            <span>Vista móvil activa</span>
          </div>
        </div>
      </div>
    );
  }

  // Vista Desktop
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-lg p-4 border border-gray-200 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        {/* Información */}
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{startIndex}-{endIndex}</span> de{' '}
          <span className="font-semibold">{totalItems}</span> órdenes
        </div>
        
        {/* Controles de Paginación */}
        <div className="flex items-center space-x-4">
          {/* Selector de Items por Página */}
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          
          {/* Selector de Ordenamiento */}
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Navegación de Páginas */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={!hasPrevPage}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-red-500 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            
            {totalPages > 5 && currentPage < totalPages - 1 && (
              <button
                onClick={() => onPageChange?.(totalPages)}
                className="w-8 h-8 rounded text-sm font-medium hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {totalPages}
              </button>
            )}
            
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={!hasNextPage}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {/* Indicador de Vista Desktop */}
        <div className="flex items-center space-x-2 text-xs text-gray-500 lg:hidden xl:flex">
          <Monitor size={14} />
          <span>Vista desktop</span>
        </div>
      </div>
    </div>
  );
};
