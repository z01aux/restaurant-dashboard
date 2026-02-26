// ============================================
// ARCHIVO: src/utils/dateUtils.ts
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
 */
export const fromLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Obtiene el inicio del día en zona horaria local (00:00:00.000)
 */
export const getStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Obtiene el fin del día en zona horaria local (23:59:59.999)
 */
export const getEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
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
 * Formatea una fecha para mostrar en el formato peruano
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima'
  });
};

/**
 * Formatea una hora para mostrar en formato peruano
 */
export const formatTimeForDisplay = (date: Date): string => {
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Lima'
  });
};

/**
 * Parsea una fecha de la base de datos (string ISO) a Date
 */
export const parseDatabaseDate = (isoString: string): Date => {
  return new Date(isoString);
};
