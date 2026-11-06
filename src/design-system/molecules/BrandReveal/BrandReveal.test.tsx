/**
 * Protege la firma animada de la marca: es decorativa (CLAUDE.md §10) y
 * pinta el wordmark letra por letra y el lema que recibe por props
 * (CLAUDE.md §14.7: sin textos propios).
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandReveal } from './BrandReveal';

describe('BrandReveal', () => {
  it('queda oculta para lectores de pantalla', () => {
    const { container } = render(<BrandReveal wordmark="cameia" tagline="Lema" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('pinta una pieza por letra del wordmark y el lema', () => {
    const { container } = render(<BrandReveal wordmark="cameia" tagline="Lema" />);
    expect(container.textContent).toContain('Lema');
    expect(container.querySelectorAll('.inline-block')).toHaveLength(6);
  });
});
