/**
 * Refleja en vivo si `query` coincide con el viewport o las preferencias del
 * sistema actuales (breakpoint, `prefers-reduced-motion`, etc.), usando
 * `useSyncExternalStore` para suscribirse directamente al evento nativo
 * `change` de `MediaQueryList` en vez de sondear con un efecto.
 */
import { useSyncExternalStore } from 'react';

function subscribe(query: string, onChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener('change', onChange);
  return () => mediaQueryList.removeEventListener('change', onChange);
}

function getSnapshot(query: string): boolean {
  return window.matchMedia(query).matches;
}

/**
 * @param query una media query válida, p. ej. `'(min-width: 768px)'`.
 * @returns `true` mientras `query` coincida con el estado actual del navegador.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => getSnapshot(query),
  );
}
