/**
 * Comportamiento observable de `useAddEducation` contra el mock real: el
 * `POST` agrega la formación y la respuesta (el perfil completo) se escribe
 * directo en la caché de `useProfileQuery`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { EMPTY_EDUCATION_VALUES } from '../schemas/education.schema';
import { useAddEducation } from './useAddEducation';

interface CreatedProfile {
  id: string;
}

describe('useAddEducation', () => {
  it('agrega la formación y actualiza la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useAddEducation(created.id), { wrapper: Wrapper });

    result.current.mutate({
      ...EMPTY_EDUCATION_VALUES,
      level: 'UNDERGRADUATE',
      degree: 'Ingeniería de Sistemas',
      institution: 'Universidad del Cauca',
      startDate: '2018-01-15',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({
      education: [expect.objectContaining({ degree: 'Ingeniería de Sistemas' })],
    });
  });

  it('un nivel fuera del enum deja el hook en error con el código del mock', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useAddEducation(created.id), { wrapper: Wrapper });

    result.current.mutate({
      ...EMPTY_EDUCATION_VALUES,
      // El <Select> real solo ofrece los 3 valores del enum; este caso
      // simula un valor que la interfaz nunca produce, para probar que el
      // mock igual lo rechaza (defensa en profundidad, no solo el cliente).
      level: 'DOCTORADO',
      degree: 'Ingeniería de Sistemas',
      institution: 'Universidad del Cauca',
      startDate: '2018-01-15',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
