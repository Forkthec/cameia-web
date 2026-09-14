/**
 * Cableado global de la app, de afuera hacia adentro: boundary de último
 * recurso → datos del servidor (TanStack Query) → i18n → sesión de Firebase.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
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
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>{children}</AuthProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
