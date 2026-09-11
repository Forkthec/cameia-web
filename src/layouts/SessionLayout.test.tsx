/**
 * Comportamiento observable de `SessionLayout`, no implementación: que
 * renderiza su contenido sin navegación — la sesión de entrevista no
 * comparte el shell autenticado con `NavHeader`/`TabBar` (CLAUDE.md §4).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionLayout } from './SessionLayout';

describe('SessionLayout', () => {
  it('renderiza su contenido sin navegación', () => {
    render(
      <SessionLayout>
        <p>Turno actual</p>
      </SessionLayout>,
    );

    expect(screen.getByText('Turno actual')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
