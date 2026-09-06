import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renderiza título y descripción', () => {
    render(
      <EmptyState title="Sin entrevistas todavía" description="Crea la primera para empezar" />,
    );

    expect(screen.getByText('Sin entrevistas todavía')).toBeInTheDocument();
    expect(screen.getByText('Crea la primera para empezar')).toBeInTheDocument();
  });

  it('con actionLabel/onAction, dispara la acción al hacer clic', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <EmptyState
        title="Sin entrevistas todavía"
        actionLabel="Crear entrevista"
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Crear entrevista' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('sin actionLabel/onAction, no muestra ningún botón', () => {
    render(<EmptyState title="Sin entrevistas todavía" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
