// ============================================
// ARCHIVO: src/hooks/useFullDayPagination.ts
// Hook para paginación de FullDay (adaptado de usePagination)
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  // Para desktop: paginación tradicional
  const desktopPagination = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    return {
      currentItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, items.length),
      totalItems: items.length
    };
  }, [items, currentPage, itemsPerPage]);

  // Para móvil: carga incremental
  const mobilePagination = useMemo(() => {
    const currentItems = items.slice(0, loadedItems);
    const hasMoreItems = loadedItems < items.length;

    return {
      currentItems,
      hasMoreItems,
      loadedItems,
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