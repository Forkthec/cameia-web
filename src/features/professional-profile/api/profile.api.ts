/**
 * Funciones de red del Formulario de Perfil Profesional. La sección
 * Información General (CM-53) nunca envía `summaryProvenance`: lo deriva el
 * backend/mock a partir del valor anterior (SPEC.md §5). Las de CM-61
 * (Educación, Experiencia Laboral), CM-65 (Habilidades) y CM-69 (Roles
 * Objetivo) son gestión por ítem — `POST` para agregar, `DELETE` para
 * eliminar, nunca un `PATCH` de colección (SPEC.md §9, decisión D-A/D-C) —
 * y devuelven el perfil completo, igual que el `PATCH`: no hay un endpoint
 * que devuelva solo el ítem creado. Roles Objetivo además admite `PATCH`
 * por ítem para sustituir el catálogo referenciado sin perder el id del
 * Rol Objetivo (memo del PO del 13-sep, C-05).
 *
 * `finalizeProfile` (CM-65) llama a `POST /api/v1/profiles/:id/completion`
 * — no `.../finalize`, que es el nombre que el mock simulaba desde CM-61
 * antes de conocer el código real de `ProfileController.java#completeProfile`
 * (`SPEC.md` §5). Cuando el perfil no cumple los 5 requisitos, el backend
 * real responde 422 con "la lista de requisitos faltantes" — este mock la
 * transporta en `ApiError.details` (un `ApiErrorDetail` por requisito
 * incumplido, mismo mecanismo que ya usa `PROFILE_NAME_INVALID`), no en un
 * campo `missingRequirements` aparte: `errorMap.ts` ya sabe leer `details`,
 * y así no hace falta un DTO de error especial solo para este endpoint.
 *
 * `fetchProfessionalRoles` (CM-69) es el único endpoint de esta feature que
 * no pertenece al perfil sino a un catálogo compartido (`GET
 * /api/v1/professional-roles`, `ProfessionalRoleController.java`, CM-23):
 * no devuelve `ProfileDto` ni pasa por `toProfile`.
 */
import { httpClient } from '@/services/http/httpClient';
import {
  toAddEducationRequest,
  toAddSkillRequest,
  toAddTargetRoleRequest,
  toAddWorkExperienceRequest,
  toProfessionalRole,
  toProfile,
  toUpdateTargetRoleRequest,
} from './profile.mapper';
import type { ProfessionalRoleDto, ProfileDto } from './profile.dto';
import type { ProfessionalRole, Profile } from '../model/profile.types';
import type { GeneralInfoFormValues } from '../schemas/generalInfo.schema';
import type { EducationFormValues } from '../schemas/education.schema';
import type { SkillFormValues } from '../schemas/skill.schema';
import type { WorkExperienceFormValues } from '../schemas/workExperience.schema';

export async function fetchProfile(id: string): Promise<Profile> {
  const dto = await httpClient.get<ProfileDto>(`/api/v1/profiles/${id}`);
  return toProfile(dto);
}

export async function updateGeneralInfo(
  id: string,
  values: GeneralInfoFormValues,
): Promise<Profile> {
  const dto = await httpClient.patch<ProfileDto>(`/api/v1/profiles/${id}`, values);
  return toProfile(dto);
}

export async function addEducation(id: string, values: EducationFormValues): Promise<Profile> {
  const dto = await httpClient.post<ProfileDto>(
    `/api/v1/profiles/${id}/educations`,
    toAddEducationRequest(values),
  );
  return toProfile(dto);
}

export async function removeEducation(id: string, educationId: string): Promise<Profile> {
  const dto = await httpClient.del<ProfileDto>(`/api/v1/profiles/${id}/educations/${educationId}`);
  return toProfile(dto);
}

export async function addWorkExperience(
  id: string,
  values: WorkExperienceFormValues,
): Promise<Profile> {
  const dto = await httpClient.post<ProfileDto>(
    `/api/v1/profiles/${id}/work-experiences`,
    toAddWorkExperienceRequest(values),
  );
  return toProfile(dto);
}

export async function removeWorkExperience(id: string, workExperienceId: string): Promise<Profile> {
  const dto = await httpClient.del<ProfileDto>(
    `/api/v1/profiles/${id}/work-experiences/${workExperienceId}`,
  );
  return toProfile(dto);
}

export async function addSkill(id: string, values: SkillFormValues): Promise<Profile> {
  const dto = await httpClient.post<ProfileDto>(
    `/api/v1/profiles/${id}/skills`,
    toAddSkillRequest(values),
  );
  return toProfile(dto);
}

export async function removeSkill(id: string, skillId: string): Promise<Profile> {
  const dto = await httpClient.del<ProfileDto>(`/api/v1/profiles/${id}/skills/${skillId}`);
  return toProfile(dto);
}

export async function finalizeProfile(id: string): Promise<Profile> {
  const dto = await httpClient.post<ProfileDto>(`/api/v1/profiles/${id}/completion`);
  return toProfile(dto);
}

export async function addTargetRole(id: string, professionalRoleId: string): Promise<Profile> {
  const dto = await httpClient.post<ProfileDto>(
    `/api/v1/profiles/${id}/target-roles`,
    toAddTargetRoleRequest(professionalRoleId),
  );
  return toProfile(dto);
}

export async function substituteTargetRole(
  id: string,
  roleId: string,
  professionalRoleId: string,
): Promise<Profile> {
  const dto = await httpClient.patch<ProfileDto>(
    `/api/v1/profiles/${id}/target-roles/${roleId}`,
    toUpdateTargetRoleRequest(professionalRoleId),
  );
  return toProfile(dto);
}

export async function removeTargetRole(id: string, roleId: string): Promise<Profile> {
  const dto = await httpClient.del<ProfileDto>(`/api/v1/profiles/${id}/target-roles/${roleId}`);
  return toProfile(dto);
}

export async function fetchProfessionalRoles(): Promise<ProfessionalRole[]> {
  const dtos = await httpClient.get<ProfessionalRoleDto[]>('/api/v1/professional-roles');
  return dtos.map(toProfessionalRole);
}
