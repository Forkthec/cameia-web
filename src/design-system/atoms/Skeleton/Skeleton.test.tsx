/**
 * Comportamiento observable de `Skeleton`, no implementación: que es un
 * bloque puramente decorativo, oculto para lectores de pantalla — no debe
 * anunciarse como contenido real mientras carga.
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renderiza un bloque decorativo oculto para lectores de pantalla', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveClass('h-4', 'w-32');
  });
});
