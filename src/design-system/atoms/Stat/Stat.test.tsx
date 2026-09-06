import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stat } from './Stat';

describe('Stat', () => {
  it('renderiza el valor y la etiqueta', () => {
    render(<Stat value={12} label="Entrevistas completadas" />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Entrevistas completadas')).toBeInTheDocument();
  });

  it('el valor usa font-variant-numeric tabular-nums', () => {
    render(<Stat value={12} label="Entrevistas completadas" />);

    expect(screen.getByText('12')).toHaveClass('tabular-nums');
  });
});
