/**
 * Decide si se muestra la intro de marca de la landing y cuándo retirarla
 * (CM-329, `SPEC.md` §3.7).
 *
 * Reglas:
 * - Se muestra **una sola vez por sesión del navegador**: quien vuelve a `/`
 *   desde `/registro` no la ve otra vez. Se recuerda en `sessionStorage`, que
 *   CLAUDE.md §3.9 permite para preferencias de UI (no es un dato sensible).
 * - Con `prefers-reduced-motion` no se muestra nunca (§10).
 * - Se puede saltar en cualquier momento; `skipped` permite que el hero deje
 *   de esperar a la intro y entre de inmediato.
 * - Se retira sola al terminar su secuencia: el telón termina a los ~2.1 s y
 *   el nodo se desmonta para no dejar una capa invisible encima de la página.
 *
 * Si `sessionStorage` no está disponible (modo privado estricto, cookies
 * bloqueadas) la intro se trata como ya vista: ante la duda, no se interpone
 * entre el usuario y el contenido.
 */
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const STORAGE_KEY = 'cameia:introMarcaVista';
/** Fin del telón (`BrandIntro`: 1.45 s de espera + 0.65 s de animación). */
const INTRO_TOTAL_MS = 2100;

function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Sin almacenamiento la intro se volvería a ver al recargar; es aceptable.
  }
}

/**
 * @returns `visible` mientras la intro está en pantalla, `skipped` si el usuario la saltó, `startedVisible` si arrancó visible en este montaje, y `skip` para saltarla.
 */
export function useBrandIntro(): {
  visible: boolean;
  skipped: boolean;
  startedVisible: boolean;
  skip: () => void;
} {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [startedVisible] = useState(() => !prefersReducedMotion && !hasSeenIntro());
  const [visible, setVisible] = useState(startedVisible);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!startedVisible) return;
    markIntroSeen();
    const timer = window.setTimeout(() => setVisible(false), INTRO_TOTAL_MS);
    return () => window.clearTimeout(timer);
  }, [startedVisible]);

  function skip() {
    setSkipped(true);
    setVisible(false);
  }

  return { visible, skipped, startedVisible, skip };
}
