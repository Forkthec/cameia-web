/**
 * Sustituir el rol profesional de un rol objetivo ya persistido (HU-2.11,
 * CM-69): `PATCH` real, no "eliminar y agregar" — conserva el id del Rol
 * Objetivo (memo del PO del 13-sep, C-05). Mismo patrón de caché que
 * `useAddEducation`: en éxito escribe el perfil completo, sin invalidar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { substituteTargetRole } from '../api/profile.api';

interface SubstituteTargetRoleVariables {
  roleId: string;
  professionalRoleId: string;
}

export function useSubstituteTargetRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, professionalRoleId }: SubstituteTargetRoleVariables) =>
      substituteTargetRole(id, roleId, professionalRoleId),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
