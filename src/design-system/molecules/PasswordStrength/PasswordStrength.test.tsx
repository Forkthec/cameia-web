/**
 * Comportamiento observable de `PasswordStrength`, no implementación: que
 * el nivel se anuncia también por texto (no solo por color, para no
 * depender de percepción de color) y que solo se rellenan los segmentos
 * hasta el nivel recibido.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PasswordStrength } from './PasswordStrength';

describe('PasswordStrength', () => {
  it('anuncia el nivel a través del texto recibido', () => {
    render(<PasswordStrength level={4} label="Fuerte" />);

    expect(screen.getByText('Fuerte')).toBeInTheDocument();
  });

  it('rellena solo los segmentos hasta el nivel recibido', () => {
    const { container } = render(<PasswordStrength level={2} label="Regular" />);
    const segments = container.querySelectorAll('[aria-hidden="true"] > span');

    expect(segments).toHaveLength(4);
    expect(segments[0]).toHaveClass('bg-warning-base');
    expect(segments[1]).toHaveClass('bg-warning-base');
    expect(segments[2]).toHaveClass('bg-bg-surface-sunken');
    expect(segments[3]).toHaveClass('bg-bg-surface-sunken');
  });
});
