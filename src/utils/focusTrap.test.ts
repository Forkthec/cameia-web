/**
 * Contrato de ciclado de foco que protegen `Modal`/`BottomSheet` (`CM-194`,
 * `CLAUDE.md` §10: el foco nunca se escapa de un diálogo abierto): encuentra
 * los elementos enfocables reales del contenedor y cicla `Tab`/`Shift+Tab`
 * entre el primero y el último.
 */
import { describe, expect, it, vi } from 'vitest';
import { getFocusableElements, handleFocusTrapKeyDown } from './focusTrap';

function buildDialog(): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <button id="first">Primero</button>
    <input id="middle" />
    <button id="last">Último</button>
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * `preventDefault` se devuelve aparte (no solo dentro de `event`) para que
 * las pruebas lo aserten como variable suelta, no como acceso a un método de
 * objeto — `@typescript-eslint/unbound-method` marca lo segundo como
 * potencialmente inseguro aunque aquí sea un mock sin `this`.
 */
function makeTabEvent(shiftKey: boolean) {
  const preventDefault = vi.fn();
  const event = { key: 'Tab', shiftKey, preventDefault } as unknown as KeyboardEvent;
  return { event, preventDefault };
}

describe('getFocusableElements', () => {
  it('encuentra los elementos enfocables en el orden del DOM', () => {
    const container = buildDialog();

    const ids = getFocusableElements(container).map((element) => element.id);

    expect(ids).toEqual(['first', 'middle', 'last']);
  });

  it('ignora los elementos deshabilitados', () => {
    const container = buildDialog();
    container.querySelector('#middle')?.setAttribute('disabled', 'true');

    const ids = getFocusableElements(container).map((element) => element.id);

    expect(ids).toEqual(['first', 'last']);
  });
});

describe('handleFocusTrapKeyDown', () => {
  it('con Tab en el último elemento, vuelve el foco al primero', () => {
    const container = buildDialog();
    container.querySelector<HTMLElement>('#last')?.focus();
    const { event, preventDefault } = makeTabEvent(false);

    handleFocusTrapKeyDown(event, container);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement?.id).toBe('first');
  });

  it('con Shift+Tab en el primer elemento, manda el foco al último', () => {
    const container = buildDialog();
    container.querySelector<HTMLElement>('#first')?.focus();
    const { event, preventDefault } = makeTabEvent(true);

    handleFocusTrapKeyDown(event, container);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement?.id).toBe('last');
  });

  it('con Tab en un elemento intermedio, deja que el navegador mueva el foco', () => {
    const container = buildDialog();
    container.querySelector<HTMLElement>('#middle')?.focus();
    const { event, preventDefault } = makeTabEvent(false);

    handleFocusTrapKeyDown(event, container);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('ignora cualquier tecla que no sea Tab', () => {
    const container = buildDialog();
    const preventDefault = vi.fn();
    const event = { key: 'Escape', shiftKey: false, preventDefault } as unknown as KeyboardEvent;

    handleFocusTrapKeyDown(event, container);

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
