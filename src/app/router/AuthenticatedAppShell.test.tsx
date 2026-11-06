/**
 * Comportamiento observable de `AuthenticatedAppShell` (`CM-194`): conecta
 * `logout`/`isLoggingOut` de `useLogout` con los props `onLogout`/
 * `isLoggingOut` de `AppShell`, y reenvía `progressEnabled` sin alterarlo.
 * `AppShell` se mockea porque su propio comportamiento ya está probado en
 * `layouts/AppShell.test.tsx` — aquí solo importa el cableado.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthenticatedAppShell } from './AuthenticatedAppShell';

const { useLogoutMock } = vi.hoisted(() => ({ useLogoutMock: vi.fn() }));
vi.mock('@/features/auth/hooks/useLogout', () => ({ useLogout: useLogoutMock }));

const { appShellPropsSpy } = vi.hoisted(() => ({ appShellPropsSpy: vi.fn() }));
vi.mock('@/layouts/AppShell', () => ({
  AppShell: (props: Record<string, unknown>) => {
    appShellPropsSpy(props);
    return <p>AppShell renderizado</p>;
  },
}));

describe('AuthenticatedAppShell', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('pasa progressEnabled a AppShell sin alterarlo', () => {
    useLogoutMock.mockReturnValue({ logout: vi.fn(), isLoggingOut: false });

    render(<AuthenticatedAppShell progressEnabled />);

    expect(appShellPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ progressEnabled: true }),
    );
  });

  it('conecta isLoggingOut de useLogout con el prop de AppShell', () => {
    useLogoutMock.mockReturnValue({ logout: vi.fn(), isLoggingOut: true });

    render(<AuthenticatedAppShell />);

    expect(appShellPropsSpy).toHaveBeenCalledWith(expect.objectContaining({ isLoggingOut: true }));
    expect(screen.getByText('AppShell renderizado')).toBeInTheDocument();
  });

  it('el onLogout que recibe AppShell invoca el logout de useLogout', () => {
    // `onLogout` no es la misma referencia que `logout` (se envuelve para
    // no pasar una función que retorna una Promise donde AppShell espera
    // `() => void` — `@typescript-eslint/no-misused-promises`), así que se
    // prueba invocándolo, no comparando identidad de función.
    const logout = vi.fn();
    useLogoutMock.mockReturnValue({ logout, isLoggingOut: false });

    render(<AuthenticatedAppShell />);
    const { onLogout } = appShellPropsSpy.mock.calls[0]?.[0] as { onLogout: () => void };
    onLogout();

    expect(logout).toHaveBeenCalledOnce();
  });
});
