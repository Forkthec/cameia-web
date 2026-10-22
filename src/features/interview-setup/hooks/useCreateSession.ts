/**
 * Mutacion para crear una sesion de entrevista (HU-4.4, CA-4.4.1).
 * Reintenta automaticamente ante PROFILE_SYNC_PENDING (CA-4.4.19):
 * 2 reintentos a 1s y 3s antes de mostrar el mensaje al usuario.
 *
 * **Idempotency-Key (respuesta de Backend del 20-10-2026, §4.1).** Una clave
 * por configuracion: los reintentos automaticos y un nuevo «Iniciar
 * entrevista» con la misma configuracion (por ejemplo tras un fallo de red)
 * reutilizan la clave, asi el backend devuelve la misma sesion en vez de
 * crear otra. Si la configuracion cambia, se genera una clave nueva.
 */
import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/services/http/ApiError';
import { createInterviewSession } from '../api/interviewSession.api';
import type {
  CreateSessionRequestDto,
  CreateSessionResponseDto,
} from '../api/interviewSession.dto';

const RETRY_DELAYS = [1000, 3000];

/**
 * @returns la mutacion de creacion; `mutate` recibe la configuracion del asistente.
 */
export function useCreateSession() {
  const lastAttempt = useRef<{ fingerprint: string; key: string } | null>(null);

  function keyFor(body: CreateSessionRequestDto): string {
    const fingerprint = JSON.stringify(body);
    if (lastAttempt.current?.fingerprint !== fingerprint) {
      lastAttempt.current = { fingerprint, key: crypto.randomUUID() };
    }
    return lastAttempt.current.key;
  }

  return useMutation<CreateSessionResponseDto, ApiError, CreateSessionRequestDto>({
    mutationFn: (body) => createInterviewSession(body, keyFor(body)),
    retry: (failureCount, error) => {
      if (error?.code === 'PROFILE_SYNC_PENDING' && failureCount < RETRY_DELAYS.length) {
        return true;
      }
      return false;
    },
    retryDelay: (failureCount) => RETRY_DELAYS[failureCount - 1] ?? 3000,
  });
}
