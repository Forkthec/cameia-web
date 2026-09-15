/**
 * Eliminar una experiencia laboral (HU-2.4, CM-61). El `DELETE` devuelve el
 * perfil completo sin el ítem: se escribe directo en la caché, sin invalidar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeWorkExperience } from '../api/profile.api';

export function useRemoveWorkExperience(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workExperienceId: string) => removeWorkExperience(id, workExperienceId),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
