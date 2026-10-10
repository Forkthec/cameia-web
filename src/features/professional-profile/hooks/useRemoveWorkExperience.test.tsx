/**
 * Comportamiento observable de `useRemoveWorkExperience` contra el mock
 * real: el `DELETE` devuelve 204 e invalida la caché de `useProfileQuery`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { useRemoveWorkExperience } from './useRemoveWorkExperience';

interface CreatedProfile {
  id: string;
}

interface ProfileWithWorkExperience {
  workExperiences: { id: string }[];
}

describe('useRemoveWorkExperience', () => {
  it('elimina la experiencia e invalida la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const withExperience = await httpClient.post<ProfileWithWorkExperience>(
      `/api/v1/profiles/${created.id}/work-experiences`,
      {
        company: 'CAMEIA',
        position: 'Desarrolladora backend',
        startDate: '2022-01',
        employmentStatus: 'CURRENT',
        provenance: 'MANUAL',
      },
    );
    const [firstExperience] = withExperience.workExperiences;
    const workExperienceId = firstExperience?.id;
    if (!workExperienceId) throw new Error('El perfil sembrado no tiene experiencia laboral.');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(['profile', created.id], {
      workExperience: [{ id: workExperienceId }],
    });

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useRemoveWorkExperience(created.id), { wrapper: Wrapper });
    result.current.mutate(workExperienceId);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const state = queryClient.getQueryState(['profile', created.id]);
    expect(state?.isInvalidated).toBe(true);
  });
});
