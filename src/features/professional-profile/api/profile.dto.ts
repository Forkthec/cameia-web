// PROVISIONAL — pendiente de OpenAPI (CLAUDE.md §8, bloqueo C-01).
/**
 * Forma cruda del `ProfileRecord` que devuelve `src/mocks/handlers/profiles.handlers.ts`
 * (CM-53, extendido en CM-61 con `education`/`workExperience`, en CM-65 con
 * `skills` y con `targetRoles` de solo lectura).
 *
 * `EducationDto`/`WorkExperienceDto` y sus dos `Add*RequestDto` replican
 * los campos reales del backend (`AddEducationRequest`/
 * `AddWorkExperienceRequest`/`ProfileResponse.EducationItem`/
 * `ProfileResponse.WorkExperienceItem` en `cameia-perfil`), compartidos en
 * la sesión que escribió este archivo — no son una referencia inventada
 * como el resto de este DTO mientras C-01 sigue abierto.
 *
 * `SkillDto`/`AddSkillRequestDto` (CM-65) replican igual los campos reales
 * de `ProfileController.java` (parámetros de `AddSkillCommand`).
 * `TargetRoleDto` (forma, no gestión) se modela idéntico a como lo hace
 * CM-69 — rama independiente en paralelo que sí construye su alta/
 * sustitución/baja — para que ambas ramas coincidan en este campo al
 * fusionarse; esta rama solo lo lee (cuenta `targetRoles.length` para el 5º
 * requisito de finalización).
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

/** Habilidad ya persistida. `skillName` es texto libre — sin catálogo. */
export interface SkillDto {
  id: string;
  skillName: string;
  level: string;
  provenance: string;
}

/** Ver TSDoc de cabecera: forma compartida con CM-69, esta rama solo la lee. */
export interface TargetRoleDto {
  id: string;
  professionalRoleId: string;
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
  skills: SkillDto[];
  targetRoles: TargetRoleDto[];
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

/** Body real de `POST /api/v1/profiles/:id/skills` (parámetros de `AddSkillCommand`, `ProfileController.java`). */
export interface AddSkillRequestDto {
  skillName: string;
  level: string;
  provenance: string;
}
