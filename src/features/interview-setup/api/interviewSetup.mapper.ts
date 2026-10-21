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
 * @returns la entrada del chat.
 */
export function toChatEntry(sessionId: string, dto: StartSessionResponseDto): ChatEntry {
  return {
    sessionId,
    answerFormat: dto.forma_respuesta === 'AUDIO' ? 'AUDIO' : 'TEXTO',
    question: {
      turnId: dto.pregunta.turno_id,
      number: dto.pregunta.numero,
      text: dto.pregunta.texto,
    },
    progress: { current: dto.progreso.pregunta_actual, total: dto.progreso.total_preguntas },
  };
}
