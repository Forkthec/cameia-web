/**
 * Paso 0 del wizard: seleccion del Perfil Profesional (PRT-04.02).
 * Muestra solo perfiles COMPLETED como CardSelectable. Maneja tres
 * estados vacios: sin perfiles (CA-4.2.3), solo borradores (CA-4.2.6)
 * y un unico perfil activo preseleccionado (CA-4.2.2).
 */
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Skeleton } from '@/design-system/atoms/Skeleton';
import { Icon } from '@/design-system/icons/Icon';
import { CardSelectable } from '@/design-system/molecules/CardSelectable';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import type { ProfileSummaryItem } from '../../model/interviewSetup.types';
import type { ProfessionalRoleMapped } from '../../api/interviewSetup.mapper';

interface ProfileSelectorProps {
  profiles: ProfileSummaryItem[];
  /** Catálogo de roles en el idioma activo; nombra los roles de cada perfil. */
  roles: ProfessionalRoleMapped[];
  selectedProfileId: string | null;
  onSelectProfile: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ProfileSelector({
  profiles,
  roles,
  selectedProfileId,
  onSelectProfile,
  isLoading,
  isError,
  onRetry,
}: ProfileSelectorProps) {
  const { t } = useTranslation(['interview', 'common']);
  const navigate = useNavigate();

  const roleNames = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);

  const activeProfiles = useMemo(
    () => profiles.filter((p) => p.status === 'COMPLETED'),
    [profiles],
  );

  const hasAnyProfile = profiles.length > 0;
  const hasOnlyDrafts = hasAnyProfile && activeProfiles.length === 0;

  useEffect(() => {
    if (activeProfiles.length === 1 && !selectedProfileId && activeProfiles[0]) {
      onSelectProfile(activeProfiles[0].id);
    }
  }, [activeProfiles, selectedProfileId, onSelectProfile]);

  if (isLoading) {
    return (
      <div className="gap-space-3 flex flex-col" aria-busy="true">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-[4.5rem] rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title={t('common:error.titulo')}
        description={t('common:error.descripcion')}
        actionLabel={t('common:acciones.reintentar')}
        onAction={onRetry}
      />
    );
  }

  if (!hasAnyProfile) {
    return (
      <EmptyState
        title={t('interview:perfil.sinPerfiles.titulo')}
        description={t('interview:perfil.sinPerfiles.descripcion')}
        actionLabel={t('interview:perfil.sinPerfiles.accion')}
        onAction={() => void navigate('/perfiles/nuevo')}
      />
    );
  }

  if (hasOnlyDrafts) {
    const latestDraft = profiles[profiles.length - 1]!;
    return (
      <EmptyState
        title={t('interview:perfil.soloBorradores.titulo')}
        description={t('interview:perfil.soloBorradores.descripcion')}
        actionLabel={t('interview:perfil.soloBorradores.accion')}
        onAction={() => void navigate(`/perfiles/${latestDraft.id}/editar`)}
      />
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('interview:perfil.grupo')}
      className="gap-space-3 flex flex-col"
    >
      {activeProfiles.map((profile) => {
        // El nombre sale del catálogo en el idioma activo; `roleTitle` de la
        // lista viene en español y queda solo como respaldo.
        const rolesText = profile.targetRoles
          .map((r) => roleNames.get(r.professionalRoleId) ?? r.roleTitle)
          .join(', ');
        return (
          <CardSelectable
            key={profile.id}
            state={selectedProfileId === profile.id ? 'selected' : 'default'}
            onClick={() => onSelectProfile(profile.id)}
            title={profile.name}
            icon={<Icon name="document" />}
            description={rolesText || undefined}
          />
        );
      })}
    </div>
  );
}
