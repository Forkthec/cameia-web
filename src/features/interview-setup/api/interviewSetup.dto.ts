/**
 * DTOs de la lista de perfiles para el wizard de entrevista (HU-4.2).
 * `GET /api/v1/profiles` desplegado en cameia-perfil (19-oct-2026).
 * Contrato verificado contra el aviso de Backend del 19-oct-2026.
 */
export interface ProfileSummaryDto {
  id: string;
  name: string | null;
  status: string;
  targetRoles: ProfileTargetRoleDto[];
}

export interface ProfileTargetRoleDto {
  professionalRoleId: string;
  roleTitle: string;
}

export interface ProfileListResponseDto {
  profiles: ProfileSummaryDto[];
}

export interface ProfessionalRoleCatalogDto {
  id: string;
  nombre: string;
  categoria: string;
}

/** Opción del catálogo de personalización (contrato de Backend del 20-10-2026, §6.2). */
export interface CatalogOptionDto {
  value: string;
  available: boolean;
}

/** Respuesta 200 de `GET /api/v1/interviews/config/catalog` (CM-204, PR 36 de cameia-entrevista). */
export interface InterviewCatalogDto {
  modes: CatalogOptionDto[];
  tones: CatalogOptionDto[];
  answerFormats: CatalogOptionDto[];
  languages: CatalogOptionDto[];
}
