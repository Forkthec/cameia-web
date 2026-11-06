/**
 * Paso 1 del wizard: Oferta Laboral y Rol Objetivo (PRT-04.03).
 * La Oferta Laboral es un textarea opcional con contador de caracteres
 * en tiempo real (CA-4.2.4). El Rol Objetivo es un autocomplete
 * single-select sobre el catalogo de roles activos, con los roles del
 * perfil sugeridos primero (CA-4.2.20).
 *
 * **Presentación «Amanecer» y Atomic Design (CM-208).** Solo diseño: el
 * contador es la molécula `CharacterCounter`, las etiquetas son el átomo
 * `Label` y los esqueletos de carga el átomo `Skeleton`.
 *
 * CA-4.2.13: soltar un archivo sobre la oferta no lo adjunta ni lo abre el
 * navegador (se cancela el `drop` de archivos); el texto se conserva y la
 * pantalla no ofrece ningún control de carga. Arrastrar texto sigue igual.
 */
import { useMemo, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/design-system/atoms/Input';
import { Label } from '@/design-system/atoms/Label';
import { Skeleton } from '@/design-system/atoms/Skeleton';
import {
  Autocomplete,
  type AutocompleteOption,
  type AutocompleteGroup,
} from '@/design-system/molecules/Autocomplete';
import { CharacterCounter } from '@/design-system/molecules/CharacterCounter';
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

/** Cancela el arrastre de archivos (no de texto) sobre la oferta (CA-4.2.13). */
function rejectFileDrop(event: DragEvent<HTMLDivElement>) {
  if (event.dataTransfer.types.includes('Files')) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
  }
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
      <div className="gap-space-4 flex flex-col" aria-busy="true">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
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
      <div
        className="gap-space-2 flex flex-col"
        onDragOverCapture={rejectFileDrop}
        onDropCapture={rejectFileDrop}
      >
        <Label htmlFor="job-offer" className="text-body">
          {t('interview:oferta.etiqueta')}
        </Label>
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
        <div aria-live="polite" className="flex justify-end">
          <CharacterCounter
            count={charCount}
            max={JOB_OFFER_MAX_LENGTH}
            formatLabel={(actual, max) => t('interview:oferta.contador', { actual, max })}
          />
        </div>
      </div>

      <div className="gap-space-2 flex flex-col">
        <p className="text-body text-text-primary font-semibold">{t('interview:rol.etiqueta')}</p>
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
