/**
 * Retrasa la propagación de un valor que cambia rápido (una tecla, un
 * slider) hasta que pasa `delayMs` sin que vuelva a cambiar. Pensado para no
 * disparar una petición o una validación async en cada cambio intermedio.
 */
import { useEffect, useState } from 'react';

/**
 * @param value valor que cambia rápido (p. ej. lo que el usuario escribe).
 * @param delayMs milisegundos de silencio requeridos antes de propagar `value`.
 * @returns el último `value` recibido, `delayMs` después de que dejó de cambiar.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Cada cambio de `value` limpia el timeout del render anterior y arranca
    // uno nuevo: por eso solo se propaga cuando el valor se queda quieto por
    // `delayMs`, nunca en cada cambio intermedio.
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}
