/**
 * Funciones de red del Formulario de Perfil Profesional. La sección
 * Información General (CM-53) nunca envía `summaryProvenance`: lo deriva el
 * backend/mock a partir del valor anterior (SPEC.md §5). Las de CM-61
 * (Educación, Experiencia Laboral) son gestión por ítem — `POST` para
 * agregar, `DELETE` para eliminar, nunca un `PATCH` de colección (SPEC.md
 * §9, decisión D-A/D-C) — y devuelven el perfil completo, igual que el
 * `PATCH`: no hay un endpoint que devuelva solo el ítem creado.
 */
import { httpClient } from '@/services/http/httpClient';
import { toAddEducationRequest, toAddWorkExperienceRequest, toProfile } from './profile.mapper';
import type { ProfileDto } from './profile.dto';
import type { Profile } from '../model/profile.types';
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
