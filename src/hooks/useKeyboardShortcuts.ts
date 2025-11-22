import { useEffect } from 'react';

interface KeyboardShortcuts {
  [key: string]: (e: KeyboardEvent) => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const isCtrl = e.ctrlKey || e.metaKey; // MetaKey para Mac (Cmd)

      // Combinaciones Ctrl/Cmd + tecla
      if (isCtrl) {
        const shortcutKey = `ctrl+${key}`;
        if (shortcuts[shortcutKey]) {
          e.preventDefault();
          shortcuts[shortcutKey](e);
          return;
        }
      }

      // Teclas individuales (solo números para paginación)
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key](e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
