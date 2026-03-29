// ============================================
// ARCHIVO: src/version.ts
// Obtiene la versión desde package.json de forma dinámica
// ============================================

let VERSION = '2.3.0'; // fallback

// Función para cargar la versión de forma asíncrona
export const loadVersion = async (): Promise<string> => {
  try {
    // En entorno de desarrollo, podemos hacer fetch al package.json
    if (import.meta.env.DEV) {
      const response = await fetch('/package.json');
      if (response.ok) {
        const data = await response.json();
        VERSION = data.version;
        return VERSION;
      }
    }
    
    // En producción, usar la versión inyectada por Vite en build
    if (import.meta.env.VITE_APP_VERSION) {
      VERSION = import.meta.env.VITE_APP_VERSION;
      return VERSION;
    }
    
    return VERSION;
  } catch (error) {
    console.warn('No se pudo cargar la versión, usando fallback:', error);
    return VERSION;
  }
};

// Exportar función síncrona que devuelve la versión actual
export const getVersion = (): string => VERSION;

export default VERSION;