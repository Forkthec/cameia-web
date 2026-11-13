/**
 * Aviso de política nueva (CM-365, criterio 5): aparece solo si la versión
 * aceptada no es la vigente, no se cierra sin aceptar, exige la casilla, guarda
 * la aceptación y muestra el rechazo `POLICY_VERSION_OUTDATED`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { POLICY_VERSION } from '@/config/policy';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { useHandlers } from '@/test/msw';
import { PolicyAcceptanceGate } from './PolicyAcceptanceGate';

function renderGate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PolicyAcceptanceGate />
    </QueryClientProvider>,
  );
}

function meWith(acceptedVersion: string) {
  return http.get('*/api/v1/users/me', () =>
    HttpResponse.json({
      policyAcceptance: { acceptedVersion, acceptedAt: null, currentVersion: POLICY_VERSION },
    }),
  );
}

const CHECKBOX = 'Acepto la política de tratamiento de datos';

describe('PolicyAcceptanceGate', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es-CO');
    useAuthStore.setState({ isAuthenticated: true, isLoading: false });
  });

  it('no muestra nada si ya aceptó la versión vigente', async () => {
    renderGate();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('muestra el aviso sin botón de cierre si falta aceptar, y Esc no lo cierra', async () => {
    useHandlers(meWith('sin-aceptar'));
    const user = userEvent.setup();
    renderGate();
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cerrar/i })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Política de tratamiento de datos personales' }),
    ).toHaveAttribute('target', '_blank');
  });

  it('pide marcar la casilla antes de aceptar', async () => {
    useHandlers(meWith('sin-aceptar'));
    const user = userEvent.setup();
    renderGate();
    await user.click(await screen.findByRole('button', { name: 'Continuar' }));
    expect(
      screen.getByText('Acepta la política de tratamiento de datos para continuar.'),
    ).toBeInTheDocument();
  });

  it('al aceptar guarda la versión y cierra el aviso', async () => {
    let accepted = 'sin-aceptar';
    useHandlers(
      http.get('*/api/v1/users/me', () =>
        HttpResponse.json({
          policyAcceptance: {
            acceptedVersion: accepted,
            acceptedAt: null,
            currentVersion: POLICY_VERSION,
          },
        }),
      ),
      http.post('*/api/v1/users/me/policy-acceptance', async ({ request }) => {
        accepted = ((await request.json()) as { policyVersion: string }).policyVersion;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    renderGate();
    await user.click(await screen.findByLabelText(CHECKBOX));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(accepted).toBe(POLICY_VERSION);
  });

  it('si la política cambió muestra el mensaje de recargar', async () => {
    useHandlers(
      meWith('sin-aceptar'),
      http.post('*/api/v1/users/me/policy-acceptance', () =>
        HttpResponse.json(
          {
            title: 'Datos no válidos',
            detail: 'Revisa los campos marcados.',
            status: 422,
            code: 'VALIDATION_FAILED',
            errors: [{ field: 'policyVersion', code: 'POLICY_VERSION_OUTDATED', message: 'x' }],
          },
          { status: 422 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderGate();
    await user.click(await screen.findByLabelText(CHECKBOX));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      await screen.findByText('La política cambió. Recarga la página y vuelve a aceptarla.'),
    ).toBeInTheDocument();
  });

  it('sin sesión no consulta ni muestra el aviso', async () => {
    useAuthStore.setState({ isAuthenticated: false });
    useHandlers(meWith('sin-aceptar'));
    renderGate();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
