/**
 * Protege en el hook la guarda síncrona de «Reintentar» del panel de fallo de evaluación
 * (CA-5.2.20, reintentos de evaluación agotados; SPEC §9, v11.3 D2: una sola evaluación por uso,
 * guarda síncrona más `disabled`, como en «Enviar»). Es la lección DF-004: `isPending` llega tras
 * un re-render, así que dos llamadas en el mismo instante pueden colarse antes de que el botón se
 * deshabilite. La prueba de la página (R6) no llega a ese caso porque userEvent no hace el 2.º
 * clic sobre un botón deshabilitado; esta (R6b, SPEC §6) llama dos veces a `retryEvaluation` sin
 * re-render entre ambas. Los códigos de error se importan de `model/interviewSession.errorCodes`
 * (D2).
 */
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useHandlers } from '@/test/msw';
import { LLM_UNAVAILABLE } from '../model/interviewSession.errorCodes';
import type { SessionEntry } from '../model/interviewSession.types';
import { useInterviewTurn } from './useInterviewTurn';

const ANSWERS_URL = '*/api/v1/interviews/sessions/:id/answers';
const REPROCESS_URL = '*/api/v1/interviews/sessions/:id/turns/:turnId/reprocess';

const ENTRY: SessionEntry = {
  sessionId: 's1',
  sessionLanguage: 'es-CO',
  answerFormat: 'TEXTO',
  question: { turnId: 's1-t1', number: 1, text: 'Cuéntame sobre un proyecto.' },
  progress: { current: 1, total: 5 },
};

const llmUnavailable = () =>
  HttpResponse.json(
    {
      title: 'Service Unavailable',
      detail: 'LLM no disponible',
      status: 503,
      code: LLM_UNAVAILABLE,
    },
    { status: 503 },
  );

function renderTurn() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return renderHook(() => useInterviewTurn(ENTRY), { wrapper });
}

describe('useInterviewTurn', () => {
  it('dos «Reintentar» en el mismo instante piden una sola evaluación (guarda síncrona)', async () => {
    const state = { count: 0 };
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    useHandlers(
      http.post(ANSWERS_URL, llmUnavailable),
      http.post(REPROCESS_URL, async () => {
        state.count += 1;
        await held;
        return llmUnavailable();
      }),
    );
    const { result } = renderTurn();
    act(() => {
      result.current.submitAnswer({ kind: 'text', text: 'Mi respuesta' });
    });
    await waitFor(() => expect(result.current.phase).toBe('evaluationFailed'));

    act(() => {
      const retry = result.current.retryEvaluation;
      retry();
      retry();
    });
    await waitFor(() => expect(state.count).toBeGreaterThanOrEqual(1));
    release();
    await waitFor(() => expect(result.current.isRetrying).toBe(false));

    expect(state.count).toBe(1);
  });
});
