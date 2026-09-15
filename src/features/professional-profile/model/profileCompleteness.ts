/**
 * Deriva el estado del índice de secciones (`StepList`/acordeón) y el valor
 * numérico de la barra de completitud del perfil (nodo `132:2570` de Figma)
 * a partir de los TRES requisitos que CM-61 puede calcular hoy: nombre,
 * resumen y al menos una educación. Los otros dos requisitos de
 * finalización (≥1 habilidad, ≥1 rol objetivo) son de CM-65/CM-69 y no se
 * cuentan aquí — el máximo real es `PROFILE_COMPLETENESS_MAX = 5`
 * (`model/profile.constants.ts`), así que la fracción mostrada hoy nunca
 * llega a estar completa (SPEC.md §9, decisión D-D): es intencional, no un
 * error, porque el botón "Finalizar y Continuar" también está deshabilitado
 * hasta que existan esos dos requisitos.
 */
import type { StepStatus } from '@/design-system/molecules/Stepper';
import type { Profile } from './profile.types';

export type ProfileSectionId = 'general-info' | 'education' | 'work-experience';

/**
 * @param profile perfil actual, tal como lo entrega la caché de `useProfileQuery`.
 * @returns el estado de cada sección del índice. "Experiencia Laboral" nunca
 *   pasa de `upcoming`: no es un requisito de finalización (HU-2.4), así que
 *   no tiene una noción de "completa" que mostrarle al usuario.
 */
export function getSectionStatuses(profile: Profile): Record<ProfileSectionId, StepStatus> {
  const hasGeneralInfo = profile.name.trim().length > 0 && profile.summary.trim().length > 0;
  const hasEducation = profile.education.length > 0;

  return {
    'general-info': hasGeneralInfo ? 'complete' : 'current',
    education: hasEducation ? 'complete' : hasGeneralInfo ? 'current' : 'upcoming',
    'work-experience': 'upcoming',
  };
}

/**
 * @param profile perfil actual.
 * @returns cuántos de los 5 requisitos de finalización se cumplen, contando
 *   solo los 3 que CM-61 puede calcular (nombre, resumen, ≥1 educación).
 */
export function getCompletenessValue(profile: Profile): number {
  let value = 0;
  if (profile.name.trim().length > 0) value += 1;
  if (profile.summary.trim().length > 0) value += 1;
  if (profile.education.length > 0) value += 1;
  return value;
}
