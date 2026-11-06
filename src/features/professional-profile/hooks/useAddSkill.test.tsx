/**
 * Comportamiento observable de `useAddSkill` contra el mock real: el `POST`
 * agrega la habilidad y la respuesta (el perfil completo) se escribe
 * directo en la caché de `useProfileQuery`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/services/http/httpClient';
import { EMPTY_SKILL_VALUES } from '../schemas/skill.schema';
import { useAddSkill } from './useAddSkill';

interface CreatedProfile {
  id: string;
}

describe('useAddSkill', () => {
  it('agrega la habilidad y actualiza la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useAddSkill(created.id), { wrapper: Wrapper });

    result.current.mutate({ ...EMPTY_SKILL_VALUES, skillName: 'React', level: 'ADVANCED' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({
      skills: [expect.objectContaining({ skillName: 'React' })],
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

    const { result } = renderHook(() => useAddSkill(created.id), { wrapper: Wrapper });

    result.current.mutate({
      ...EMPTY_SKILL_VALUES,
      skillName: 'React',
      // El <Select> real solo ofrece los 3 valores del enum; este caso
      // simula un valor que la interfaz nunca produce.
      level: 'EXPERTO',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
