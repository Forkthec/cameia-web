/**
 * Protege la semántica del progreso por pasos (CLAUDE.md §10): rol
 * `progressbar` con su valor y su nombre accesible, un punto por paso y la
 * etiqueta «Pregunta k de 5» tal cual, sin mayúsculas (CA-5.2.1, respuesta
 * registrada y avance; CA-5.2.14; D7 del SPEC de interview-session).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressArc } from './ProgressArc';

describe('ProgressArc', () => {
  it('expone el paso actual y el total como barra de progreso con nombre', () => {
    render(<ProgressArc current={2} total={5} label="Pregunta 2 de 5" />);
    const bar = screen.getByRole('progressbar', { name: 'Pregunta 2 de 5' });
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
  });

  it('la etiqueta no fuerza mayúsculas', () => {
    // Prueba débil: jsdom no aplica Tailwind. La mira el paso 6 en el navegador (SPEC interview-session D7).
    render(<ProgressArc current={2} total={5} label="Pregunta 2 de 5" />);
    expect(screen.getByText('Pregunta 2 de 5')).not.toHaveClass('uppercase');
  });

  it('dibuja un punto por paso', () => {
    const { container } = render(<ProgressArc current={1} total={5} label="x" />);
    expect(container.querySelectorAll('circle')).toHaveLength(5);
  });
});
