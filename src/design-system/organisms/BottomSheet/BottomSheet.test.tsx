/**
 * Comportamiento observable del primer `BottomSheet` del design system
 * (`CM-194`, `CA-1.8.1`): expone título y contenido con la asociación ARIA
 * correcta, cierra con Esc y con clic en el velo (no con clic dentro de la
 * hoja), soporta `variant="destructive"` y `primaryActionLoading`, y
 * atrapa/devuelve el foco igual que `Modal` (`CLAUDE.md` §10).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';

const baseProps = {
  title: '¿Seguro que quieres cerrar sesión?',
  primaryActionLabel: 'Cerrar sesión',
  onPrimaryAction: () => {},
  secondaryActionLabel: 'Cancelar',
  onSecondaryAction: () => {},
};

describe('BottomSheet', () => {
  it('expone el título y el contenido asociados por ARIA', () => {
    render(
      <BottomSheet {...baseProps} onClose={() => {}}>
        Perderás cualquier cambio sin guardar.
      </BottomSheet>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('¿Seguro que quieres cerrar sesión?');
    expect(screen.getByText('Perderás cualquier cambio sin guardar.')).toBeInTheDocument();
  });

  it('cierra con la tecla Esc', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <BottomSheet {...baseProps} onClose={onClose}>
        contenido
      </BottomSheet>,
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cierra al hacer clic en el velo', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <BottomSheet {...baseProps} onClose={onClose}>
        contenido
      </BottomSheet>,
    );

    const veil = container.querySelector('button[aria-hidden="true"]') as HTMLElement;
    await user.click(veil);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('no cierra al hacer clic dentro de la hoja', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <BottomSheet {...baseProps} onClose={onClose}>
        contenido
      </BottomSheet>,
    );

    await user.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('invoca onSecondaryAction al hacer clic en "Cancelar"', async () => {
    const user = userEvent.setup();
    const onSecondaryAction = vi.fn();
    render(
      <BottomSheet {...baseProps} onClose={() => {}} onSecondaryAction={onSecondaryAction}>
        contenido
      </BottomSheet>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onSecondaryAction).toHaveBeenCalledOnce();
  });

  it('con variant="destructive", el botón primario usa el estilo destructivo', () => {
    render(
      <BottomSheet {...baseProps} onClose={() => {}} variant="destructive">
        contenido
      </BottomSheet>,
    );

    expect(screen.getByRole('button', { name: 'Cerrar sesión' }).className).toContain(
      'bg-danger-base',
    );
  });

  it('con primaryActionLoading, deshabilita el botón primario y muestra el gerundio', () => {
    render(
      <BottomSheet
        {...baseProps}
        onClose={() => {}}
        primaryActionLoading
        primaryActionLoadingLabel="Cerrando…"
      >
        contenido
      </BottomSheet>,
    );

    expect(screen.getByRole('button', { name: 'Cerrando…' })).toBeDisabled();
  });

  it('el botón primario aparece antes que el secundario (apilados, primario arriba)', () => {
    render(
      <BottomSheet {...baseProps} onClose={() => {}}>
        contenido
      </BottomSheet>,
    );

    const labels = screen.getAllByRole('button').map((button) => button.textContent);
    expect(labels.indexOf('Cerrar sesión')).toBeLessThan(labels.indexOf('Cancelar'));
  });

  it('al montarse, mueve el foco al diálogo', () => {
    render(
      <BottomSheet {...baseProps} onClose={() => {}}>
        contenido
      </BottomSheet>,
    );

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('el foco no se escapa de la hoja al tabular repetidamente', async () => {
    const user = userEvent.setup();
    render(
      <BottomSheet {...baseProps} onClose={() => {}}>
        contenido
      </BottomSheet>,
    );

    const primaryButton = screen.getByRole('button', { name: 'Cerrar sesión' });
    const secondaryButton = screen.getByRole('button', { name: 'Cancelar' });

    primaryButton.focus();
    await user.tab();
    expect(secondaryButton).toHaveFocus();
    await user.tab();
    expect(primaryButton).toHaveFocus();
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
      <BottomSheet {...baseProps} onClose={() => {}}>
        contenido
      </BottomSheet>,
    );
    unmount();

    expect(trigger).toHaveFocus();
  });
});
