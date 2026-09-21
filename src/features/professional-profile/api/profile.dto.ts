// PROVISIONAL — pendiente de OpenAPI (CLAUDE.md §8, bloqueo C-01).
/**
 * Forma cruda del `ProfileRecord` que devuelve `src/mocks/handlers/profiles.handlers.ts`
 * (CM-53, extendido en CM-61 con `educations`/`workExperiences`, en CM-65 con
 * `profileSkills` y en CM-69 con `targetRoles`). CM-65 y CM-69 se construyeron en
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
 *
 * **CM-195 (bug de crash, 20-sep-2026):** `ProfileDto` traía tres nombres de
 * campo inventados (`education`/`workExperience`/`skills`) que nunca
 * coincidieron con el `record ProfileResponse` real de `cameia-perfil`
 * (`educations`/`workExperiences`/`profileSkills`, confirmado línea por
 * línea contra el código fuente Java + una captura HAR real). Como esos
 * campos no existían en la respuesta real, `dto.education`/etc. eran
 * `undefined`, y `toProfile` llamaba `.map()` sobre ellos — crash en
 * `EditProfilePage` para todo perfil recién creado. Aprovechando que ya se
 * tiene el contrato completo del record real, esta corrección también
 * agrega los campos que faltaban (`reviewStatus`, `provenance` a nivel de
 * perfil, `salaryExpectation`, `preferredModality`, `createdAt`,
 * `updatedAt`) y corrige `name`/`summary` a `string | null` (el backend real
 * los manda `null` en un perfil recién creado, no `''`). Los nombres de
 * salida del modelo de dominio (`Profile.education`/`workExperience`/
 * `skills` en `model/profile.types.ts`) **no cambian** — el mapeador
 * (`profile.mapper.ts`) es el único punto que sabe traducir de un nombre al
 * otro (CLAUDE.md §8).
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

/**
 * Rol objetivo ya asociado al perfil. `id` es el identificador propio del Rol Objetivo (ver `TargetRoleItem` en `model/profile.types.ts`).
 * `roleTitle` (CM-195): campo real de `TargetRoleItem` (record Java) — el nombre del rol ya
 * resuelto por el backend, para no tener que cruzar contra el catálogo solo para mostrarlo.
 * Confirmado en el contrato pero **todavía no consumido**: `toTargetRoleItem` no lo traduce al
 * dominio ni ningún componente lo usa — queda documentado para cuando se necesite, en vez de
 * repetir esta auditoría de contrato después.
 */
export interface TargetRoleDto {
  id: string;
  professionalRoleId: string;
  roleTitle: string;
  provenance: string;
}

/**
 * `name`/`summary` viajan `null` en un perfil recién creado (confirmado por HAR real) — el
 * mapeador los normaliza a `''` para el dominio (`CLAUDE.md §8`: `Profile.name`/`summary` siguen
 * siendo `string` sin nulos, ningún componente cambia).
 *
 * `summaryProvenance` es opcional a propósito: el `record ProfileResponse` real confirmado en
 * CM-195 **no tiene este campo en absoluto** — es lógica de Sprint 2 (HU-2.6–2.10, sugerencia de
 * resumen por IA) que el mock ya simula por adelantado (CA-2.3.1/2.3.2/2.3.4) pero que el backend
 * real todavía no expone. Se conserva en el dominio como placeholder documentado, no se inventa
 * un valor cuando falta — el mapeador lo normaliza a `null`.
 *
 * `reviewStatus`/`provenance` (a nivel de perfil, no confundir con la `provenance` de cada ítem)/
 * `salaryExpectation`/`preferredModality`/`createdAt`/`updatedAt` (CM-195): campos reales del
 * record confirmados por el mismo contrato, agregados aquí para que el DTO refleje la respuesta
 * completa. Ninguno tiene todavía un consumidor en `model/profile.types.ts` — se agregan cuando
 * una pantalla los necesite, no antes (regla de crecimiento, `CLAUDE.md §4`).
 */
export interface ProfileDto {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  reviewStatus: string;
  provenance: string;
  name: string | null;
  summary: string | null;
  summaryProvenance?: 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED' | null;
  salaryExpectation: number | null;
  preferredModality: string | null;
  createdAt: string;
  updatedAt: string;
  educations: EducationDto[];
  workExperiences: WorkExperienceDto[];
  profileSkills: SkillDto[];
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

/**
 * Catálogo cerrado de roles TI, `GET /api/v1/profiles/professional-roles`
 * (`ProfessionalRoleController.java`, CM-23). Forma confirmada contra
 * `ProfessionalRoleResponse.java` (CM-195, auditoría 20-sep-2026): el backend
 * responde en español (`nombre`, `categoria`), no en inglés — este DTO refleja
 * el contrato crudo tal cual llega; la traducción a `ProfessionalRole`
 * (dominio) ocurre en `profile.mapper.ts` (`CLAUDE.md §8`).
 */
export interface ProfessionalRoleDto {
  id: string;
  nombre: string;
  categoria: string;
}
