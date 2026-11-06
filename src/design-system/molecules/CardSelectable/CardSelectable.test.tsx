/**
 * Comportamiento observable de `CardSelectable`, no implementación: que
 * `onClick` refleja el estado seleccionado, y que `disabled` bloquea el
 * evento. La prop `disabled` (comportamiento) es independiente de
 * `state="disabled"` (apariencia): `selected` + `disabled` bloquea el control
 * pero conserva el aspecto de seleccionada, lo que necesita
 * `ProfileMethodSelector` mientras se crea el perfil (CA-2.2.7, DF-004).
 */
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

  it('state="selected" con disabled bloquea el control pero conserva el aspecto de seleccionada (DF-004)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<CardSelectable state="selected" disabled onClick={onClick} title="Llenado Manual" />);
    const card = screen.getByRole('radio', { name: 'Llenado Manual' });

    expect(card).toBeDisabled();
    expect(card).toHaveAttribute('aria-checked', 'true');
    expect(card).toHaveClass('border-brand-base', 'bg-brand-tint');
    expect(card).not.toHaveClass('bg-bg-disabled', 'text-text-disabled');

    await user.click(card);
    expect(onClick).not.toHaveBeenCalled();
  });
});
