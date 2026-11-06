/**
 * Comportamiento observable del primer `Modal` del design system (CM-34):
 * expone título y contenido con la asociación ARIA correcta, cierra con
 * Esc, con clic en el velo y con el botón de cierre, y no cierra con un
 * clic dentro del propio cuadro. `CM-194` (Cerrar sesión, `CA-1.8.1`) suma:
 * `variant="destructive"` en el botón primario, `primaryActionLoading`, y
 * que el foco se mueve al diálogo al abrir, se atrapa dentro de él y vuelve
 * al elemento anterior al cerrar (`CLAUDE.md` §10).
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

  it('con variant="destructive", el botón primario usa el estilo destructivo', () => {
    render(
      <Modal {...baseProps} onClose={() => {}} variant="destructive">
        contenido
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Entendido' }).className).toContain('bg-danger-base');
  });

  it('con primaryActionLoading, deshabilita el botón primario y muestra el gerundio', () => {
    render(
      <Modal
        {...baseProps}
        onClose={() => {}}
        primaryActionLoading
        primaryActionLoadingLabel="Cerrando…"
      >
        contenido
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Cerrando…' })).toBeDisabled();
  });

  it('al montarse, mueve el foco al diálogo', () => {
    render(
      <Modal {...baseProps} onClose={() => {}}>
        contenido
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('el foco no se escapa del diálogo al tabular repetidamente', async () => {
    const user = userEvent.setup();
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

    const closeButton = screen.getByRole('button', { name: 'Cerrar' });
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    const primaryButton = screen.getByRole('button', { name: 'Entendido' });

    closeButton.focus();
    await user.tab();
    expect(cancelButton).toHaveFocus();
    await user.tab();
    expect(primaryButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('al desmontarse, devuelve el foco al elemento que lo tenía antes de abrirse', () => {
    render(
      <div>
        <button type="button">Abrir</button>
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    trigger.focus();

    const { unmount } = render(
      <Modal {...baseProps} onClose={() => {}}>
        contenido
      </Modal>,
    );
    unmount();

    expect(trigger).toHaveFocus();
  });
});
