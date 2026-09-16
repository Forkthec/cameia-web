/**
 * Finalizar el perfil (HU-2.5, CM-65): `POST /api/v1/profiles/:id/completion`
 * — no `.../finalize`, el nombre que el mock simulaba antes de conocer el
 * código real de `ProfileController.java#completeProfile` (bloqueo C-16,
 * `SPEC.md` §8). Sin body; en éxito el perfil pasa a `COMPLETED` y se
 * escribe directo en la caché de `useProfileQuery`, sin invalidar — mismo
 * patrón que el resto de mutaciones de esta feature.
 *
 * Un 422 (perfil incompleto) también es un `ApiError` normal: el llamador
 * lo distingue con `error.code === 'PROFILE_INCOMPLETE'` y lee
 * `error.details` (un `ApiErrorDetail` por requisito incumplido) para
 * mostrarlos todos a la vez, nunca solo el primero.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { finalizeProfile } from '../api/profile.api';

export function useFinalizeProfile(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => finalizeProfile(id),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', id], profile);
    },
  });
}
