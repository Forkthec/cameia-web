/**
 * Tipos de dominio del Perfil Profesional que necesita el paso de
 * Información General (CM-53). No modela todavía experiencia, educación,
 * habilidades ni roles objetivo: esos campos son de CM-61/CM-65/CM-69 y se
 * agregan cuando esos tickets los necesiten (ARCHITECTURE.md §5, regla de
 * crecimiento).
 *
 * `SummaryProvenance` incluye `AI_SUGGESTED`, que en Sprint 1 es
 * inalcanzable desde la interfaz (nace de HU-2.6–2.10, Sprint 2): se modela
 * igual porque CA-2.3.2 exige que el sistema sepa distinguirlo de
 * `AI_EDITED` cuando exista, y porque `docs/mocks/handlers/profiles.handlers.ts`
 * ya lo produce internamente para las pruebas de esa regla (SPEC.md §2).
 */
export type ProfileStatus = 'IN_PROGRESS' | 'COMPLETED';

export type SummaryProvenance = 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED' | null;

export interface Profile {
  id: string;
  status: ProfileStatus;
  name: string;
  summary: string;
  summaryProvenance: SummaryProvenance;
}
