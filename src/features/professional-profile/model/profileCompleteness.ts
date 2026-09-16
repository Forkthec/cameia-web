/**
 * Deriva el estado del índice de secciones (`StepList`/acordeón) y el valor
 * numérico de la barra de completitud del perfil (nodo `132:2570` de Figma)
 * a partir de los requisitos que ya se pueden calcular: nombre, resumen,
 * al menos una educación (CM-61) y al menos un rol objetivo (CM-69). El
 * requisito restante (≥1 habilidad) es de CM-65 y no se cuenta aquí — el
 * máximo real es `PROFILE_COMPLETENESS_MAX = 5` (`model/profile.constants.ts`),
 * así que la fracción mostrada en esta rama todavía no llega a estar
 * completa (SPEC.md §9, decisión D-D): es intencional, no un error, porque
 * el botón "Finalizar y Continuar" también sigue deshabilitado hasta que
 * exista ese requisito.
 */
import type { StepStatus } from '@/design-system/molecules/Stepper';
import type { Profile } from './profile.types';

export type ProfileSectionId = 'general-info' | 'education' | 'work-experience' | 'target-roles';

/**
 * @param profile perfil actual, tal como lo entrega la caché de `useProfileQuery`.
 * @returns el estado de cada sección del índice. "Experiencia Laboral" nunca
 *   pasa de `upcoming`: no es un requisito de finalización (HU-2.4), así que
 *   no tiene una noción de "completa" que mostrarle al usuario. "Roles
 *   Objetivo" sigue el mismo criterio secuencial que "Formación académica":
 *   se marca `current` recién cuando los requisitos anteriores ya están.
 */
export function getSectionStatuses(profile: Profile): Record<ProfileSectionId, StepStatus> {
  const hasGeneralInfo = profile.name.trim().length > 0 && profile.summary.trim().length > 0;
  const hasEducation = profile.education.length > 0;
  const hasTargetRoles = profile.targetRoles.length > 0;

  return {
    'general-info': hasGeneralInfo ? 'complete' : 'current',
    education: hasEducation ? 'complete' : hasGeneralInfo ? 'current' : 'upcoming',
    'work-experience': 'upcoming',
    'target-roles': hasTargetRoles ? 'complete' : hasEducation ? 'current' : 'upcoming',
  };
}

/**
 * @param profile perfil actual.
 * @returns cuántos de los 5 requisitos de finalización se cumplen, contando
 *   los 4 que ya se pueden calcular (nombre, resumen, ≥1 educación, ≥1 rol
 *   objetivo) — falta sumar ≥1 habilidad (CM-65).
 */
export function getCompletenessValue(profile: Profile): number {
  let value = 0;
  if (profile.name.trim().length > 0) value += 1;
  if (profile.summary.trim().length > 0) value += 1;
  if (profile.education.length > 0) value += 1;
  if (profile.targetRoles.length > 0) value += 1;
  return value;
}
