/**
 * Eliminar una formación académica (HU-2.4, CM-61). El `DELETE` devuelve el
 * perfil completo sin el ítem: se escribe directo en la caché, sin invalidar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeEducation } from '../api/profile.api';

export function useRemoveEducation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (educationId: string) => removeEducation(id, educationId),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
