/**
 * Detecta cuándo un elemento entra en el viewport, para disparar los
 * revelados de la landing al hacer scroll (CM-329, `SPEC.md` §3.7). Se
 * dispara una sola vez: una sección ya revelada no vuelve a esconderse al
 * subir, porque repetir la animación cansa en vez de guiar.
 *
 * Sin `IntersectionObserver` (jsdom, navegadores muy viejos) o con
 * `prefers-reduced-motion` (CLAUDE.md §10) el elemento se considera visible
 * desde el inicio: el contenido nunca puede quedar oculto por falta de una
 * API de animación ni esperar a un revelado que el usuario pidió no ver.
 */
import { useCallback, useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * @param threshold fracción del elemento que debe verse para revelarlo.
 * @returns `ref` para el elemento observado e `inView`, `true` desde que se vio por primera vez.
 */
export function useInView<T extends Element>(
  threshold = 0.2,
): {
  ref: (node: T | null) => void;
  inView: boolean;
} {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [node, setNode] = useState<T | null>(null);
  const [seen, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  const inView = seen || prefersReducedMotion;

  useEffect(() => {
    if (!node || inView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      // El margen inferior negativo adelanta un poco el disparo respecto al
      // borde real: la animación empieza cuando el elemento ya está a la
      // vista, no cuando asoma un píxel.
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, inView, threshold]);

  const ref = useCallback((element: T | null) => setNode(element), []);

  return { ref, inView };
}
