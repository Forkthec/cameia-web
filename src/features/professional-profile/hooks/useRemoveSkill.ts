/**
 * Eliminar una habilidad (HU-2.5, CM-65). El `DELETE` devuelve el perfil
 * completo sin el ítem: se escribe directo en la caché, sin invalidar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeSkill } from '../api/profile.api';

export function useRemoveSkill(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (skillId: string) => removeSkill(id, skillId),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
