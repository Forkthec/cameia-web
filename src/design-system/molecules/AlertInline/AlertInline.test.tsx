/**
 * Comportamiento observable de `AlertInline`, no implementación: que
 * `variant="error"` usa `role="alert"` (anuncio inmediato) y el resto de
 * variantes usa `role="status"` (anuncio no urgente) — la urgencia del
 * anuncio depende de la variante, no es la misma para todas.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertInline } from './AlertInline';

describe('AlertInline', () => {
  it('renderiza el mensaje recibido', () => {
    render(<AlertInline variant="info">Guardado automáticamente</AlertInline>);

    expect(screen.getByText('Guardado automáticamente')).toBeInTheDocument();
  });

  it('variant="error" usa role="alert" (anuncio inmediato)', () => {
    render(<AlertInline variant="error">Ocurrió un error</AlertInline>);

    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error');
  });

  it('las demás variantes usan role="status" (anuncio no urgente)', () => {
    render(<AlertInline variant="success">Perfil guardado</AlertInline>);

    expect(screen.getByRole('status')).toHaveTextContent('Perfil guardado');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
