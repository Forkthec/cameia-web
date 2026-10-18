// PROVISIONAL — pendiente de OpenAPI
/**
 * DTOs de la lista de perfiles para el wizard de entrevista (HU-4.2).
 * `GET /api/v1/profiles` todavia no existe en cameia-perfil (bloqueo B-1);
 * esta forma se deduce de las notas tecnicas del backlog v8.2 (CA-4.2.18).
 */
export interface ProfileSummaryDto {
  id: string;
  name: string;
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
