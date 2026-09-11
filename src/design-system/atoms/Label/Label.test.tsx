/**
 * Comportamiento observable de `Label`, no implementación: que el texto
 * recibido se asocia a su control por `htmlFor`, no solo se muestra al
 * lado.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from './Label';

describe('Label', () => {
  it('renderiza el texto recibido y se asocia a su control por htmlFor', () => {
    render(
      <>
        <Label htmlFor="nombre">Nombre completo</Label>
        <input id="nombre" />
      </>,
    );

    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument();
  });
});
