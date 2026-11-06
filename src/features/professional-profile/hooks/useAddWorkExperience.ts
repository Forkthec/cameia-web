/**
 * Agregar una experiencia laboral (HU-2.4, CM-61). Mismo patrón que
 * `useAddEducation`: en éxito escribe el perfil completo directo en la
 * caché de `useProfileQuery`, sin invalidar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addWorkExperience } from '../api/profile.api';
import type { WorkExperienceFormValues } from '../schemas/workExperience.schema';

export function useAddWorkExperience(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: WorkExperienceFormValues) => addWorkExperience(id, values),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
