import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CardSelectable } from './CardSelectable';

describe('CardSelectable', () => {
  it('dispara onClick y refleja el estado seleccionado', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <CardSelectable
        state="selected"
        onClick={onClick}
        title="Entreno"
        description="Sin presión de tiempo"
      />,
    );
    // El nombre accesible incluye título y descripción (el botón las contiene
    // a ambas como texto), por eso el match es por substring, no exacto.
    const card = screen.getByRole('radio', { name: /Entreno/ });
    expect(card).toHaveAttribute('aria-checked', 'true');

    await user.click(card);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disabled no dispara onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<CardSelectable state="disabled" onClick={onClick} title="Simulación" />);
    await user.click(screen.getByRole('radio', { name: 'Simulación' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
