/**
 * Comportamiento observable del primer `Modal` del design system (CM-34):
 * expone título y contenido con la asociación ARIA correcta, cierra con
 * Esc, con clic en el velo y con el botón de cierre, y no cierra con un
 * clic dentro del propio cuadro.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

const baseProps = {
  title: 'Plan Gratis activado',
  closeLabel: 'Cerrar',
  primaryActionLabel: 'Entendido',
  onPrimaryAction: () => {},
};

describe('Modal', () => {
  it('expone el título y el contenido asociados por ARIA', () => {
    render(
      <Modal {...baseProps} onClose={() => {}}>
        Ya puedes empezar a practicar.
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('Plan Gratis activado');
    expect(screen.getByText('Ya puedes empezar a practicar.')).toBeInTheDocument();
  });

  it('cierra con la tecla Esc', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal {...baseProps} onClose={onClose}>
        contenido
      </Modal>,
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cierra al hacer clic en el velo', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal {...baseProps} onClose={onClose}>
        contenido
      </Modal>,
    );

    // El velo es `aria-hidden` a propósito (Esc ya lo cubre para teclado y
    // lector de pantalla — ver TSDoc de `Modal.tsx`), así que no aparece por
    // `getByRole`: se ubica por selector, no por rol accesible.
    const veil = container.querySelector('button[aria-hidden="true"]') as HTMLElement;
    await user.click(veil);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('no cierra al hacer clic dentro del cuadro', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal {...baseProps} onClose={onClose}>
        contenido
      </Modal>,
    );

    await user.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('cierra con el botón de cierre', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal {...baseProps} onClose={onClose}>
        contenido
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('con secondaryActionLabel, muestra el botón secundario antes del primario', () => {
    render(
      <Modal
        {...baseProps}
        onClose={() => {}}
        secondaryActionLabel="Cancelar"
        onSecondaryAction={() => {}}
      >
        contenido
      </Modal>,
    );

    const labels = screen.getAllByRole('button').map((button) => button.textContent);
    expect(labels.indexOf('Cancelar')).toBeLessThan(labels.indexOf('Entendido'));
  });
});
