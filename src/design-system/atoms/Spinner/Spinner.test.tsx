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
