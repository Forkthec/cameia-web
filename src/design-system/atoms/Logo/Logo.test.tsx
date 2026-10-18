/**
 * Comportamiento observable de {@link Logo}: que el wordmark se ve en
 * `variant="lockup"` y no en `variant="mark-only"`, que el glifo es
 * decorativo (no duplica el nombre accesible que ya da el texto visible), y
 * que `size="sm"` (CM-186) no cambia el tamaño por defecto que ya usa
 * `AuthLayout`. Desde el logo «Amanecer» (CM-329) también protege que el
 * wordmark se ponga en mayúsculas solo por CSS (el texto, y con él el nombre
 * accesible, sigue siendo el de `common:marca.nombre`) y que la marca de agua
 * no lleve el sol.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './Logo';

describe('Logo', () => {
  it('en variant="lockup" muestra el wordmark recibido', () => {
    render(<Logo wordmarkLabel="cameia" />);

    expect(screen.getByText('cameia')).toBeInTheDocument();
  });

  it('en variant="mark-only" no muestra ningún wordmark', () => {
    render(<Logo variant="mark-only" wordmarkLabel="cameia" />);

    expect(screen.queryByText('cameia')).not.toBeInTheDocument();
  });

  it('sin prop "size", usa el tamaño por defecto del header', () => {
    render(<Logo wordmarkLabel="cameia" />);

    expect(screen.getByText('cameia')).toHaveClass('text-[1.1875rem]');
  });

  it('con size="sm", usa el tamaño más chico del pie de página', () => {
    render(<Logo size="sm" wordmarkLabel="cameia" />);

    expect(screen.getByText('cameia')).toHaveClass('text-[0.9375rem]');
  });

  it('muestra el wordmark en mayúsculas sin cambiar su texto (logo «Amanecer»)', () => {
    render(<Logo wordmarkLabel="cameia" />);

    expect(screen.getByText('cameia')).toHaveClass('uppercase', 'font-brand');
  });

  it('en variant="mark-only" no dibuja el sol (marca de agua)', () => {
    const { container } = render(<Logo variant="mark-only" wordmarkLabel="cameia" />);

    expect(container.querySelector('circle')).not.toBeInTheDocument();
  });
});
