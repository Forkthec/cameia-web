import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renderiza el mensaje recibido', () => {
    render(<Toast>Cambios guardados</Toast>);

    expect(screen.getByRole('status')).toHaveTextContent('Cambios guardados');
  });

  it('variant="error" usa role="alert"', () => {
    render(<Toast variant="error">No se pudo guardar</Toast>);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar');
  });

  it('con onDismiss, el botón de cerrar lo dispara', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <Toast onDismiss={onDismiss} dismissLabel="Cerrar notificación">
        Cambios guardados
      </Toast>,
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('sin onDismiss, no muestra botón de cerrar', () => {
    render(<Toast>Cambios guardados</Toast>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
