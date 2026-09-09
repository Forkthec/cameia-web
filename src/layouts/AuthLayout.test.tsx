import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthLayout } from './AuthLayout';

describe('AuthLayout', () => {
  it('renderiza su contenido centrado', () => {
    render(
      <AuthLayout>
        <p>Formulario de ingreso</p>
      </AuthLayout>,
    );

    expect(screen.getByText('Formulario de ingreso')).toBeInTheDocument();
  });
});
