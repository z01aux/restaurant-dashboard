// ============================================
// ARCHIVO: src/hooks/useFullDayPagination.ts
// Hook para paginación de FullDay - CORREGIDO para móvil
// ============================================

import { useState, useMemo, useEffect } from 'react';

interface UsePaginationProps {
  items: any[];
  itemsPerPage: number;
  mobileBreakpoint?: number;
}

export const useFullDayPagination = ({ 
  items, 
  itemsPerPage, 
  mobileBreakpoint = 768 
}: UsePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedItems, setLoadedItems] = useState(itemsPerPage);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false
  );

  // Detectar cambio de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  // Resetear paginación cuando cambian los items
  useEffect(() => {
    setCurrentPage(1);
    setLoadedItems(itemsPerPage);
  }, [items.length, itemsPerPage]);

  // Para desktop: paginación tradicional
  const desktopPagination = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    const currentItems = items.slice(startIndex, endIndex);

    return {
      currentItems,
      totalPages,
      currentPage: safeCurrentPage,
      hasNextPage: safeCurrentPage < totalPages,
      hasPrevPage: safeCurrentPage > 1,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, items.length),
      totalItems: items.length
    };
  }, [items, currentPage, itemsPerPage]);

  // Para móvil: carga incremental
  const mobilePagination = useMemo(() => {
    const safeLoadedItems = Math.min(loadedItems, items.length);
    const currentItems = items.slice(0, safeLoadedItems);
    const hasMoreItems = safeLoadedItems < items.length;

    return {
      currentItems,
      hasMoreItems,
      loadedItems: safeLoadedItems,
      totalItems: items.length,
      loadMore: () => {
        setLoadedItems(prev => Math.min(prev + itemsPerPage, items.length));
      },
      reset: () => setLoadedItems(itemsPerPage)
    };
  }, [items, loadedItems, itemsPerPage]);

  const commonMethods = {
    isMobile,
    currentPage,
    setCurrentPage,
    goToPage: (page: number) => setCurrentPage(page),
    nextPage: () => setCurrentPage(prev => prev + 1),
    prevPage: () => setCurrentPage(prev => prev - 1),
    resetPagination: () => {
      setCurrentPage(1);
      setLoadedItems(itemsPerPage);
    }
  };

  if (isMobile) {
    return {
      ...commonMethods,
      ...mobilePagination
    };
  } else {
    return {
      ...commonMethods,
      ...desktopPagination
    };
  }
};

export const isDesktopPagination = (pagination: any): boolean => {
  return !pagination.isMobile;
};

export const isMobilePagination = (pagination: any): boolean => {
  return pagination.isMobile;
};