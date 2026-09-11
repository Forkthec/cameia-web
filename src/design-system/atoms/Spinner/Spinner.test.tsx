/**
 * Comportamiento observable de `Spinner`, no implementación: que anuncia
 * la carga con `role="status"` y el texto recibido (CLAUDE.md §3.2: todo
 * texto visible entra como prop, sin valor por defecto), y que respeta
 * el tamaño recibido.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('anuncia la carga con role="status" y el texto recibido', () => {
    render(<Spinner label="Cargando resultados" />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando resultados');
  });

  it('respeta el tamaño recibido', () => {
    const { container } = render(<Spinner label="Cargando" size={32} />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '32');
  });
});
