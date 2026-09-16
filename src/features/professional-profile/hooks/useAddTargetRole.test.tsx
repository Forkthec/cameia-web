/**
 * Comportamiento observable de `useAddTargetRole` contra el mock real: el
 * `POST` agrega el rol objetivo y la respuesta (el perfil completo) se
 * escribe directo en la caché de `useProfileQuery`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { useAddTargetRole } from './useAddTargetRole';

interface CreatedProfile {
  id: string;
}

describe('useAddTargetRole', () => {
  it('agrega el rol objetivo y actualiza la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useAddTargetRole(created.id), { wrapper: Wrapper });
    result.current.mutate('backend-developer');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({
      targetRoles: [expect.objectContaining({ professionalRoleId: 'backend-developer' })],
    });
  });

  it('un rol fuera del catálogo deja el hook en error', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useAddTargetRole(created.id), { wrapper: Wrapper });
    result.current.mutate('no-existe-en-el-catalogo');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
