import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { NotFoundPage } from './NotFoundPage';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

describe('NotFoundPage', () => {
  it('muestra el mensaje de ruta no encontrada', async () => {
    await waitUntilReady();

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/ruta-que-no-existe']}>
          <Routes>
            <Route path="/" element={<p>Landing</p>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByText('No encontramos lo que buscabas.')).toBeInTheDocument();
  });

  it('el botón de acción navega de regreso a la ruta pública raíz', async () => {
    await waitUntilReady();
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/ruta-que-no-existe']}>
          <Routes>
            <Route path="/" element={<p>Landing</p>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Volver a inicio' }));
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });
});
