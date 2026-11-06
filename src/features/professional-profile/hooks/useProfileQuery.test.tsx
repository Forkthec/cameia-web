/**
 * Comportamiento observable de `useProfileQuery` contra el mock real
 * (`profiles.handlers.ts`): obtiene el perfil por id y expone un error
 * cuando no existe. Sustituye, a nivel de hook, la cobertura que tenía
 * `EditProfilePage.test.tsx` antes de revertirse (ver
 * `docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`): la página que
 * consumía este hook se retiró porque asumía un armazón que no
 * corresponde al prototipo real, pero el hook en sí es independiente del
 * layout y sigue necesitando su propia prueba.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { useProfileQuery } from './useProfileQuery';

interface CreatedProfile {
  id: string;
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useProfileQuery', () => {
  it('obtiene el perfil por id', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });

    const { result } = renderHook(() => useProfileQuery(created.id), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Ana María Pérez');
  });

  it('perfil inexistente termina en error', async () => {
    const { result } = renderHook(() => useProfileQuery('no-existe'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
