// PROVISIONAL — pendiente de OpenAPI (CLAUDE.md §8, bloqueo C-01).
/**
 * Forma cruda del `ProfileRecord` que devuelve `src/mocks/handlers/profiles.handlers.ts`.
 * Solo tipa lo que CM-53 necesita: `workExperience`/`education`/`skills`/
 * `targetRoleIds` existen en el mock pero son de CM-61/CM-65/CM-69, así que
 * quedan fuera de este DTO hasta que esos tickets los necesiten
 * (ARCHITECTURE.md §5, regla de crecimiento) — el `mapper` no los toca.
 */
export interface ProfileDto {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  name: string;
  summary: string;
  summaryProvenance: 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED' | null;
}
