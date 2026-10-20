/**
 * Mutacion para crear una sesion de entrevista (HU-4.4, CA-4.4.1).
 * Reintenta automaticamente ante PROFILE_SYNC_PENDING (CA-4.4.19):
 * 2 reintentos a 1s y 3s antes de mostrar el mensaje al usuario.
 */
import { useMutation } from '@tanstack/react-query';
import { createInterviewSession } from '../api/interviewSession.api';
import type {
  CreateSessionRequestDto,
  CreateSessionResponseDto,
} from '../api/interviewSession.dto';
import { ApiError } from '@/services/http/ApiError';

const RETRY_DELAYS = [1000, 3000];

export function useCreateSession() {
  return useMutation<CreateSessionResponseDto, ApiError, CreateSessionRequestDto>({
    mutationFn: createInterviewSession,
    retry: (failureCount, error) => {
      if (error?.code === 'PROFILE_SYNC_PENDING' && failureCount < RETRY_DELAYS.length) {
        return true;
      }
      return false;
    },
    retryDelay: (failureCount) => RETRY_DELAYS[failureCount - 1] ?? 3000,
  });
}
