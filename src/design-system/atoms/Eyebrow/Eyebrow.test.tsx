/**
 * Comportamiento observable de {@link Eyebrow} (CM-329): muestra el texto
 * recibido; `section` antepone el índice con dos dígitos; `tagline` antepone
 * un punto decorativo que no aporta texto accesible.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eyebrow } from './Eyebrow';

describe('Eyebrow', () => {
  it('en variant="tagline" muestra el texto con un punto decorativo', () => {
    const { container } = render(<Eyebrow>Practica. Mejora. Avanza.</Eyebrow>);

    expect(screen.getByText('Practica. Mejora. Avanza.')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('en variant="section" antepone el índice con dos dígitos', () => {
    render(
      <Eyebrow variant="section" index={3}>
        Cómo funciona
      </Eyebrow>,
    );

    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('Cómo funciona')).toBeInTheDocument();
  });
});
