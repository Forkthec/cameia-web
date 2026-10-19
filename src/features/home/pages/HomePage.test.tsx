/**
 * Protege el tablero de inicio provisional (HU-10.4): verifica que el saludo,
 * las tarjetas de accion rapida y sus enlaces se renderizan correctamente.
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
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
  it('muestra el saludo y la descripción', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/próxima entrevista|practice/i)).toBeInTheDocument();
  });

  it('muestra la tarjeta de nueva entrevista con enlace correcto', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /nueva entrevista|new interview/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/entrevistas/nueva');
  });

  it('muestra la tarjeta de perfil profesional con enlace correcto', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /perfil profesional|professional profile/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/perfiles');
  });

  it('renderiza exactamente 2 tarjetas de acción rápida', () => {
    renderPage();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
  });
});
