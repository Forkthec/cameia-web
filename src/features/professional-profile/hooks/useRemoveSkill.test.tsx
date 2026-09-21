/**
 * Comportamiento observable de `useRemoveSkill` contra el mock real: el
 * `DELETE` retira la habilidad y la respuesta se escribe directo en la
 * caché.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { useRemoveSkill } from './useRemoveSkill';

interface CreatedProfile {
  id: string;
}

interface ProfileWithSkills {
  profileSkills: { id: string }[];
}

describe('useRemoveSkill', () => {
  it('elimina la habilidad y actualiza la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const withSkill = await httpClient.post<ProfileWithSkills>(
      `/api/v1/profiles/${created.id}/skills`,
      { skillName: 'React', level: 'ADVANCED', provenance: 'MANUAL' },
    );
    const skillId = withSkill.profileSkills[0]?.id;
    if (!skillId) throw new Error('El perfil sembrado no tiene habilidad.');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useRemoveSkill(created.id), { wrapper: Wrapper });
    result.current.mutate(skillId);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({ skills: [] });
  });
});
