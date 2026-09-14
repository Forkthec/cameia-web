/**
 * Comportamiento observable de `FormField`, no implementación: que
 * `Label` se asocia al control por `id`/`htmlFor`, y que el mensaje de
 * ayuda o de error se asocia al control por `aria-describedby` según
 * corresponda (CLAUDE.md §10: los errores de formulario se asocian por
 * `aria-describedby`) — nunca los dos anunciados a la vez.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../../atoms/Input';
import { FormField } from './FormField';

describe('FormField', () => {
  it('asocia el Label al control por id/htmlFor', () => {
    render(
      <FormField label="Correo electrónico">
        <Input type="email" />
      </FormField>,
    );

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
  });

  it('el error se asocia al control por aria-describedby', () => {
    render(
      <FormField label="Correo electrónico" error="El correo no es válido">
        <Input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText('Correo electrónico');
    const error = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-describedby', error.id);
    expect(error).toHaveTextContent('El correo no es válido');
  });

  it('sin error, el texto de ayuda se asocia al control', () => {
    render(
      <FormField label="Correo electrónico" helperText="Usa tu correo institucional">
        <Input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText('Correo electrónico');
    const helper = screen.getByText('Usa tu correo institucional');

    expect(input).toHaveAttribute('aria-describedby', helper.id);
  });
});
