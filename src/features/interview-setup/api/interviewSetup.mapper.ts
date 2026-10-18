/**
 * Mapper DTO → modelo de dominio para el wizard de entrevista.
 * Es el cortafuegos (ADR-0003, CLAUDE.md §8): todo lo que el backend
 * pueda cambiar se detiene aqui.
 */
import type { ProfileSummaryItem } from '../model/interviewSetup.types';
import type { ProfileSummaryDto, ProfessionalRoleCatalogDto } from './interviewSetup.dto';

export function toProfileSummary(dto: ProfileSummaryDto): ProfileSummaryItem {
  return {
    id: dto.id,
    name: dto.name ?? '',
    status: dto.status as ProfileSummaryItem['status'],
    targetRoles: dto.targetRoles.map((r) => ({
      professionalRoleId: r.professionalRoleId,
      roleTitle: r.roleTitle,
    })),
  };
}

export interface ProfessionalRoleMapped {
  id: string;
  name: string;
  category: string;
}

export function toProfessionalRoleCatalog(dto: ProfessionalRoleCatalogDto): ProfessionalRoleMapped {
  return {
    id: dto.id,
    name: dto.nombre,
    category: dto.categoria,
  };
}
