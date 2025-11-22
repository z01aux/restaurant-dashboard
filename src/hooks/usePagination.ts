import { useState, useMemo, useEffect } from 'react';

interface UsePaginationProps {
  items: any[];
  itemsPerPage: number;
  mobileBreakpoint?: number;
}

interface DesktopPagination {
  currentItems: any[];
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

interface MobilePagination {
  currentItems: any[];
  hasMoreItems: boolean;
  loadedItems: number;
  totalItems: number;
  loadMore: () => void;
  reset: () => void;
}

interface CommonPagination {
  isMobile: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
}

type UsePaginationReturn = CommonPagination & (DesktopPagination | MobilePagination);

export const usePagination = ({ 
  items, 
  itemsPerPage, 
  mobileBreakpoint = 768 
}: UsePaginationProps): UsePaginationReturn => {
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

  // Para desktop: paginación tradicional
  const desktopPagination = useMemo((): DesktopPagination => {
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
  const mobilePagination = useMemo((): MobilePagination => {
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

  // Métodos comunes
  const commonMethods: CommonPagination = {
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

  // Combinar según el modo
  if (isMobile) {
    return {
      ...commonMethods,
      ...mobilePagination
    } as UsePaginationReturn;
  } else {
    return {
      ...commonMethods,
      ...desktopPagination
    } as UsePaginationReturn;
  }
};

// Type guards para TypeScript
export const isDesktopPagination = (pagination: any): pagination is CommonPagination & DesktopPagination => {
  return !pagination.isMobile;
};

export const isMobilePagination = (pagination: any): pagination is CommonPagination & MobilePagination => {
  return pagination.isMobile;
};
