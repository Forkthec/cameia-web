/**
 * Catálogo cerrado de roles TI (HU-2.11, CM-69), `GET /api/v1/professional-roles`
 * (`ProfessionalRoleController.java`, CM-23). Llave `['professional-roles']`,
 * sin `id`: a diferencia de `['profile', id]`, es un catálogo compartido
 * entre perfiles, no un recurso por usuario. Sin invalidación: el catálogo
 * no cambia durante la sesión.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchProfessionalRoles } from '../api/profile.api';

export function useProfessionalRolesQuery() {
  return useQuery({
    queryKey: ['professional-roles'],
    queryFn: fetchProfessionalRoles,
  });
}
