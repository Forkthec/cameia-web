/**
 * Eliminar un rol objetivo del perfil (HU-2.11, CM-69). El `DELETE` devuelve
 * 204 sin body: se invalida la caché para que TanStack Query rehaga el `GET`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeTargetRole } from '../api/profile.api';

export function useRemoveTargetRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => removeTargetRole(id, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', id] });
    },
  });
}
