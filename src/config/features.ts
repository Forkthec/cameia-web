/**
 * Feature flags del alcance de sprint (CLAUDE.md §11). Todas en `false` hasta
 * que su historia entre a sprint: no se activan a mano ni se adivina el
 * comportamiento de algo que el backend todavía no soporta.
 */
export const featureFlags = {
  AUDIO_RESPONSES: false, // HU-5.8, Sprint 2
  AI_PROFILE_AUTOFILL: false, // HU-2.6-2.10, Sprint 2
  EMAIL_VERIFICATION: false, // HU-1.2, fuera de Sprint 1
  JOB_OFFERS: false, // HE-03, fuera del MVP
  PROGRESS: false, // HE-07, posterior
} as const;
