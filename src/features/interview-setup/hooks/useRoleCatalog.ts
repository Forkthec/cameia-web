/**
 * Hook de TanStack Query para el catalogo de roles profesionales (CA-4.2.5).
 * El catalogo rara vez cambia, asi que se cachea con `staleTime` largo.
 * CLAUDE.md §3.6: datos del servidor en TanStack Query, no en Zustand.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchRoleCatalog } from '../api/interviewSetup.api';

export function useRoleCatalog() {
  return useQuery({
    queryKey: ['roles', 'catalog'],
    queryFn: fetchRoleCatalog,
    staleTime: 5 * 60 * 1000,
  });
}
