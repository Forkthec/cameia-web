/**
 * Eliminar una formación académica (HU-2.4, CM-61). El `DELETE` devuelve 204
 * sin body: se invalida la caché para que TanStack Query rehaga el `GET`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeEducation } from '../api/profile.api';

export function useRemoveEducation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (educationId: string) => removeEducation(id, educationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', id] });
    },
  });
}
