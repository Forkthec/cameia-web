/**
 * Funciones de red del Formulario de Perfil Profesional. La sección
 * Información General (CM-53) nunca envía `summaryProvenance`: lo deriva el
 * backend/mock a partir del valor anterior (SPEC.md §5). Las de CM-61
 * (Educación, Experiencia Laboral) y CM-65 (Habilidades) son gestión por
 * ítem — `POST` para agregar, `DELETE` para eliminar, nunca un `PATCH` de
 * colección (SPEC.md §9, decisión D-A/D-C) — y devuelven el perfil
 * completo, igual que el `PATCH`: no hay un endpoint que devuelva solo el
 * ítem creado.
 *
 * `finalizeProfile` (CM-65) llama a `POST /api/v1/profiles/:id/completion`
 * — no `.../finalize`, que es el nombre que el mock simulaba desde CM-61
 * antes de conocer el código real de `ProfileController.java#completeProfile`
 * (`SPEC.md` §5). Cuando el perfil no cumple los 5
 * requisitos, el backend real responde 422 con "la lista de requisitos
 * faltantes" — este mock la transporta en `ApiError.details` (un
 * `ApiErrorDetail` por requisito incumplido, mismo mecanismo que ya usa
 * `PROFILE_NAME_INVALID`), no en un campo `missingRequirements` aparte:
 * `errorMap.ts` ya sabe leer `details`, y así no hace falta un DTO de error
 * especial solo para este endpoint.
 */
import { httpClient } from '@/services/http/httpClient';
import {
  toAddEducationRequest,
  toAddSkillRequest,
  toAddWorkExperienceRequest,
  toProfile,
} from './profile.mapper';
import type { ProfileDto } from './profile.dto';
import type { Profile } from '../model/profile.types';
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
