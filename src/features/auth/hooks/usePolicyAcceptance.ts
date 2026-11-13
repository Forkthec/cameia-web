/**
 * Decide si se muestra el aviso de política nueva (CM-365, criterio 5) y
 * guarda la aceptación. Si la consulta falla no se bloquea la aplicación: el
 * aviso aparece la próxima vez que la consulta responda. Tras aceptar, se
 * vuelve a consultar para cerrar el aviso con el dato de Cuentas.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/http/ApiError';
import { acceptCurrentPolicy, fetchNeedsPolicyAcceptance } from '../api/policyAcceptance.api';

const POLICY_QUERY_KEY = ['account', 'policyAcceptance'] as const;

/** Por qué no se pudo guardar la aceptación; nombra la llave de i18n. */
export type PolicyAcceptanceError = 'cambio' | 'generico' | 'red';

/**
 * @param enabled `true` con sesión iniciada.
 * @returns si hay que aceptar, la acción `accept` y su estado.
 */
export function usePolicyAcceptance(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: POLICY_QUERY_KEY,
    queryFn: fetchNeedsPolicyAcceptance,
    enabled,
  });
  const mutation = useMutation({
    mutationFn: acceptCurrentPolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POLICY_QUERY_KEY }),
  });

  let error: PolicyAcceptanceError | null = null;
  if (mutation.error) {
    if (!(mutation.error instanceof ApiError)) error = 'red';
    // Cuentas responde `VALIDATION_FAILED` con el motivo en `errors[].code`.
    else if (
      mutation.error.hasCode('POLICY_VERSION_OUTDATED') ||
      mutation.error.errors.some((item) => item.code === 'POLICY_VERSION_OUTDATED')
    )
      error = 'cambio';
    else error = 'generico';
  }

  return {
    needsAcceptance: query.data === true,
    isAccepting: mutation.isPending,
    error,
    accept: () => mutation.mutate(),
  };
}
