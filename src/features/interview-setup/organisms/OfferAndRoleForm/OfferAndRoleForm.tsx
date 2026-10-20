/**
 * Paso 1 del wizard: Oferta Laboral y Rol Objetivo (PRT-04.03).
 * La Oferta Laboral es un textarea opcional con contador de caracteres
 * en tiempo real (CA-4.2.4). El Rol Objetivo es un autocomplete
 * single-select sobre el catalogo de roles activos, con los roles del
 * perfil sugeridos primero (CA-4.2.20).
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/design-system/atoms/Input';
import {
  Autocomplete,
  type AutocompleteOption,
  type AutocompleteGroup,
} from '@/design-system/molecules/Autocomplete';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { JOB_OFFER_MAX_LENGTH } from '../../model/interviewSetup.constants';
import type { ProfileSummaryItem } from '../../model/interviewSetup.types';
import type { ProfessionalRoleMapped } from '../../api/interviewSetup.mapper';

interface OfferAndRoleFormProps {
  selectedProfile: ProfileSummaryItem | null;
  roles: ProfessionalRoleMapped[];
  isLoadingRoles: boolean;
  isErrorRoles: boolean;
  onRetryRoles: () => void;
  jobOffer: string;
  onJobOfferChange: (value: string) => void;
  selectedRoleId: string | null;
  onRoleSelect: (roleId: string | null) => void;
  jobOfferError: string | null;
  roleError: string | null;
}

export function OfferAndRoleForm({
  selectedProfile,
  roles,
  isLoadingRoles,
  isErrorRoles,
  onRetryRoles,
  jobOffer,
  onJobOfferChange,
  selectedRoleId,
  onRoleSelect,
  jobOfferError,
  roleError,
}: OfferAndRoleFormProps) {
  const { t } = useTranslation(['interview', 'common']);

  const charCount = jobOffer.length;
  const isOverLimit = charCount > JOB_OFFER_MAX_LENGTH;

  const roleOptions: AutocompleteOption[] = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.name })),
    [roles],
  );

  const roleGroups: AutocompleteGroup[] = useMemo(() => {
    if (!selectedProfile) return [];

    const profileRoleIds = new Set(selectedProfile.targetRoles.map((r) => r.professionalRoleId));

    const profileRoles = roles.filter((r) => profileRoleIds.has(r.id));
    const otherRoles = roles.filter((r) => !profileRoleIds.has(r.id));

    if (profileRoles.length === 0) return [];

    const groups: AutocompleteGroup[] = [
      {
        label: t('interview:rol.deTuPerfil'),
        options: profileRoles.map((r) => ({ value: r.id, label: r.name })),
      },
    ];

    if (otherRoles.length > 0) {
      groups.push({
        label: t('interview:rol.otrosRoles'),
        options: otherRoles.map((r) => ({ value: r.id, label: r.name })),
      });
    }

    return groups;
  }, [selectedProfile, roles, t]);

  const selectedRole = useMemo(
    () => (selectedRoleId ? (roleOptions.find((o) => o.value === selectedRoleId) ?? null) : null),
    [selectedRoleId, roleOptions],
  );

  if (isLoadingRoles) {
    return (
      <div className="gap-space-4 flex flex-col">
        <div className="bg-bg-surface-sunken h-32 animate-pulse rounded-lg" role="presentation" />
        <div className="bg-bg-surface-sunken h-12 animate-pulse rounded-lg" role="presentation" />
      </div>
    );
  }

  if (isErrorRoles) {
    return (
      <EmptyState
        title={t('common:error.titulo')}
        description={t('common:error.descripcion')}
        actionLabel={t('common:acciones.reintentar')}
        onAction={onRetryRoles}
      />
    );
  }

  return (
    <div className="gap-space-6 flex flex-col">
      <div className="gap-space-2 flex flex-col">
        <label htmlFor="job-offer" className="text-body text-text-primary font-semibold">
          {t('interview:oferta.etiqueta')}
        </label>
        <Input
          id="job-offer"
          type="textarea"
          rows={6}
          value={jobOffer}
          onChange={(e) => onJobOfferChange(e.target.value)}
          placeholder={t('interview:oferta.placeholder')}
          maxLength={JOB_OFFER_MAX_LENGTH + 1}
          state={jobOfferError || isOverLimit ? 'error' : 'default'}
          errorMessage={jobOfferError ?? undefined}
        />
        <span
          className={`text-small text-right ${isOverLimit ? 'text-danger-base' : 'text-text-muted'}`}
          aria-live="polite"
        >
          {t('interview:oferta.contador', { actual: charCount, max: JOB_OFFER_MAX_LENGTH })}
        </span>
      </div>

      <div className="gap-space-2 flex flex-col">
        <label className="text-body text-text-primary font-semibold">
          {t('interview:rol.etiqueta')}
        </label>
        <Autocomplete
          label={t('interview:rol.etiqueta')}
          options={roleOptions}
          groups={roleGroups.length > 0 ? roleGroups : undefined}
          selected={selectedRole}
          onSelect={(option) => onRoleSelect(option?.value ?? null)}
          placeholder={t('interview:rol.placeholder')}
          noResultsLabel={t('interview:rol.sinResultados')}
          errorMessage={roleError ?? undefined}
        />
      </div>
    </div>
  );
}
