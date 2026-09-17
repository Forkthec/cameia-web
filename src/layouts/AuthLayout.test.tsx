/**
 * Comportamiento observable de `AuthLayout` (CLAUDE.md §4: `layouts/` son
 * plantillas de página): que siempre renderiza su contenido, y que el
 * titular del panel de marca solo aparece cuando se pasa `headline` (lo
 * necesita Login, no lo necesita el `RegisterPage` placeholder que comparte
 * este mismo layout).
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { AuthLayout } from './AuthLayout';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

describe('AuthLayout', () => {
  it('renderiza su contenido', async () => {
    await waitUntilReady();

    render(
      <I18nextProvider i18n={i18n}>
        <AuthLayout>
          <p>Formulario de ingreso</p>
        </AuthLayout>
      </I18nextProvider>,
    );

    expect(screen.getByText('Formulario de ingreso')).toBeInTheDocument();
  });

  it('sin headline, no renderiza el titular del panel de marca', async () => {
    await waitUntilReady();

    render(
      <I18nextProvider i18n={i18n}>
        <AuthLayout>
          <p>Formulario</p>
        </AuthLayout>
      </I18nextProvider>,
    );

    expect(screen.queryByText(/entra a la entrevista/i)).not.toBeInTheDocument();
  });

  it('con headline, lo renderiza en el panel de marca', async () => {
    await waitUntilReady();

    render(
      <I18nextProvider i18n={i18n}>
        <AuthLayout headline="Entra a la entrevista listo">
          <p>Formulario</p>
        </AuthLayout>
      </I18nextProvider>,
    );

    expect(screen.getByText('Entra a la entrevista listo')).toBeInTheDocument();
  });
});
