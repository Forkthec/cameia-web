import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Banner } from './Banner';

describe('Banner', () => {
  it('renderiza el mensaje recibido', () => {
    render(<Banner>Disponible próximamente</Banner>);

    expect(screen.getByRole('status')).toHaveTextContent('Disponible próximamente');
  });

  it('sin actionLabel/onAction, no muestra ninguna acción', () => {
    render(<Banner>Disponible próximamente</Banner>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('con actionLabel y onAction, dispara la acción al hacer clic', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <Banner actionLabel="Saber más" onAction={onAction}>
        Disponible próximamente
      </Banner>,
    );

    await user.click(screen.getByRole('button', { name: 'Saber más' }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
