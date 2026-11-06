/**
 * Eliminar una habilidad (HU-2.5, CM-65). El `DELETE` devuelve 204 sin body:
 * se invalida la caché para que TanStack Query rehaga el `GET` del perfil.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeSkill } from '../api/profile.api';

export function useRemoveSkill(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (skillId: string) => removeSkill(id, skillId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', id] });
    },
  });
}
