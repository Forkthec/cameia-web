/**
 * Agregar una habilidad (HU-2.5, CM-65). Mismo patrón que `useAddEducation`:
 * en éxito escribe el perfil completo directo en la caché de
 * `useProfileQuery`, sin invalidar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addSkill } from '../api/profile.api';
import type { SkillFormValues } from '../schemas/skill.schema';

export function useAddSkill(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SkillFormValues) => addSkill(id, values),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
