/**
 * Hook de TanStack Query para la lista de perfiles del usuario (CA-4.2.18).
 * CLAUDE.md §3.6: datos del servidor en TanStack Query, no en Zustand.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchProfileList } from '../api/interviewSetup.api';

export function useProfileList() {
  return useQuery({
    queryKey: ['profiles', 'list'],
    queryFn: fetchProfileList,
  });
}
