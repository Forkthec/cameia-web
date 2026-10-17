/**
 * Indica si la página ya bajó más de `offset` píxeles. El header de la landing
 * lo usa para pasar de transparente a asentado (borde y sombra) en cuanto el
 * contenido empieza a pasar por debajo (CM-329, `SPEC.md` §3.7).
 *
 * Se escucha el evento `scroll` (pasivo) y no una animación ligada al scroll
 * en CSS porque `animation-timeline: scroll()` todavía no existe en todos los
 * navegadores objetivo, y el header es lo primero que se ve.
 */
import { useEffect, useState } from 'react';

/**
 * @param offset distancia de scroll vertical, en px, a partir de la cual se considera «bajado».
 * @returns `true` mientras `window.scrollY` supere `offset`.
 */
export function useScrolledPast(offset = 8): boolean {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const update = () => setScrolledPast(window.scrollY > offset);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [offset]);

  return scrolledPast;
}
