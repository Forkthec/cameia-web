/**
 * Deriva el estado del índice de secciones (`StepList`/acordeón) y el valor
 * numérico de la barra de completitud del perfil (nodo `132:2570` de Figma)
 * a partir de los 5 requisitos reales de finalización: nombre, resumen, al
 * menos una educación (CM-61), al menos una habilidad (CM-65) y al menos un
 * rol objetivo (CM-69). Habilidades y Roles Objetivo se construyeron en dos
 * ramas independientes en paralelo, cada una calculando solo 4 de los 5
 * requisitos (con una referencia de solo lectura al recurso de la otra) —
 * esta es la versión ya fusionada, que suma los 5 juntos, tal como quedó
 * documentado como pendiente de reconciliación en ambas ramas. El máximo
 * real es `PROFILE_COMPLETENESS_MAX = 5` (`model/profile.constants.ts`,
 * decisión D-D), y con esta fusión la fracción ya puede llegar a estar
 * completa.
 */
import type { StepStatus } from '@/design-system/molecules/Stepper';
import type { Profile } from './profile.types';

export type ProfileSectionId =
  'general-info' | 'education' | 'work-experience' | 'skills' | 'target-roles';

/**
 * @param profile perfil actual, tal como lo entrega la caché de `useProfileQuery`.
 * @returns el estado de cada sección del índice. "Experiencia Laboral" nunca
 *   pasa de `upcoming`: no es un requisito de finalización (HU-2.4), así que
 *   no tiene una noción de "completa" que mostrarle al usuario. "Habilidades"
 *   y "Roles Objetivo" siguen el mismo criterio secuencial que "Formación
 *   académica": cada una se marca `current` recién cuando el requisito
 *   anterior en la secuencia (general-info → education → skills →
 *   target-roles) ya está completo.
 */
export function getSectionStatuses(profile: Profile): Record<ProfileSectionId, StepStatus> {
  const hasGeneralInfo = profile.name.trim().length > 0 && profile.summary.trim().length > 0;
  const hasEducation = profile.education.length > 0;
  const hasSkills = profile.skills.length > 0;
  const hasTargetRoles = profile.targetRoles.length > 0;

  return {
    'general-info': hasGeneralInfo ? 'complete' : 'current',
    education: hasEducation ? 'complete' : hasGeneralInfo ? 'current' : 'upcoming',
    'work-experience': 'upcoming',
    skills: hasSkills ? 'complete' : hasEducation ? 'current' : 'upcoming',
    'target-roles': hasTargetRoles ? 'complete' : hasSkills ? 'current' : 'upcoming',
  };
}

/**
 * @param profile perfil actual.
 * @returns cuántos de los 5 requisitos de finalización se cumplen: nombre,
 *   resumen, ≥1 educación, ≥1 habilidad y ≥1 rol objetivo.
 */
export function getCompletenessValue(profile: Profile): number {
  let value = 0;
  if (profile.name.trim().length > 0) value += 1;
  if (profile.summary.trim().length > 0) value += 1;
  if (profile.education.length > 0) value += 1;
  if (profile.skills.length > 0) value += 1;
  if (profile.targetRoles.length > 0) value += 1;
  return value;
}
