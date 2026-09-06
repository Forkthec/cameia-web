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
});
