/**
 * Comportamiento observable de {@link LandingPage}: compone las secciones
 * reales de Figma (`SPEC.md` §3.1) más «Cómo funciona» (§3.7), declara
 * `<title>`/Open Graph (§3.5, CA-10.1.1) y aplica las reglas de la intro de
 * marca de la dirección «Amanecer» (CM-329, §3.7): se muestra una vez por
 * sesión, se puede saltar y nunca aparece con `prefers-reduced-motion`
 * (CLAUDE.md §10). También protege que el encaje por secciones solo exista
 * mientras la landing está montada.
 *
 * No prueba estado de error/vacío porque la propia SPEC (§3, tabla "Estados")
 * documenta que ninguno aplica: la pantalla es enteramente estática, sin
 * llamadas de red propias.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { setViewportMatches } from '@/test/matchMedia';
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
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('compone las secciones de la landing', () => {
    renderLandingPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Entra a la entrevista listo' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Todo lo que necesitas para llegar preparado' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Practica a tu ritmo, o pon a prueba tu desempeño real',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Tres pasos hacia tu próxima entrevista' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Tu próxima entrevista empieza aquí' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Términos').length).toBeGreaterThan(0);
  });

  it('declara el <title> de la pantalla', async () => {
    renderLandingPage();

    await waitFor(() => {
      expect(document.title).toBe('CAMEIA · Practica entrevistas laborales con IA');
    });
  });

  it('ofrece "Crear cuenta" en el header, el hero y el cierre', () => {
    renderLandingPage();

    // Header sm + header lg + hero + cierre (SPEC.md §3: 3 visibles, 4 en el DOM).
    expect(screen.getAllByRole('button', { name: 'Crear cuenta' })).toHaveLength(4);
  });

  it('muestra la intro de marca en la primera visita de la sesión y la retira al saltarla', async () => {
    const user = userEvent.setup();
    renderLandingPage();

    expect(screen.getByTestId('brand-intro')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Saltar intro' }));

    expect(screen.queryByTestId('brand-intro')).not.toBeInTheDocument();
  });

  it('no repite la intro si ya se vio en esta sesión', () => {
    const { unmount } = renderLandingPage();
    unmount();

    renderLandingPage();

    expect(screen.queryByTestId('brand-intro')).not.toBeInTheDocument();
  });

  it('no muestra la intro con prefers-reduced-motion', () => {
    setViewportMatches(true);

    renderLandingPage();

    expect(screen.queryByTestId('brand-intro')).not.toBeInTheDocument();
  });

  it('activa el encaje por secciones solo mientras la landing está montada', () => {
    const { unmount } = renderLandingPage();

    expect(document.documentElement).toHaveClass('scroll-snap-sections');

    unmount();

    expect(document.documentElement).not.toHaveClass('scroll-snap-sections');
  });
});
