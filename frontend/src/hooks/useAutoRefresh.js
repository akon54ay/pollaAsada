import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para actualización automática
 * @param {Function} callback - Función a ejecutar en cada intervalo
 * @param {number} interval - Intervalo en milisegundos (default: 5000)
 * @param {Array} dependencies - Dependencias para reiniciar el intervalo
 */
export const useAutoRefresh = (callback, interval = 5000, dependencies = []) => {
  const savedCallback = useRef();

  // Guardar la última callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configurar el intervalo
  useEffect(() => {
    // Llamar inmediatamente
    savedCallback.current();

    // Configurar intervalo
    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, ...dependencies]);
};

export default useAutoRefresh;
