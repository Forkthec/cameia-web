/**
 * Comportamiento observable de `NavHeader`, no implementación: que
 * renderiza los ítems recibidos, marca como activo el de la ruta
 * actual, que un ítem `disabled` deja de ser un enlace real (no un
 * enlace deshabilitado visualmente pero navegable), y que expone un
 * nombre accesible para la barra completa.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { NavHeader, type NavItem } from './NavHeader';

const items: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icon: 'home' },
  { to: '/entrenar/nueva', label: 'Entrenar', icon: 'dumbbell' },
  { label: 'Progreso', icon: 'chart', disabled: true },
  { to: '/perfiles/nuevo', label: 'Perfiles', icon: 'user' },
];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NavHeader items={items} label="Navegación principal" />
    </MemoryRouter>,
  );
}

describe('NavHeader', () => {
  it('renderiza los cuatro ítems', () => {
    renderAt('/inicio');

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Entrenar')).toBeInTheDocument();
    expect(screen.getByText('Progreso')).toBeInTheDocument();
    expect(screen.getByText('Perfiles')).toBeInTheDocument();
  });

  it('marca como activo el ítem de la ruta actual', () => {
    renderAt('/inicio');

    expect(screen.getByRole('link', { name: /Inicio/ })).toHaveAttribute('aria-current', 'page');
  });

  it('un ítem disabled no es un enlace', () => {
    renderAt('/inicio');

    expect(screen.queryByRole('link', { name: /Progreso/ })).not.toBeInTheDocument();
    expect(screen.getByText('Progreso')).toHaveAttribute('aria-disabled', 'true');
  });

  it('expone un nombre accesible para la barra completa', () => {
    renderAt('/inicio');

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
  });
});
