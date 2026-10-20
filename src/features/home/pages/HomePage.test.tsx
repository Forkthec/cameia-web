/**
 * Protege el Tablero de inicio provisional tal como lo define HU-10.4 en el
 * backlog v8.2: título, mensaje y los dos accesos con sus destinos
 * (CA-10.4.1 a CA-10.4.4), sin datos técnicos (CA-10.4.6).
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { HomePage } from './HomePage';

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/inicio']}>
        <HomePage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('HomePage', () => {
  afterEach(() => {
    useUiPreferencesStore.setState({ lastUsedProfileId: null });
  });

  it('muestra el título y el mensaje del tablero provisional (CA-10.4.1)', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tablero de inicio' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Estamos construyendo tu tablero. Mientras tanto, crea tu Perfil Profesional o inicia una entrevista.',
      ),
    ).toBeInTheDocument();
  });

  it('«Nueva entrevista» lleva a la configuración de la entrevista (CA-10.4.2)', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Nueva entrevista' })).toHaveAttribute(
      'href',
      '/entrenar/nueva',
    );
  });

  it('«Mi Perfil Profesional» sin perfil lleva a la selección del método (CA-10.4.3)', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Mi Perfil Profesional' })).toHaveAttribute(
      'href',
      '/perfiles/nuevo',
    );
  });

  it('«Mi Perfil Profesional» con un perfil abre su formulario (CA-10.4.4)', () => {
    useUiPreferencesStore.setState({ lastUsedProfileId: 'p-123' });
    renderPage();
    expect(screen.getByRole('link', { name: 'Mi Perfil Profesional' })).toHaveAttribute(
      'href',
      '/perfiles/p-123/editar',
    );
  });

  it('muestra solo los dos accesos y ningún texto «Pantalla pendiente» (CA-10.4.6)', () => {
    renderPage();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByText(/pantalla pendiente/i)).not.toBeInTheDocument();
  });
});
