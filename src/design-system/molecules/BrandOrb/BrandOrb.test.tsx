/**
 * Protege el contrato del orbe de marca: es decorativo (no lee nada a un
 * lector de pantalla, CLAUDE.md §10) y cada estado dibuja su señal propia.
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandOrb } from './BrandOrb';

describe('BrandOrb', () => {
  it('queda oculto para lectores de pantalla', () => {
    const { container } = render(<BrandOrb state="idle" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('expone el estado en data-state', () => {
    const { container } = render(<BrandOrb state="processing" />);
    expect(container.firstElementChild).toHaveAttribute('data-state', 'processing');
  });

  it('al grabar dibuja las barras de voz', () => {
    const { container } = render(<BrandOrb state="recording" />);
    expect(container.querySelectorAll('i')).toHaveLength(5);
  });
});
