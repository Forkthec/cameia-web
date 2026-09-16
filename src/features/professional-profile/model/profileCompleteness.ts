/**
 * Deriva el estado del índice de secciones (`StepList`/acordeón) y el valor
 * numérico de la barra de completitud del perfil (nodo `132:2570` de Figma)
 * a partir de los requisitos que esta rama puede calcular: nombre, resumen,
 * al menos una educación (CM-61) y al menos una habilidad (CM-65). El
 * quinto requisito (≥1 rol objetivo) lo suma CM-69, en una **rama
 * independiente en paralelo** (ambas parten de `develop`, no una de otra —
 * ver plan de sesión) — `profile.targetRoles` ya existe en el tipo
 * `Profile` de esta rama (de solo lectura, para poder redirigir/bloquear
 * finalizar sin construir su gestión), así que técnicamente esta función SÍ
 * podría contarlo, pero deliberadamente no lo hace: contarlo aquí sin que
 * CM-69 también lo cuente (o viceversa) dejaría las dos ramas calculando la
 * completitud de forma distinta hasta que se fusionen. Queda como nota de
 * reconciliación explícita para quien fusione la segunda de las dos ramas:
 * unificar `getCompletenessValue`/`getSectionStatuses` para que sumen los 5
 * requisitos juntos, no 4+4 por separado. Mientras tanto, el máximo real es
 * `PROFILE_COMPLETENESS_MAX = 5` (`model/profile.constants.ts`), así que la
 * fracción mostrada en esta rama todavía no llega a estar completa (SPEC.md
 * §9, decisión D-D): es intencional, no un error — el botón "Finalizar y
 * Continuar" también sigue deshabilitado hasta que la fusión junte ambos
 * requisitos.
 */
import type { StepStatus } from '@/design-system/molecules/Stepper';
import type { Profile } from './profile.types';

export type ProfileSectionId = 'general-info' | 'education' | 'work-experience' | 'skills';

/**
 * @param profile perfil actual, tal como lo entrega la caché de `useProfileQuery`.
 * @returns el estado de cada sección del índice. "Experiencia Laboral" nunca
 *   pasa de `upcoming`: no es un requisito de finalización (HU-2.4), así que
 *   no tiene una noción de "completa" que mostrarle al usuario. "Habilidades"
 *   sigue el mismo criterio secuencial que "Formación académica": se marca
 *   `current` recién cuando los requisitos anteriores ya están.
 */
export function getSectionStatuses(profile: Profile): Record<ProfileSectionId, StepStatus> {
  const hasGeneralInfo = profile.name.trim().length > 0 && profile.summary.trim().length > 0;
  const hasEducation = profile.education.length > 0;
  const hasSkills = profile.skills.length > 0;

  return {
    'general-info': hasGeneralInfo ? 'complete' : 'current',
    education: hasEducation ? 'complete' : hasGeneralInfo ? 'current' : 'upcoming',
    'work-experience': 'upcoming',
    skills: hasSkills ? 'complete' : hasEducation ? 'current' : 'upcoming',
  };
}

/**
 * @param profile perfil actual.
 * @returns cuántos de los 5 requisitos de finalización se cumplen, contando
 *   los 4 que esta rama puede calcular (nombre, resumen, ≥1 educación, ≥1
 *   habilidad) — falta sumar ≥1 rol objetivo (CM-69, ver nota de cabecera).
 */
export function getCompletenessValue(profile: Profile): number {
  let value = 0;
  if (profile.name.trim().length > 0) value += 1;
  if (profile.summary.trim().length > 0) value += 1;
  if (profile.education.length > 0) value += 1;
  if (profile.skills.length > 0) value += 1;
  return value;
}
