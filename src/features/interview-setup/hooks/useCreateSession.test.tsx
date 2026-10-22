/**
 * Protege el contrato de creación de la sesión acordado con Backend (respuesta
 * del 20-10-2026): cuerpo en camelCase (§6.1) y la misma `Idempotency-Key` al
 * repetir la misma configuración, nueva si la configuración cambia (§4.1).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useHandlers } from '@/test/msw';
import { useCreateSession } from './useCreateSession';
import type { CreateSessionRequestDto } from '../api/interviewSession.dto';

const BODY: CreateSessionRequestDto = {
  profileId: 'p1',
  targetRoleId: 'r1',
  jobOffer: null,
  mode: 'SIMULACION',
  tone: 'CALIDO',
  answerFormat: 'TEXTO',
  sessionLanguage: 'es-CO',
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useCreateSession', () => {
  it('envía el cuerpo en camelCase y reutiliza la clave con la misma configuración', async () => {
    const keys: string[] = [];
    const bodies: unknown[] = [];
    useHandlers(
      http.post('*/api/v1/interviews/sessions', async ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key') ?? '');
        bodies.push(await request.json());
        return HttpResponse.json(
          { sessionId: 's1', status: 'CONFIGURADA', ongoingSession: null },
          { status: 201 },
        );
      }),
    );
    const { result } = renderHook(() => useCreateSession(), { wrapper });

    act(() => result.current.mutate(BODY));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => result.current.mutate(BODY));
    await waitFor(() => expect(keys).toHaveLength(2));
    act(() => result.current.mutate({ ...BODY, tone: 'ESTRICTO' }));
    await waitFor(() => expect(keys).toHaveLength(3));

    expect(bodies[0]).toEqual(BODY);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it('acepta 200 cuando el backend reutiliza la sesión configurada', async () => {
    useHandlers(
      http.post('*/api/v1/interviews/sessions', () =>
        HttpResponse.json({ sessionId: 's9', status: 'CONFIGURADA', ongoingSession: null }),
      ),
    );
    const { result } = renderHook(() => useCreateSession(), { wrapper });
    act(() => result.current.mutate(BODY));
    await waitFor(() => expect(result.current.data?.sessionId).toBe('s9'));
  });
});
