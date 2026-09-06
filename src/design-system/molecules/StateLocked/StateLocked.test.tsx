import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StateLocked } from './StateLocked';

describe('StateLocked', () => {
  it('renderiza el contenido envuelto y la insignia recibida', () => {
    render(
      <StateLocked label="Próximamente">
        <button disabled>Audio</button>
      </StateLocked>,
    );

    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });

  it('no oculta el contenido envuelto de lectores de pantalla', () => {
    render(
      <StateLocked label="Próximamente">
        <button disabled>Audio</button>
      </StateLocked>,
    );

    expect(screen.getByRole('button', { name: 'Audio' })).toBeInTheDocument();
  });
});
