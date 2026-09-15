// PROVISIONAL — pendiente de OpenAPI (CLAUDE.md §8, bloqueo C-01).
/**
 * Forma cruda del `ProfileRecord` que devuelve `src/mocks/handlers/profiles.handlers.ts`
 * (CM-53, extendido en CM-61 con `education`/`workExperience`). `skills`/
 * `targetRoleIds` existen en el mock pero son de CM-65/CM-69, así que
 * quedan fuera de este DTO hasta que esos tickets los necesiten
 * (ARCHITECTURE.md §5, regla de crecimiento) — el `mapper` no los toca.
 *
 * `EducationDto`/`WorkExperienceDto` y sus dos `Add*RequestDto` replican
 * los campos reales del backend (`AddEducationRequest`/
 * `AddWorkExperienceRequest`/`ProfileResponse.EducationItem`/
 * `ProfileResponse.WorkExperienceItem` en `cameia-perfil`), compartidos en
 * la sesión que escribió este archivo — no son una referencia inventada
 * como el resto de este DTO mientras C-01 sigue abierto.
 */
export interface EducationDto {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  level: string;
  /** `"YYYY-MM"` (backend real: `java.time.YearMonth`, sin día). */
  startDate: string;
  endDate: string | null;
  inProgress: boolean;
  provenance: string;
}

export interface WorkExperienceDto {
  id: string;
  company: string;
  position: string;
  description: string | null;
  /** `"YYYY-MM"` (backend real: `java.time.YearMonth`, sin día). */
  startDate: string;
  endDate: string | null;
  employmentStatus: string;
  provenance: string;
}

export interface ProfileDto {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  name: string;
  summary: string;
  summaryProvenance: 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED' | null;
  education: EducationDto[];
  workExperience: WorkExperienceDto[];
}

/** Body real de `POST /api/v1/profiles/:id/educations` (`AddEducationRequest.java`). */
export interface AddEducationRequestDto {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  level: string;
  startDate: string;
  endDate: string | null;
  inProgress: boolean;
  provenance: string;
}

/** Body real de `POST /api/v1/profiles/:id/work-experiences` (`AddWorkExperienceRequest.java`). */
export interface AddWorkExperienceRequestDto {
  company: string;
  position: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  employmentStatus: string;
  provenance: string;
}
