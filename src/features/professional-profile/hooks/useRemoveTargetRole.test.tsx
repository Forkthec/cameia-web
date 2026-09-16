/**
 * Comportamiento observable de `useRemoveTargetRole` contra el mock real: el
 * `DELETE` retira el rol objetivo y la respuesta se escribe directo en la
 * caché.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { useRemoveTargetRole } from './useRemoveTargetRole';

interface CreatedProfile {
  id: string;
}

interface ProfileWithTargetRoles {
  targetRoles: { id: string }[];
}

describe('useRemoveTargetRole', () => {
  it('elimina el rol objetivo y actualiza la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const withRole = await httpClient.post<ProfileWithTargetRoles>(
      `/api/v1/profiles/${created.id}/target-roles`,
      { professionalRoleId: 'backend-developer', provenance: 'MANUAL' },
    );
    const roleId = withRole.targetRoles[0]?.id;
    if (!roleId) throw new Error('El perfil sembrado no tiene rol objetivo.');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useRemoveTargetRole(created.id), { wrapper: Wrapper });
    result.current.mutate(roleId);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({ targetRoles: [] });
  });
});
