/**
 * Funciones de red del Formulario de Perfil Profesional. La sección
 * Información General (CM-53) nunca envía `summaryProvenance`: lo deriva el
 * backend/mock a partir del valor anterior (SPEC.md §5). Las de CM-61
 * (Educación, Experiencia Laboral) y CM-69 (Roles Objetivo) son gestión por
 * ítem — `POST` para agregar, `DELETE` para eliminar, nunca un `PATCH` de
 * colección (SPEC.md §9, decisión D-A/D-C) — y devuelven el perfil
 * completo, igual que el `PATCH`: no hay un endpoint que devuelva solo el
 * ítem creado. Roles Objetivo además admite `PATCH` por ítem para sustituir
 * el catálogo referenciado sin perder el id del Rol Objetivo (memo del PO
 * del 13-sep, C-05).
 *
 * `fetchProfessionalRoles` es el único endpoint de esta feature que no
 * pertenece al perfil sino a un catálogo compartido (`GET
 * /api/v1/professional-roles`, `ProfessionalRoleController.java`, CM-23):
 * no devuelve `ProfileDto` ni pasa por `toProfile`.
 */
import { httpClient } from '@/services/http/httpClient';
import {
  toAddEducationRequest,
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
