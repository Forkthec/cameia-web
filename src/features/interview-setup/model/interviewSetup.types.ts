/**
 * Tipos de dominio del asistente de configuracion de entrevista (HU-4.2, HU-4.3).
 * Los datos de este wizard no se persisten aqui: viajan al crear la sesion
 * en HU-4.4. Los codigos de enumerado coinciden con los del backend
 * (docs/GLOSSARY.md §5) y con las llaves de i18n (CLAUDE.md §7).
 */
export interface ProfileSummaryItem {
  id: string;
  name: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  targetRoles: ProfileTargetRoleSummary[];
}

export interface ProfileTargetRoleSummary {
  professionalRoleId: string;
  roleTitle: string;
}

export const INTERVIEW_MODES = ['SIMULACION', 'ENTRENO'] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export const INTERVIEW_TONES = ['PROFESIONAL_NEUTRO', 'CALIDO', 'ESTRICTO', 'MOTIVADOR'] as const;
export type InterviewTone = (typeof INTERVIEW_TONES)[number];

export const ANSWER_FORMATS = ['AUDIO', 'TEXTO'] as const;
export type AnswerFormat = (typeof ANSWER_FORMATS)[number];

export const SESSION_LANGUAGES = ['es-CO', 'en'] as const;
export type SessionLanguage = (typeof SESSION_LANGUAGES)[number];

export interface InterviewSetupData {
  profileId: string | null;
  jobOffer: string | null;
  targetRoleId: string | null;
  mode: InterviewMode;
  tone: InterviewTone;
  answerFormat: AnswerFormat;
  sessionLanguage: SessionLanguage;
}

export interface RoleCatalogGroup {
  label: string;
  roles: { id: string; name: string }[];
}
