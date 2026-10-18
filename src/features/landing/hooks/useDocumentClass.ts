/**
 * Pone una clase en `<html>` mientras el componente que lo llama está
 * montado, y la quita al desmontarlo. La landing lo usa para activar el
 * encaje suave por secciones (`scroll-snap-sections`, `styles/index.css`)
 * solo en su ruta: el `scroll-snap-type` tiene que vivir en el elemento que
 * hace scroll, que es el documento, y dejarlo puesto afectaría al resto de la
 * app después de navegar a `/registro` (CM-329, `SPEC.md` §3.7).
 */
import { useEffect } from 'react';

/**
 * @param className clase a aplicar sobre `document.documentElement`.
 */
export function useDocumentClass(className: string): void {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(className);
    return () => root.classList.remove(className);
  }, [className]);
}
