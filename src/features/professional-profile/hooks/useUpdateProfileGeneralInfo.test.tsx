/**
 * Comportamiento observable de `useUpdateProfileGeneralInfo` contra el
 * mock real: guarda `name`/`summary` y escribe la respuesta directo en la
 * caché de `useProfileQuery` (sin depender de una invalidación). Ver la
 * nota de cabecera de `useProfileQuery.test.tsx` sobre por qué este hook
 * necesita su propia prueba tras revertir `EditProfilePage`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { useUpdateProfileGeneralInfo } from './useUpdateProfileGeneralInfo';

interface CreatedProfile {
  id: string;
}

describe('useUpdateProfileGeneralInfo', () => {
  it('guarda name/summary y actualiza la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useUpdateProfileGeneralInfo(created.id), {
      wrapper: Wrapper,
    });

    result.current.mutate({ name: 'Ana Pérez', summary: 'Desarrolladora backend.' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({
      name: 'Ana Pérez',
      summary: 'Desarrolladora backend.',
    });
  });
});
