/**
 * Paso 0 del wizard: seleccion del Perfil Profesional (PRT-04.02).
 * Muestra solo perfiles COMPLETED como CardSelectable. Maneja tres
 * estados vacios: sin perfiles (CA-4.2.3), solo borradores (CA-4.2.6)
 * y un unico perfil activo preseleccionado (CA-4.2.2).
 */
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { CardSelectable } from '@/design-system/molecules/CardSelectable';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import type { ProfileSummaryItem } from '../../model/interviewSetup.types';

interface ProfileSelectorProps {
  profiles: ProfileSummaryItem[];
  selectedProfileId: string | null;
  onSelectProfile: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ProfileSelector({
  profiles,
  selectedProfileId,
  onSelectProfile,
  isLoading,
  isError,
  onRetry,
}: ProfileSelectorProps) {
  const { t } = useTranslation(['interview', 'common']);
  const navigate = useNavigate();

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
      <div className="gap-space-3 flex flex-col">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-bg-surface-sunken h-20 animate-pulse rounded-lg"
            role="presentation"
          />
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
        const rolesText = profile.targetRoles.map((r) => r.roleTitle).join(', ');
        return (
          <CardSelectable
            key={profile.id}
            state={selectedProfileId === profile.id ? 'selected' : 'default'}
            onClick={() => onSelectProfile(profile.id)}
            title={profile.name}
            description={rolesText || undefined}
          />
        );
      })}
    </div>
  );
}
