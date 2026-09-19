/**
 * Comportamiento observable de `AuthLayout` (CLAUDE.md §4: `layouts/` son
 * plantillas de página): que siempre renderiza su contenido, que el
 * titular del panel de marca solo aparece cuando se pasa `headline` (lo
 * necesita Login, no lo necesita el `RegisterPage` placeholder que comparte
 * este mismo layout), y que hay dos formas de volver a la landing (`/`,
 * seguimiento de auth: ningún frame de Login/Registro dibuja una, es
 * decisión de Frontend) — el logo (ambos, panel de marca y móvil) y el
 * enlace explícito "Volver a inicio".
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { AuthLayout } from './AuthLayout';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderLayout(headline?: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <AuthLayout headline={headline}>
          <p>Formulario</p>
        </AuthLayout>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('AuthLayout', () => {
  it('renderiza su contenido', async () => {
    await waitUntilReady();

    renderLayout();

    expect(screen.getByText('Formulario')).toBeInTheDocument();
  });

  it('el logo enlaza a la landing', async () => {
    await waitUntilReady();

    renderLayout();

    const logos = screen.getAllByRole('link', { name: 'cameia' });
    expect(logos.length).toBeGreaterThan(0);
    logos.forEach((logo) => expect(logo).toHaveAttribute('href', '/'));
  });

  it('el enlace "Volver a inicio" enlaza a la landing', async () => {
    await waitUntilReady();

    renderLayout();

    expect(screen.getByRole('link', { name: /volver a inicio/i })).toHaveAttribute('href', '/');
  });

  it('sin headline, no renderiza el titular del panel de marca', async () => {
    await waitUntilReady();

    renderLayout();

    expect(screen.queryByText(/entra a la entrevista/i)).not.toBeInTheDocument();
  });

  it('con headline, lo renderiza en el panel de marca', async () => {
    await waitUntilReady();

    renderLayout('Entra a la entrevista listo');

    expect(screen.getByText('Entra a la entrevista listo')).toBeInTheDocument();
  });
});
