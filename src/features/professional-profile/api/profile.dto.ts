// PROVISIONAL — pendiente de OpenAPI (CLAUDE.md §8, bloqueo C-01).
/**
 * Forma cruda del `ProfileRecord` que devuelve `src/mocks/handlers/profiles.handlers.ts`
 * (CM-53, extendido en CM-61 con `education`/`workExperience`, en CM-65 con
 * `skills` y en CM-69 con `targetRoles`). CM-65 y CM-69 se construyeron en
 * ramas independientes en paralelo; esta es la versión ya fusionada, con
 * ambos campos reales al mismo tiempo.
 *
 * `EducationDto`/`WorkExperienceDto` y sus dos `Add*RequestDto` replican
 * los campos reales del backend (`AddEducationRequest`/
 * `AddWorkExperienceRequest`/`ProfileResponse.EducationItem`/
 * `ProfileResponse.WorkExperienceItem` en `cameia-perfil`), compartidos en
 * la sesión que escribió este archivo — no son una referencia inventada
 * como el resto de este DTO mientras C-01 sigue abierto.
 *
 * `SkillDto`/`AddSkillRequestDto` (CM-65) y `TargetRoleDto`/
 * `AddTargetRoleRequestDto`/`UpdateTargetRoleRequestDto` (CM-69) replican
 * igual los campos reales de `ProfileController.java` (parámetros de
 * `AddSkillCommand`/`AddTargetRoleCommand`/`UpdateTargetRoleCommand`).
 * `ProfessionalRoleDto` es la única excepción: `ProfessionalRoleResponse.java`
 * no se compartió, solo su uso (`ProfessionalRoleResponse.from(role)`) — se
 * asume `{ id, name }`, la misma forma que ya usa el catálogo estático de
 * `src/mocks/data/catalogs.ts`, documentado como supuesto razonable, no
 * contrato confirmado.
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

/** Rol objetivo ya asociado al perfil. `id` es el identificador propio del Rol Objetivo (ver `TargetRoleItem` en `model/profile.types.ts`). */
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

/** Body real de `POST /api/v1/profiles/:id/target-roles` (parámetros de `AddTargetRoleCommand`, `ProfileController.java`). */
export interface AddTargetRoleRequestDto {
  professionalRoleId: string;
  provenance: string;
}

/** Body real de `PATCH /api/v1/profiles/:id/target-roles/:roleId` — sustituye el rol referenciado conservando el id del Rol Objetivo (`UpdateTargetRoleCommand`, `ProfileController.java`). */
export interface UpdateTargetRoleRequestDto {
  professionalRoleId: string;
}

// PROVISIONAL — forma exacta de `ProfessionalRoleResponse.java` sin confirmar (ver TSDoc de cabecera).
/** Catálogo cerrado de roles TI, `GET /api/v1/professional-roles` (`ProfessionalRoleController.java`, CM-23). */
export interface ProfessionalRoleDto {
  id: string;
  name: string;
}
