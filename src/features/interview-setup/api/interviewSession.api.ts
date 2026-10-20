/**
 * Funcion de red para crear una sesion de entrevista (HU-4.4, CA-4.4.1).
 * POST /api/v1/interviews/sessions con la configuracion completa del wizard.
 */
import { httpClient } from '@/services/http/httpClient';
import type { CreateSessionRequestDto, CreateSessionResponseDto } from './interviewSession.dto';

export async function createInterviewSession(
  body: CreateSessionRequestDto,
): Promise<CreateSessionResponseDto> {
  return httpClient.post<CreateSessionResponseDto>('/api/v1/interviews/sessions', body);
}
