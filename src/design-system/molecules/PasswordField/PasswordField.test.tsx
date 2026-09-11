/**
 * Comportamiento observable de `PasswordField`, no implementación: que
 * empieza oculta (`type="password"`) y que el botón superpuesto alterna
 * el tipo del campo entre oculto y visible.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('empieza oculta (type="password")', () => {
    render(
      <PasswordField
        showPasswordLabel="Mostrar contraseña"
        hidePasswordLabel="Ocultar contraseña"
      />,
    );

    expect(document.querySelector('input')).toHaveAttribute('type', 'password');
  });

  it('el botón de mostrar/ocultar alterna el tipo del campo', async () => {
    const user = userEvent.setup();
    render(
      <PasswordField
        showPasswordLabel="Mostrar contraseña"
        hidePasswordLabel="Ocultar contraseña"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(document.querySelector('input')).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(document.querySelector('input')).toHaveAttribute('type', 'password');
  });
});
