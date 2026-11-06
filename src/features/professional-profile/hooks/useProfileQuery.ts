/**
 * Perfil por id (CM-53, §3.2: "estado de carga mientras se obtiene el
 * perfil por id"). Llave `['profile', id]` — primer uso de TanStack Query
 * en esta feature más allá de una mutación inline (`NewProfilePage`), así
 * que fija la convención de nombrar la llave por el recurso singular.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '../api/profile.api';

export function useProfileQuery(id: string) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: () => fetchProfile(id),
  });
}
