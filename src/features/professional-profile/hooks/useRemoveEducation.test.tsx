/**
 * Comportamiento observable de `useRemoveEducation` contra el mock real: el
 * `DELETE` devuelve 204 e invalida la caché de `useProfileQuery`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { useRemoveEducation } from './useRemoveEducation';

interface CreatedProfile {
  id: string;
}

interface ProfileWithEducation {
  educations: { id: string }[];
}

describe('useRemoveEducation', () => {
  it('elimina la formación e invalida la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const withEducation = await httpClient.post<ProfileWithEducation>(
      `/api/v1/profiles/${created.id}/educations`,
      {
        institution: 'Universidad del Cauca',
        degree: 'Ingeniería de Sistemas',
        level: 'UNDERGRADUATE',
        startDate: '2018-01',
        inProgress: false,
        provenance: 'MANUAL',
      },
    );
    const [firstEducation] = withEducation.educations;
    const educationId = firstEducation?.id;
    if (!educationId) throw new Error('El perfil sembrado no tiene educación.');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(['profile', created.id], { education: [{ id: educationId }] });

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useRemoveEducation(created.id), { wrapper: Wrapper });
    result.current.mutate(educationId);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const state = queryClient.getQueryState(['profile', created.id]);
    expect(state?.isInvalidated).toBe(true);
  });
});
