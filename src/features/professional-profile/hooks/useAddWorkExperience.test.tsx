/**
 * Comportamiento observable de `useAddWorkExperience` contra el mock real:
 * el `POST` agrega la experiencia y la respuesta se escribe directo en la
 * caché de `useProfileQuery`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { EMPTY_WORK_EXPERIENCE_VALUES } from '../schemas/workExperience.schema';
import { useAddWorkExperience } from './useAddWorkExperience';

interface CreatedProfile {
  id: string;
}

describe('useAddWorkExperience', () => {
  it('agrega la experiencia y actualiza la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useAddWorkExperience(created.id), { wrapper: Wrapper });

    result.current.mutate({
      ...EMPTY_WORK_EXPERIENCE_VALUES,
      position: 'Desarrolladora backend',
      company: 'CAMEIA',
      startDate: '2022-01-15',
      isCurrent: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({
      workExperience: [expect.objectContaining({ company: 'CAMEIA', employmentStatus: 'CURRENT' })],
    });
  });

  it('una fecha de fin anterior a la de inicio deja el hook en error con el código del mock', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useAddWorkExperience(created.id), { wrapper: Wrapper });

    result.current.mutate({
      ...EMPTY_WORK_EXPERIENCE_VALUES,
      position: 'Desarrolladora backend',
      company: 'CAMEIA',
      startDate: '2022-01-15',
      endDate: '2020-01-01',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
