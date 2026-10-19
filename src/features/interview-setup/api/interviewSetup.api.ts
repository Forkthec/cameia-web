/**
 * Funciones de red del wizard de entrevista (HU-4.2).
 * `fetchProfileList` consume `GET /api/v1/profiles` (sin filtro de estado;
 * la pantalla filtra por COMPLETED, CA-4.2.18). `fetchRoleCatalog` consume
 * el catalogo compartido de roles profesionales. Ambos mappers viven en
 * esta feature para no importar de otra (CLAUDE.md §3.4).
 */
import { httpClient } from '@/services/http/httpClient';
import type { ProfileSummaryItem } from '../model/interviewSetup.types';
import type { ProfileListResponseDto, ProfessionalRoleCatalogDto } from './interviewSetup.dto';
import {
  toProfileSummary,
  toProfessionalRoleCatalog,
  type ProfessionalRoleMapped,
} from './interviewSetup.mapper';

export async function fetchProfileList(): Promise<ProfileSummaryItem[]> {
  const dto = await httpClient.get<ProfileListResponseDto>('/api/v1/profiles');
  return dto.profiles.map(toProfileSummary);
}

export async function fetchRoleCatalog(lang: string): Promise<ProfessionalRoleMapped[]> {
  const dtos = await httpClient.get<ProfessionalRoleCatalogDto[]>(
    `/api/v1/profiles/professional-roles?lang=${lang}`,
  );
  return dtos.map(toProfessionalRoleCatalog);
}
