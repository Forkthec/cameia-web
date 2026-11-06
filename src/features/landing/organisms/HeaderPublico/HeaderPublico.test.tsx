/**
 * Comportamiento observable de {@link HeaderPublico}: los dos CTAs navegan a
 * las rutas ya existentes de HE-01 (CA-10.1.2), y el `LanguageSwitcher`
 * cambia el idioma de la instancia compartida de i18next — de toda la app,
 * no solo de este componente (`SPEC.md` §3, "Qué hace"). El reflow
 * sm/lg (§3.1) se resuelve renderizando ambas agrupaciones y alternando
 * visibilidad por CSS, así que jsdom ve los botones duplicados; esta prueba
 * usa `getAllByRole` para no depender de cuál copia está visible.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { HeaderPublico } from './HeaderPublico';

function renderHeader() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HeaderPublico />} />
          <Route path="/registro" element={<p>Registro</p>} />
          <Route path="/ingresar" element={<p>Ingresar</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('HeaderPublico', () => {
  afterEach(async () => {
    await i18n.changeLanguage('es-CO');
  });

  it('el CTA "Crear cuenta" navega a /registro', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getAllByRole('button', { name: 'Crear cuenta' })[0]!);

    expect(screen.getByText('Registro')).toBeInTheDocument();
  });

  it('el CTA "Iniciar sesión" navega a /ingresar', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getAllByRole('button', { name: 'Iniciar sesión' })[0]!);

    expect(screen.getByText('Ingresar')).toBeInTheDocument();
  });

  it('el LanguageSwitcher cambia el idioma de la instancia compartida de i18next', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getAllByRole('button', { name: 'EN' })[0]!);

    expect(i18n.language).toBe('en');
  });
});
