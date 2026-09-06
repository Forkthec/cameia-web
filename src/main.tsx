/**
 * Punto de entrada de la aplicación.
 *
 * Todavía no existen `app/App.tsx` ni el resto de providers planeados en
 * docs/ARCHITECTURE.md (QueryClient, Auth, Toast, ErrorBoundary): por ahora
 * solo se registra i18next. Cuando esos providers existan, este árbol se
 * traslada tal cual a `app/providers/AppProviders.tsx`.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento #root en index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n} />
  </StrictMode>,
);
