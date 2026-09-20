/**
 * Comportamiento observable de {@link LandingPage}: compone las seis
 * secciones reales de Figma (`SPEC.md` §3.1) y declara `<title>`/Open Graph
 * (§3.5, CA-10.1.1). No prueba estado de error/vacío porque la propia SPEC
 * (§3, tabla "Estados") documenta que ninguno aplica: la pantalla es
 * enteramente estática, sin llamadas de red propias.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { LandingPage } from './LandingPage';

function renderLandingPage() {
  return render(
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      </I18nextProvider>
    </HelmetProvider>,
  );
}

describe('LandingPage', () => {
  it('compone las seis secciones de la landing', () => {
    renderLandingPage();

    expect(screen.getByText('Entra a la entrevista listo')).toBeInTheDocument();
    expect(screen.getByText('Todo lo que necesitas para llegar preparado')).toBeInTheDocument();
    expect(
      screen.getByText('Practica a tu ritmo, o pon a prueba tu desempeño real'),
    ).toBeInTheDocument();
    expect(screen.getByText('Tu próxima entrevista empieza aquí')).toBeInTheDocument();
    expect(screen.getAllByText('Términos').length).toBeGreaterThan(0);
  });

  it('declara el <title> de la pantalla', async () => {
    renderLandingPage();

    await waitFor(() => {
      expect(document.title).toBe('CAMEIA · Practica entrevistas laborales con IA');
    });
  });

  it('ambos botones "Crear cuenta" existen (header, hero y cierre)', () => {
    renderLandingPage();

    expect(screen.getAllByRole('button', { name: 'Crear cuenta' }).length).toBeGreaterThan(1);
  });
});
