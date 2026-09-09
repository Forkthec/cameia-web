import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { NavItem } from '../NavHeader';
import { TabBar } from './TabBar';

const items: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icon: 'home' },
  { to: '/entrenar/nueva', label: 'Entrenar', icon: 'dumbbell' },
  { label: 'Progreso', icon: 'chart', disabled: true },
  { to: '/perfiles/nuevo', label: 'Perfiles', icon: 'user' },
];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TabBar items={items} label="Navegación principal" />
    </MemoryRouter>,
  );
}

describe('TabBar', () => {
  it('renderiza los cuatro ítems', () => {
    renderAt('/inicio');

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Entrenar')).toBeInTheDocument();
    expect(screen.getByText('Progreso')).toBeInTheDocument();
    expect(screen.getByText('Perfiles')).toBeInTheDocument();
  });

  it('marca como activo el ítem de la ruta actual', () => {
    renderAt('/entrenar/nueva');

    expect(screen.getByRole('link', { name: /Entrenar/ })).toHaveAttribute('aria-current', 'page');
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
