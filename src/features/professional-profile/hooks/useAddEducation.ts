/**
 * Agregar una formación académica (HU-2.4, CM-61). Mismo patrón que
 * `useUpdateProfileGeneralInfo`: en éxito escribe el perfil completo
 * directo en la caché de `useProfileQuery`, sin invalidar — el `POST` ya
 * devuelve el registro completo con el ítem nuevo incluido.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addEducation } from '../api/profile.api';
import type { EducationFormValues } from '../schemas/education.schema';

export function useAddEducation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: EducationFormValues) => addEducation(id, values),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
