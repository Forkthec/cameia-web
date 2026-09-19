/**
 * Comportamiento observable de `useFinalizeProfile`. El caso de éxito se
 * fuerza con un handler de MSW puntual (`useHandlers`): esta rama no puede
 * construir, por la API pública, un perfil que cumpla los 5 requisitos
 * reales — el 5º (≥1 rol objetivo) solo se puede satisfacer con los
 * endpoints de Roles Objetivo, que construye CM-69 en una rama
 * independiente en paralelo (`features` tampoco puede importar
 * `seedProfileForTests` de los mocks — `docs/ARCHITECTURE.md` §4). El caso
 * de fracaso con todos los requisitos incumplidos sí se prueba contra el
 * mock real, porque cualquier perfil recién creado ya está incompleto.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { httpClient } from '@/services/http/httpClient';
import { useHandlers } from '@/test/msw';
import { useFinalizeProfile } from './useFinalizeProfile';

interface CreatedProfile {
  id: string;
}

function renderFinalize(id: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, ...renderHook(() => useFinalizeProfile(id), { wrapper: Wrapper }) };
}

describe('useFinalizeProfile', () => {
  it('en éxito escribe el perfil COMPLETED en la caché de useProfileQuery', async () => {
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });
    useHandlers(
      http.post(`*/api/v1/profiles/${created.id}/completion`, () =>
        HttpResponse.json(
          {
            id: created.id,
            status: 'COMPLETED',
            name: 'Ana María Pérez',
            summary: 'Resumen.',
            summaryProvenance: 'MANUAL',
            education: [],
            workExperience: [],
            skills: [],
            targetRoles: [],
          },
          { status: 201 },
        ),
      ),
    );

    const { result, queryClient } = renderFinalize(created.id);
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['profile', created.id])).toMatchObject({
      status: 'COMPLETED',
    });
  });

  it('un perfil incompleto deja el hook en error listando todos los requisitos faltantes', async () => {
    // Sin body: el mock crea el perfil con name='' (un `name: ''` explícito
    // sí se rechaza en la creación — CA-2.2.1 — la ausencia de body no).
    const created = await httpClient.post<CreatedProfile>('/api/v1/profiles');

    const { result } = renderFinalize(created.id);
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    const error = result.current.error as ApiError;
    expect(error.isValidation()).toBe(true);
    expect(error.errors.map((item) => item.field)).toContain('targetRoles');
  });
});
