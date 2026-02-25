// ============================================
// ARCHIVO: src/utils/dateUtils.ts
// Utilidades para manejo consistente de fechas
// ============================================

/**
 * Convierte una fecha a string YYYY-MM-DD en zona horaria local
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Crea una fecha a partir de string YYYY-MM-DD en zona horaria local
 * IMPORTANTE: Esto crea la fecha a las 00:00:00 en hora LOCAL
 */
export const fromLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date;
};

/**
 * Obtiene el inicio del día en zona horaria local (00:00:00.000)
 */
export const getStartOfDay = (date: Date): Date => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  );
};

/**
 * Obtiene el fin del día en zona horaria local (23:59:59.999)
 */
export const getEndOfDay = (date: Date): Date => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23, 59, 59, 999
  );
};

/**
 * Compara dos fechas ignorando la hora (solo año, mes, día)
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Formatea una fecha para mostrar en el formato local peruano
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Formatea una hora para mostrar
 */
export const formatTimeForDisplay = (date: Date): string => {
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Parsea una fecha de la base de datos (string ISO) a Date
 * y la ajusta a zona horaria local para comparaciones
 */
export const parseDatabaseDate = (isoString: string): Date => {
  // La fecha de la BD viene en UTC, la convertimos a Date
  const utcDate = new Date(isoString);
  
  // Creamos una nueva fecha con los componentes locales
  return new Date(
    utcDate.getFullYear(),
    utcDate.getMonth(),
    utcDate.getDate(),
    utcDate.getHours(),
    utcDate.getMinutes(),
    utcDate.getSeconds()
  );
};