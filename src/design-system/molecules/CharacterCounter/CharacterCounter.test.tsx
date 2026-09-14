/**
 * Comportamiento observable de `CharacterCounter`, no implementación: que
 * dentro del límite se muestra como texto de ayuda, y que al superarlo
 * cambia a estado de error — el mismo componente cambia de rol según el
 * conteo, no son dos componentes distintos.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CharacterCounter } from './CharacterCounter';

const formatLabel = (count: number, max: number) => `${count}/${max} caracteres`;

describe('CharacterCounter', () => {
  it('dentro del límite, se muestra como texto de ayuda', () => {
    render(<CharacterCounter count={120} max={3000} formatLabel={formatLabel} />);

    const text = screen.getByText('120/3000 caracteres');
    expect(text.tagName).toBe('P');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('al superar el límite, se muestra como error', () => {
    render(<CharacterCounter count={3001} max={3000} formatLabel={formatLabel} />);

    expect(screen.getByRole('alert')).toHaveTextContent('3001/3000 caracteres');
  });
});
