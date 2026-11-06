/**
 * Agregar un rol objetivo al perfil (HU-2.11, CM-69). Mismo patrón que
 * `useAddEducation`: en éxito escribe el perfil completo directo en la
 * caché de `useProfileQuery`, sin invalidar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addTargetRole } from '../api/profile.api';

export function useAddTargetRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (professionalRoleId: string) => addTargetRole(id, professionalRoleId),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
