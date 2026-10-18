/**
 * Indica si la página ya bajó. El header de la landing lo usa para pasar de
 * transparente a asentado (borde y sombra) y, en móvil, para plegar su fila
 * de botones (CM-329, `SPEC.md` §3.7).
 *
 * **Histéresis, no un solo umbral.** Plegar la fila de botones achica el
 * header ~56px; como el header está en el flujo, el contenido sube y el
 * navegador reajusta el scroll (anclaje de scroll y encaje por secciones).
 * Con un único umbral bajo, ese salto devolvía `scrollY` por debajo del
 * umbral, la fila se volvía a desplegar, el contenido bajaba… y el header y
 * todo lo de arriba parpadeaban sin parar en móvil (bug real). Por eso se
 * activa al pasar `enterOffset` y solo se desactiva al volver casi arriba
 * (`exitOffset`): la distancia entre ambos es mayor que el salto que produce
 * el propio cambio.
 *
 * Se escucha el evento `scroll` (pasivo) y no una animación ligada al scroll
 * en CSS porque `animation-timeline: scroll()` todavía no existe en todos los
 * navegadores objetivo, y el header es lo primero que se ve.
 */
import { useEffect, useState } from 'react';

/**
 * @param enterOffset scroll vertical, en px, a partir del cual pasa a `true`.
 * @param exitOffset scroll vertical, en px, por debajo del cual vuelve a `false`.
 * @returns `true` desde que `window.scrollY` supera `enterOffset` hasta que baja de `exitOffset`.
 */
export function useScrolledPast(enterOffset = 80, exitOffset = 4): boolean {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const update = () =>
      setScrolledPast((previous) =>
        previous ? window.scrollY > exitOffset : window.scrollY > enterOffset,
      );
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [enterOffset, exitOffset]);

  return scrolledPast;
}
