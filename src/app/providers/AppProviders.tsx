/**
 * Cableado global de la app, de afuera hacia adentro: boundary de último
 * recurso → SEO (Helmet) → datos del servidor (TanStack Query) → i18n →
 * sesión de Firebase.
 *
 * `HelmetProvider` (CM-186): la dependencia `react-helmet-async` estaba
 * instalada desde antes pero sin cablear a ningún provider — necesaria para
 * que `LandingPage` declare `<title>`/Open Graph (`features/landing/SPEC.md`
 * §3.5). Va afuera de `QueryClientProvider`/`I18nextProvider` porque no
 * depende de ninguno de los dos y cualquier página, autenticada o no, puede
 * necesitar declarar su propio `<title>` en el futuro.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { queryClient } from '@/services/queryClient';
import { AuthProvider } from './AuthProvider';
import { RootErrorBoundary } from './RootErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <RootErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <AuthProvider>{children}</AuthProvider>
          </I18nextProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </RootErrorBoundary>
  );
}
