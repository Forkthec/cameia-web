/**
 * Guardar la sección de Información General (CA-2.3.1). En éxito, escribe
 * la respuesta directamente en la caché de `useProfileQuery` en vez de
 * invalidar y volver a pedir el perfil: el `PATCH` ya devuelve el registro
 * completo, con el `summaryProvenance` que el mock acaba de recalcular
 * (CA-2.3.2, CA-2.3.4) — invalidar sería una vuelta de red redundante.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGeneralInfo } from '../api/profile.api';
import type { GeneralInfoFormValues } from '../schemas/generalInfo.schema';

export function useUpdateProfileGeneralInfo(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: GeneralInfoFormValues) => updateGeneralInfo(id, values),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
