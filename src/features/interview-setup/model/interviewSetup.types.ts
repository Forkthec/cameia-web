/**
 * Tipos de dominio del asistente de configuracion de entrevista (HU-4.2).
 * Los datos de este wizard no se persisten aqui: viajan al crear la sesion
 * en HU-4.4. Los tipos de `Profile` y `ProfessionalRole` se reutilizan
 * desde `professional-profile/model` — estos son los tipos propios del
 * flujo de configuracion.
 */
export interface ProfileSummaryItem {
  id: string;
  name: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  targetRoles: ProfileTargetRoleSummary[];
}

export interface ProfileTargetRoleSummary {
  professionalRoleId: string;
  roleTitle: string;
}

export interface InterviewSetupData {
  profileId: string | null;
  jobOffer: string | null;
  targetRoleId: string | null;
}

export interface RoleCatalogGroup {
  label: string;
  roles: { id: string; name: string }[];
}
