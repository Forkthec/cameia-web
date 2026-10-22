/**
 * Mapper DTO → modelo de dominio para el wizard de entrevista.
 * Es el cortafuegos (ADR-0003, CLAUDE.md §8): todo lo que el backend
 * pueda cambiar se detiene aqui.
 */
import type { ProfileSummaryItem } from '../model/interviewSetup.types';
import type { ProfileSummaryDto, ProfessionalRoleCatalogDto } from './interviewSetup.dto';
import type { StartSessionResponseDto } from './interviewSession.dto';

export function toProfileSummary(dto: ProfileSummaryDto): ProfileSummaryItem {
  return {
    id: dto.id,
    name: dto.name ?? '',
    status: dto.status as ProfileSummaryItem['status'],
    targetRoles: dto.targetRoles.map((r) => ({
      professionalRoleId: r.professionalRoleId,
      roleTitle: r.roleTitle,
    })),
  };
}

export interface ProfessionalRoleMapped {
  id: string;
  name: string;
  category: string;
}

export function toProfessionalRoleCatalog(dto: ProfessionalRoleCatalogDto): ProfessionalRoleMapped {
  return {
    id: dto.id,
    name: dto.nombre,
    category: dto.categoria,
  };
}

/** Entrada que el chat (feature `interview-session`) lee del estado de la navegación. */
export interface ChatEntry {
  sessionId: string;
  /** Idioma de la entrevista (BCP-47); lo usa el aviso de idioma distinto en la voz (CA-5.12.10). */
  sessionLanguage: string;
  answerFormat: 'TEXTO' | 'AUDIO';
  question: { turnId: string; number: number; text: string };
  progress: { current: number; total: number };
}

/**
 * Convierte la respuesta de `…/start` (HU-4.5) en la entrada del chat. Las
 * features no comparten tipos (CLAUDE.md §3.4): el chat valida esta forma
 * con su propio `readSessionEntry`.
 *
 * @param sessionId sesión iniciada.
 * @param dto respuesta de `…/start`.
 * @param sessionLanguage idioma elegido en el asistente; `…/start` no lo devuelve.
 * @returns la entrada del chat.
 */
export function toChatEntry(
  sessionId: string,
  dto: StartSessionResponseDto,
  sessionLanguage: string,
): ChatEntry {
  return {
    sessionId,
    sessionLanguage,
    answerFormat: dto.answerFormat === 'AUDIO' ? 'AUDIO' : 'TEXTO',
    question: { turnId: dto.question.turnId, number: dto.question.number, text: dto.question.text },
    progress: { current: dto.progress.currentQuestion, total: dto.progress.totalQuestions },
  };
}
