/**
 * Eliminar un rol objetivo del perfil (HU-2.11, CM-69). El `DELETE` devuelve
 * el perfil completo sin el ítem: se escribe directo en la caché, sin
 * invalidar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeTargetRole } from '../api/profile.api';

export function useRemoveTargetRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => removeTargetRole(id, roleId),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
