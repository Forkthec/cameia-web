/**
 * Cortafuegos entre el contrato crudo (`ProfileDto` y compañía) y el modelo
 * de UI (`Profile`) — CLAUDE.md §8: todo lo que el backend pueda cambiar se
 * detiene aquí, nunca llega directo a un componente.
 *
 * CM-61 agrega la dirección inversa (UI → contrato): `toAddEducationRequest`
 * y `toAddWorkExperienceRequest` traducen los valores del formulario al
 * body real que exige el backend — es aquí, y no en los organismos, donde
 * vive la derivación de `employmentStatus` a partir de los dos checkboxes
 * (`isCurrent`/`unknownEnd`): los organismos no conocen el contrato, solo
 * edición de UI (SPEC.md §9, decisión D-F). Desde CM-273 (PR 1, D-K) el
 * mapper ya no convierte fechas: el esquema de Zod entrega «AAAA-MM».
 *
 * CM-65 agrega Habilidades: `toAddSkillRequest` solo recorta y fija la
 * procedencia, sin derivar nada — no hay catálogo que traducir. CM-69
 * agrega Roles Objetivo: `TargetRolesSection` ya trabaja con
 * `professionalRoleId` (el catálogo es cerrado, sin texto libre), así que
 * `toAddTargetRoleRequest`/`toUpdateTargetRoleRequest` solo añaden la
 * procedencia (`MANUAL_PROVENANCE`), sin derivar nada.
 */
import type {
  DataProvenance,
  EducationItem,
  EducationLevel,
  EmploymentStatus,
  ProfessionalRole,
  Profile,
  SkillItem,
  SkillLevel,
  TargetRoleItem,
  WorkExperienceItem,
} from '../model/profile.types';
import type { EducationFormValues } from '../schemas/education.schema';
import type { SkillFormValues } from '../schemas/skill.schema';
import type { WorkExperienceFormValues } from '../schemas/workExperience.schema';
import type {
  AddEducationRequestDto,
  AddSkillRequestDto,
  AddTargetRoleRequestDto,
  AddWorkExperienceRequestDto,
  EducationDto,
  ProfessionalRoleDto,
  ProfileDto,
  SkillDto,
  TargetRoleDto,
  UpdateTargetRoleRequestDto,
  WorkExperienceDto,
} from './profile.dto';

function toEducationItem(dto: EducationDto): EducationItem {
  return {
    id: dto.id,
    institution: dto.institution,
    degree: dto.degree,
    level: dto.level as EducationLevel,
    startDate: dto.startDate,
    endDate: dto.endDate,
    inProgress: dto.inProgress,
    provenance: dto.provenance as DataProvenance,
  };
}

function toWorkExperienceItem(dto: WorkExperienceDto): WorkExperienceItem {
  return {
    id: dto.id,
    company: dto.company,
    position: dto.position,
    description: dto.description,
    startDate: dto.startDate,
    endDate: dto.endDate,
    employmentStatus: dto.employmentStatus as EmploymentStatus,
    provenance: dto.provenance as DataProvenance,
  };
}

function toSkillItem(dto: SkillDto): SkillItem {
  return {
    id: dto.id,
    skillName: dto.skillName,
    level: dto.level as SkillLevel,
    provenance: dto.provenance as DataProvenance,
  };
}

function toTargetRoleItem(dto: TargetRoleDto): TargetRoleItem {
  return {
    id: dto.id,
    professionalRoleId: dto.professionalRoleId,
    provenance: dto.provenance as DataProvenance,
  };
}

export function toProfessionalRole(dto: ProfessionalRoleDto): ProfessionalRole {
  return { id: dto.id, name: dto.nombre, category: dto.categoria };
}

/**
 * `dto.name`/`dto.summary` llegan `null` en un perfil recién creado (backend
 * real, confirmado por HAR) — se normalizan a `''` aquí, la única vez que
 * ese `null` existe (CM-195). `dto.summaryProvenance` no existe en el record
 * real todavía (ver TSDoc de `ProfileDto`); `?? null` cubre tanto el `null`
 * explícito como el campo ausente (`undefined`) con el mismo valor de
 * dominio, sin distinguir los dos — el dominio no necesita esa distinción.
 */
export function toProfile(dto: ProfileDto): Profile {
  return {
    id: dto.id,
    status: dto.status,
    name: dto.name ?? '',
    summary: dto.summary ?? '',
    summaryProvenance: dto.summaryProvenance ?? null,
    education: dto.educations.map(toEducationItem),
    workExperience: dto.workExperiences.map(toWorkExperienceItem),
    skills: dto.profileSkills.map(toSkillItem),
    targetRoles: dto.targetRoles.map(toTargetRoleItem),
  };
}

/**
 * `endDate` viaja `null` tanto si la formación sigue en curso como si el
 * campo se dejó vacío — el backend real (`Education.java`) trata ambos
 * casos igual: solo prohíbe `endDate` cuando `inProgress` es `true`.
 */
export function toAddEducationRequest(values: EducationFormValues): AddEducationRequestDto {
  return {
    institution: values.institution.trim(),
    degree: values.degree.trim(),
    level: values.level,
    startDate: values.startDate,
    endDate: !values.inProgress && values.endDate.length > 0 ? values.endDate : null,
    inProgress: values.inProgress,
  };
}

/**
 * Deriva `employmentStatus` de los dos checkboxes reales del frame: ninguno
 * marcado es `ENDED` (con `endDate`), "Trabajo aquí actualmente" es
 * `CURRENT`, "No recuerdo la fecha exacta de finalización" es
 * `UNKNOWN_END` — ambos sin `endDate` (regla de dominio real,
 * `WorkExperience.java`).
 */
export function toAddWorkExperienceRequest(
  values: WorkExperienceFormValues,
): AddWorkExperienceRequestDto {
  const employmentStatus: EmploymentStatus = values.isCurrent
    ? 'CURRENT'
    : values.unknownEnd
      ? 'UNKNOWN_END'
      : 'ENDED';
  const trimmedDescription = values.description.trim();

  return {
    company: values.company.trim(),
    position: values.position.trim(),
    description: trimmedDescription.length > 0 ? trimmedDescription : null,
    startDate: values.startDate.length > 0 ? values.startDate : null,
    endDate: employmentStatus === 'ENDED' ? values.endDate : null,
    employmentStatus,
  };
}

export function toAddSkillRequest(values: SkillFormValues): AddSkillRequestDto {
  return {
    skillName: values.skillName.trim(),
    level: values.level,
  };
}

export function toAddTargetRoleRequest(professionalRoleId: string): AddTargetRoleRequestDto {
  return { professionalRoleId };
}

export function toUpdateTargetRoleRequest(professionalRoleId: string): UpdateTargetRoleRequestDto {
  return { professionalRoleId };
}
