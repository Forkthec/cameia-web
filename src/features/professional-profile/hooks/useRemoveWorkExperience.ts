/**
 * Eliminar una experiencia laboral (HU-2.4, CM-61). El `DELETE` devuelve 204
 * sin body: se invalida la caché para que TanStack Query rehaga el `GET`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeWorkExperience } from '../api/profile.api';

export function useRemoveWorkExperience(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workExperienceId: string) => removeWorkExperience(id, workExperienceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', id] });
    },
  });
}
