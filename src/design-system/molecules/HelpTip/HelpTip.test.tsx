/**
 * Protege el botón «?» (CA-6.4.7 del reporte): abre con clic y con el cursor, el clic tras pasar
 * el cursor no lo cierra, se cierra con un segundo clic, con Esc y al tocar fuera, y tiene nombre
 * accesible propio.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { HelpTip } from './HelpTip';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <HelpTip label="Qué mide Ritmo" open={open} onOpenChange={setOpen}>
        Texto de ayuda
      </HelpTip>
      <p>Afuera</p>
    </div>
  );
}

describe('HelpTip', () => {
  it('abre con el teclado y se cierra con Esc', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Texto de ayuda')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Texto de ayuda')).not.toBeInTheDocument();
  });

  it('el clic tras pasar el cursor lo deja abierto y un segundo clic lo cierra', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const button = screen.getByRole('button', { name: 'Qué mide Ritmo' });
    await user.click(button);
    expect(screen.getByText('Texto de ayuda')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.click(button);
    expect(screen.queryByText('Texto de ayuda')).not.toBeInTheDocument();
  });

  it('se cierra al tocar fuera', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Qué mide Ritmo' }));
    await user.click(screen.getByText('Afuera'));
    expect(screen.queryByText('Texto de ayuda')).not.toBeInTheDocument();
  });
});
