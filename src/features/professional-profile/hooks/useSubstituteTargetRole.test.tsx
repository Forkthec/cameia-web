/**
 * Comportamiento observable de `useSubstituteTargetRole` contra el mock
 * real: el `PATCH` conserva el id del Rol Objetivo y cambia solo el rol
 * profesional referenciado (memo del PO del 13-sep, C-05).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { useSubstituteTargetRole } from './useSubstituteTargetRole';

interface CreatedProfile {
  id: string;
}

interface ProfileWithTargetRoles {
  targetRoles: { id: string; professionalRoleId: string }[];
}

describe('useSubstituteTargetRole', () => {
  it('sustituye el rol profesional conservando el id del Rol Objetivo', async () => {
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

    const { result } = renderHook(() => useSubstituteTargetRole(created.id), { wrapper: Wrapper });
    result.current.mutate({ roleId, professionalRoleId: 'frontend-developer' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({
      targetRoles: [{ id: roleId, professionalRoleId: 'frontend-developer', provenance: 'MANUAL' }],
    });
  });
});
