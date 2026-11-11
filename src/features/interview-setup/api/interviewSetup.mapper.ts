/**
 * Mapper DTO → modelo de dominio para el wizard de entrevista.
 * Es el cortafuegos (ADR-0003, CLAUDE.md §8): todo lo que el backend
 * pueda cambiar se detiene aqui.
 */
import {
  ANSWER_FORMATS,
  INTERVIEW_MODES,
  INTERVIEW_TONES,
  SESSION_LANGUAGES,
  type CatalogOption,
  type InterviewCatalog,
  type ProfileSummaryItem,
} from '../model/interviewSetup.types';
import type {
  CatalogOptionDto,
  InterviewCatalogDto,
  ProfileSummaryDto,
  ProfessionalRoleCatalogDto,
} from './interviewSetup.dto';
import type { SessionStateDto } from './interviewSession.dto';

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
 * Convierte el objeto de estado (de `…/start` o `…/state`) en la entrada del
 * chat. Las features no comparten tipos (CLAUDE.md §3.4): el chat valida
 * esta forma con su propio `readSessionEntry`.
 *
 * @param sessionId sesión en curso.
 * @param dto objeto de estado.
 * @param sessionLanguage idioma de la entrevista; el objeto de estado no lo trae.
 * @returns la entrada del chat, o `null` si la sesión no tiene pregunta pendiente
 *   (no está EN_CURSO).
 */
export function toChatEntry(
  sessionId: string,
  dto: SessionStateDto,
  sessionLanguage: string,
): ChatEntry | null {
  const pending = dto.pendingQuestion;
  if (!pending) return null;
  return {
    sessionId,
    sessionLanguage,
    answerFormat: dto.answerFormat === 'AUDIO' ? 'AUDIO' : 'TEXTO',
    question: { turnId: pending.turnId, number: pending.number, text: pending.text },
    progress: { current: dto.progress.currentQuestion, total: dto.progress.totalQuestions },
  };
}

/**
 * Conserva el orden de Backend y descarta los valores que la pantalla aún no
 * conoce: no tienen texto en i18n y CLAUDE.md prohíbe mostrar textos fijos.
 */
function toCatalogOptions<T extends string>(
  dtos: CatalogOptionDto[],
  known: readonly T[],
): CatalogOption<T>[] {
  return dtos
    .filter((dto): dto is { value: T; available: boolean } =>
      (known as readonly string[]).includes(dto.value),
    )
    .map((dto) => ({ value: dto.value, available: dto.available }));
}

export function toInterviewCatalog(dto: InterviewCatalogDto): InterviewCatalog {
  return {
    modes: toCatalogOptions(dto.modes, INTERVIEW_MODES),
    tones: toCatalogOptions(dto.tones, INTERVIEW_TONES),
    answerFormats: toCatalogOptions(dto.answerFormats, ANSWER_FORMATS),
    languages: toCatalogOptions(dto.languages, SESSION_LANGUAGES),
  };
}
