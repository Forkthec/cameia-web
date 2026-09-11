/**
 * Comportamiento observable de `HelperText`, no implementación: que
 * renderiza el texto recibido y expone un `id` estable para que un campo
 * lo use en su `aria-describedby`.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HelperText } from './HelperText';

describe('HelperText', () => {
  it('renderiza el texto y expone su id para aria-describedby', () => {
    render(<HelperText id="ayuda-correo">Usa el correo con el que te registraste</HelperText>);

    const text = screen.getByText('Usa el correo con el que te registraste');
    expect(text).toHaveAttribute('id', 'ayuda-correo');
  });
});
