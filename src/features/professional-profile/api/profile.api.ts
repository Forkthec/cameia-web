/**
 * Funciones de red del paso de Información General (CM-53). Nunca envían
 * `summaryProvenance`: lo deriva el backend/mock a partir del valor
 * anterior (SPEC.md §5) — el cliente solo manda `name` y `summary`.
 */
import { httpClient } from '@/services/http/httpClient';
import { toProfile } from './profile.mapper';
import type { ProfileDto } from './profile.dto';
import type { Profile } from '../model/profile.types';
import type { GeneralInfoFormValues } from '../schemas/generalInfo.schema';

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
