// ============================================
// ARCHIVO: src/utils/dateUtils.ts
// ============================================

/**
 * Convierte una fecha a string YYYY-MM-DD en zona horaria de Perú
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Crea una fecha a partir de string YYYY-MM-DD en zona horaria de Perú
 * IMPORTANTE: Esto crea la fecha a las 00:00:00 en hora de Perú
 */
export const fromLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Creamos la fecha en hora local de Perú
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date;
};

/**
 * Obtiene el inicio del día en zona horaria de Perú (00:00:00.000)
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
 * Obtiene el fin del día en zona horaria de Perú (23:59:59.999)
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
 * y la ajusta a zona horaria de Perú
 */
export const parseDatabaseDate = (isoString: string): Date => {
  // La fecha de la BD viene en UTC, la convertimos a Date
  const utcDate = new Date(isoString);
  
  // Devolvemos la fecha en UTC, que luego se convertirá automáticamente
  return utcDate;
};

/**
 * Obtiene la fecha actual en Perú
 */
export const getPeruDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
};
