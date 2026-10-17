/**
 * Comportamiento observable de {@link AuthFormActions} (`SPEC.md` §3.8): es
 * solo presentación del bloque de envío que ya tenían Login y Registro, así
 * que protege lo que no debe cambiar — el botón sigue siendo `type="submit"`,
 * en carga muestra el gerundio, y el enlace lleva a la ruta recibida.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthFormActions } from './AuthFormActions';

function renderActions(isSubmitting = false) {
  return render(
    <MemoryRouter>
      <form>
        <AuthFormActions
          isSubmitting={isSubmitting}
          submitLabel="Ingresar"
          submitLoadingLabel="Ingresando…"
          footerQuestion="¿No tienes cuenta?"
          footerCta="Crear cuenta"
          footerTo="/registro"
        />
      </form>
    </MemoryRouter>,
  );
}

describe('AuthFormActions', () => {
  it('el botón envía el formulario', () => {
    renderActions();

    expect(screen.getByRole('button', { name: 'Ingresar' })).toHaveAttribute('type', 'submit');
  });

  it('en carga muestra el gerundio y deshabilita el botón', () => {
    renderActions(true);

    expect(screen.getByText('Ingresando…')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('el enlace lleva a la ruta recibida', () => {
    renderActions();

    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');
  });
});
