/**
 * Ciclado de foco para diálogos modales (`Modal`, `BottomSheet`, `CM-194`).
 * Vive en `utils/`, no en un hook de `hooks/`, porque `design-system` no
 * tiene permiso hacia `hooks` en `boundaries/dependencies`
 * (`eslint.config.js`) — solo hacia `design-system`/`utils`/`lib`/`i18n`.
 * Función pura sobre el DOM, sin estado de React, para que los dos
 * componentes puedan llamarla desde su propio `useEffect`/`onKeyDown` sin
 * duplicar la lógica de ciclado (`CLAUDE.md` §10, foco nunca se escapa de un
 * diálogo abierto).
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * @param container elemento raíz del diálogo (el nodo con `role="dialog"`).
 * @returns los elementos enfocables dentro de `container`, en orden del DOM.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Intercepta `Tab`/`Shift+Tab` para que el foco nunca salga de `container`:
 * al llegar al último elemento enfocable, `Tab` vuelve al primero; al llegar
 * al primero, `Shift+Tab` va al último.
 *
 * @param event el `KeyboardEvent` del `onKeyDown` del diálogo.
 * @param container elemento raíz del diálogo (el nodo con `role="dialog"`).
 */
export function handleFocusTrapKeyDown(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== 'Tab') return;

  const focusable = getFocusableElements(container);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;

  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last || !container.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}
