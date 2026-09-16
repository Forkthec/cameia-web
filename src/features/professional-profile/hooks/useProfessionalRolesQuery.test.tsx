/**
 * Comportamiento observable de `useProfessionalRolesQuery` contra el mock
 * real: trae el catálogo cerrado completo (`GET /api/v1/professional-roles`).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useProfessionalRolesQuery } from './useProfessionalRolesQuery';

describe('useProfessionalRolesQuery', () => {
  it('trae el catálogo de roles profesionales', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useProfessionalRolesQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toContainEqual({
      id: 'backend-developer',
      name: 'Desarrollador Backend',
    });
  });
});
