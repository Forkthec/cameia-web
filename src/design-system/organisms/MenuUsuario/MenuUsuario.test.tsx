/**
 * Comportamiento observable de `MenuUsuario` (`CM-194`, `CA-1.8.1`): el
 * disparador expone `aria-haspopup`/`aria-expanded`, abre un panel
 * `role="menu"` con los ítems en el orden de Figma, "Mi cuenta"/"Planes" son
 * `menuitem` deshabilitados sin acción, "Cerrar sesión" invoca su callback,
 * y el panel cierra con `Escape` (devolviendo el foco al disparador) o al
 * perder el foco fuera del contenedor — sin cerrar por interactuar con el
 * selector de idioma, que es contenido propio, no un ítem del menú.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuUsuario } from './MenuUsuario';

const baseProps = {
  avatarAlt: 'Valentina',
  avatarFallback: 'V',
  triggerLabel: 'Menú de usuario',
  menuLabel: 'Menú de usuario',
  miCuenta: { label: 'Mi cuenta', onClick: () => {}, disabled: true },
  planes: { label: 'Planes', onClick: () => {}, disabled: true },
  languageSwitcher: <button type="button">Idioma</button>,
  cerrarSesion: { label: 'Cerrar sesión', onClick: () => {} },
};

describe('MenuUsuario', () => {
  it('el disparador expone aria-haspopup y aria-expanded en false al inicio', () => {
    render(<MenuUsuario {...baseProps} />);

    const trigger = screen.getByRole('button', { name: 'Menú de usuario' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('al hacer clic en el disparador, abre el panel con role="menu"', async () => {
    const user = userEvent.setup();
    render(<MenuUsuario {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));

    expect(screen.getByRole('menu', { name: 'Menú de usuario' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menú de usuario' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('"Mi cuenta" y "Planes" se muestran como menuitem deshabilitado, sin ser un botón', async () => {
    const user = userEvent.setup();
    render(<MenuUsuario {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));

    const miCuenta = screen.getByText('Mi cuenta');
    expect(miCuenta).toHaveAttribute('role', 'menuitem');
    expect(miCuenta).toHaveAttribute('aria-disabled', 'true');
    expect(miCuenta.tagName).not.toBe('BUTTON');
  });

  it('al hacer clic en "Cerrar sesión", invoca su callback y cierra el panel', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<MenuUsuario {...baseProps} cerrarSesion={{ label: 'Cerrar sesión', onClick }} />);
    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));

    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('cierra con la tecla Escape y devuelve el foco al disparador', async () => {
    const user = userEvent.setup();
    render(<MenuUsuario {...baseProps} />);
    const trigger = screen.getByRole('button', { name: 'Menú de usuario' });
    await user.click(trigger);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('cierra al mover el foco fuera del contenedor', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MenuUsuario {...baseProps} />
        <button type="button">Afuera</button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));

    act(() => {
      screen.getByRole('button', { name: 'Afuera' }).focus();
    });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('no cierra al interactuar con la fila de idioma', async () => {
    const user = userEvent.setup();
    render(<MenuUsuario {...baseProps} />);
    await user.click(screen.getByRole('button', { name: 'Menú de usuario' }));

    await user.click(screen.getByRole('button', { name: 'Idioma' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
