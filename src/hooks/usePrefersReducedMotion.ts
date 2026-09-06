/**
 * Expone la preferencia de accesibilidad `prefers-reduced-motion` del
 * sistema operativo. CLAUDE.md §10 la hace obligatoria: con ella en
 * `reduce`, las duraciones de animación se van a 0 y el estado «escuchando»
 * se reemplaza por una onda estática con texto en vez de animarse.
 */
import { useMediaQuery } from './useMediaQuery';

/** @returns `true` si el usuario pidió reducir el movimiento en su sistema. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
