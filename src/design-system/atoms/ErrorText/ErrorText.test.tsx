import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorText } from './ErrorText';

describe('ErrorText', () => {
  it('renderiza el error con role="alert" y expone su id para aria-describedby', () => {
    render(<ErrorText id="correo-error">El correo no es válido</ErrorText>);

    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('El correo no es válido');
    expect(error).toHaveAttribute('id', 'correo-error');
  });
});
