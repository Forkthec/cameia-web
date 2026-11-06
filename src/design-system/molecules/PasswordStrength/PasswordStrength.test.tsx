/**
 * Comportamiento observable de `PasswordStrength` (contrato real de Figma,
 * nodo `33:251`): `empty` no rellena segmentos ni muestra etiqueta; los
 * otros 4 niveles rellenan la cantidad correcta de segmentos y anuncian el
 * nivel por texto, no solo por color.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PasswordStrength } from './PasswordStrength';

describe('PasswordStrength', () => {
  it('con level="empty", no rellena segmentos ni muestra etiqueta', () => {
    const { container } = render(<PasswordStrength level="empty" />);
    const segments = container.querySelectorAll('[aria-hidden="true"] > span');

    expect(segments).toHaveLength(4);
    segments.forEach((segment) => expect(segment).toHaveClass('bg-bg-surface-sunken'));
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('anuncia el nivel a través del texto recibido', () => {
    render(<PasswordStrength level="strong" label="Fuerte" />);

    expect(screen.getByText('Fuerte')).toBeInTheDocument();
  });

  it('con level="weak", rellena solo el primer segmento', () => {
    const { container } = render(<PasswordStrength level="weak" label="Débil" />);
    const segments = container.querySelectorAll('[aria-hidden="true"] > span');

    expect(segments[0]).toHaveClass('bg-danger-base');
    expect(segments[1]).toHaveClass('bg-bg-surface-sunken');
    expect(segments[2]).toHaveClass('bg-bg-surface-sunken');
    expect(segments[3]).toHaveClass('bg-bg-surface-sunken');
  });

  it('con level="fair", rellena dos segmentos', () => {
    const { container } = render(<PasswordStrength level="fair" label="Aceptable" />);
    const segments = container.querySelectorAll('[aria-hidden="true"] > span');

    expect(segments[0]).toHaveClass('bg-warning-base');
    expect(segments[1]).toHaveClass('bg-warning-base');
    expect(segments[2]).toHaveClass('bg-bg-surface-sunken');
  });

  it('con level="good", rellena tres segmentos con el verde base', () => {
    const { container } = render(<PasswordStrength level="good" label="Buena" />);
    const segments = container.querySelectorAll('[aria-hidden="true"] > span');

    expect(segments[0]).toHaveClass('bg-success-base');
    expect(segments[1]).toHaveClass('bg-success-base');
    expect(segments[2]).toHaveClass('bg-success-base');
    expect(segments[3]).toHaveClass('bg-bg-surface-sunken');
  });

  it('con level="strong", rellena los cuatro segmentos con el verde fuerte', () => {
    const { container } = render(<PasswordStrength level="strong" label="Fuerte" />);
    const segments = container.querySelectorAll('[aria-hidden="true"] > span');

    segments.forEach((segment) => expect(segment).toHaveClass('bg-success-text'));
  });
});
