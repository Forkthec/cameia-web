/**
 * Comportamiento observable de `ProgressBar`, no implementación: que
 * expone `value`/`min`/`max` y un nombre accesible, y que el valor
 * recibido se acota al rango `[0, max]` en vez de desbordar la barra o
 * el atributo ARIA.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('expone value/min/max y el nombre accesible', () => {
    render(<ProgressBar context="session-turns" value={3} max={10} label="Turnos de la sesión" />);

    const bar = screen.getByRole('progressbar', { name: 'Turnos de la sesión' });
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
  });

  it('acota el valor al rango [0, max]', () => {
    render(<ProgressBar context="requirements" value={150} max={100} label="Requisitos" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('acepta una escala que no empieza en 0 y se lee con su unidad (reporte, CM-379)', () => {
    render(
      <ProgressBar
        context="report-metric"
        value={3}
        min={1}
        max={5}
        label="Precisión"
        valueText="3,0 de 5"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Precisión' });
    expect(bar).toHaveAttribute('aria-valuemin', '1');
    expect(bar).toHaveAttribute('aria-valuetext', '3,0 de 5');
    expect(bar.firstElementChild).toHaveStyle({ width: '50%' });
  });
});
