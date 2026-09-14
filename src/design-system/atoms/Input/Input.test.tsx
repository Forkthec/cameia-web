/**
 * Comportamiento observable de {@link Input}: que el error se asocia por
 * `aria-describedby`, que `disabled` bloquea la edición, y que `type="textarea"`
 * renderiza el elemento correcto.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('el mensaje de error se asocia al campo por aria-describedby', () => {
    render(<Input state="error" errorMessage="El correo no es válido" />);

    const input = screen.getByRole('textbox');
    const error = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-describedby', error.id);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(error).toHaveTextContent('El correo no es válido');
  });

  it('el texto de ayuda se asocia al campo por aria-describedby cuando no hay error', () => {
    render(<Input helperText="Usa tu correo institucional" />);

    const input = screen.getByRole('textbox');
    const helper = screen.getByText('Usa tu correo institucional');

    expect(input).toHaveAttribute('aria-describedby', helper.id);
  });

  it('disabled bloquea la edición', async () => {
    const user = userEvent.setup();
    render(<Input state="disabled" value="fijo" onChange={() => {}} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();

    await user.type(input, 'x');
    expect(input).toHaveValue('fijo');
  });

  it('type="textarea" renderiza un textarea', () => {
    render(<Input type="textarea" />);

    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  it('describedBy externo se funde con el aria-describedby propio (uso desde FormField)', () => {
    render(<Input helperText="Usa tu correo institucional" describedBy="id-externo" />);

    const input = screen.getByRole('textbox');
    const helper = screen.getByText('Usa tu correo institucional');

    expect(input.getAttribute('aria-describedby')).toBe(`id-externo ${helper.id}`);
  });
});
