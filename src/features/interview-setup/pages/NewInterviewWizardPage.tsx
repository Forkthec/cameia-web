/**
 * Pagina del asistente de configuracion de entrevista (HU-4.2, HU-4.3, HU-4.4).
 * Orquesta los 3 pasos del wizard usando WizardLayout y el store de Zustand.
 * Los pasos 2 y 3 (HU-4.3) quedan como placeholder hasta CM-205.
 *
 * Protege la regla CA-4.2: los datos no se persisten aqui, viajan al crear
 * la sesion en HU-4.4.
 */
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { WizardLayout } from '@/layouts/WizardLayout';
import { useInterviewSetupStore } from '../store/interviewSetup.store';
import { useProfileList } from '../hooks/useProfileList';
import { useRoleCatalog } from '../hooks/useRoleCatalog';
import { ProfileSelector } from '../organisms/ProfileSelector';
import { OfferAndRoleForm } from '../organisms/OfferAndRoleForm';
import { JOB_OFFER_MAX_LENGTH } from '../model/interviewSetup.constants';
import type { StepStatus } from '@/design-system/molecules/Stepper';

function stepStatus(index: number, current: number): StepStatus {
  if (index < current) return 'complete';
  if (index === current) return 'current';
  return 'upcoming';
}

export function NewInterviewWizardPage() {
  const { t } = useTranslation(['interview', 'common']);
  const store = useInterviewSetupStore();

  const profileQuery = useProfileList();
  const roleQuery = useRoleCatalog();

  const profiles = useMemo(() => profileQuery.data ?? [], [profileQuery.data]);
  const activeProfiles = useMemo(
    () => profiles.filter((p) => p.status === 'COMPLETED'),
    [profiles],
  );
  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === store.profileId) ?? null,
    [profiles, store.profileId],
  );

  const hasEmptyState =
    !profileQuery.isLoading &&
    !profileQuery.isError &&
    (profiles.length === 0 || activeProfiles.length === 0);

  const jobOfferError = useMemo(() => {
    if (store.jobOffer && store.jobOffer.length > JOB_OFFER_MAX_LENGTH) {
      return t('interview:validacion.ofertaMaxCaracteres');
    }
    return null;
  }, [store.jobOffer, t]);

  const roleError = useMemo(() => {
    return null;
  }, []);

  const canAdvanceStep0 = !!store.profileId;
  const canAdvanceStep1 = !jobOfferError && !!store.targetRoleId;

  const handleNext = useCallback(() => {
    if (store.currentStep === 0 && canAdvanceStep0) {
      store.nextStep();
    } else if (store.currentStep === 1 && canAdvanceStep1) {
      store.nextStep();
    }
  }, [store, canAdvanceStep0, canAdvanceStep1]);

  const handleBack = useCallback(() => {
    store.prevStep();
  }, [store]);

  const handleNextWithValidation = useCallback(() => {
    if (store.currentStep === 1 && !store.targetRoleId) {
      return;
    }
    handleNext();
  }, [store.currentStep, store.targetRoleId, handleNext]);

  const isPrimaryDisabled =
    (store.currentStep === 0 && (!canAdvanceStep0 || hasEmptyState)) ||
    (store.currentStep === 1 && !canAdvanceStep1) ||
    store.currentStep >= 2;

  const steps = [
    {
      label: t('interview:asistente.pasos.perfilProfesional'),
      status: stepStatus(0, store.currentStep),
    },
    { label: t('interview:asistente.pasos.ofertaYRol'), status: stepStatus(1, store.currentStep) },
    { label: t('interview:asistente.pasos.modoYTono'), status: stepStatus(2, store.currentStep) },
  ];

  return (
    <WizardLayout
      steps={steps}
      stepsLabel={t('interview:asistente.progreso')}
      primaryActionLabel={t('common:acciones.continuar')}
      onPrimaryAction={handleNextWithValidation}
      primaryActionDisabled={isPrimaryDisabled}
      backLabel={t('common:acciones.atras')}
      onBack={store.currentStep > 0 ? handleBack : undefined}
    >
      {store.currentStep === 0 ? (
        <ProfileSelector
          profiles={profiles}
          selectedProfileId={store.profileId}
          onSelectProfile={store.setProfile}
          isLoading={profileQuery.isLoading}
          isError={profileQuery.isError}
          onRetry={() => void profileQuery.refetch()}
        />
      ) : store.currentStep === 1 ? (
        <OfferAndRoleForm
          selectedProfile={selectedProfile}
          roles={roleQuery.data ?? []}
          isLoadingRoles={roleQuery.isLoading}
          isErrorRoles={roleQuery.isError}
          onRetryRoles={() => void roleQuery.refetch()}
          jobOffer={store.jobOffer ?? ''}
          onJobOfferChange={store.setJobOffer}
          selectedRoleId={store.targetRoleId}
          onRoleSelect={store.setTargetRole}
          jobOfferError={jobOfferError}
          roleError={roleError}
        />
      ) : (
        <EmptyState
          title={t('common:pendiente.titulo', { ticket: 'CM-205' })}
          description={t('common:pendiente.descripcion', { prt: 'PRT-04.07, 04.09' })}
        />
      )}
    </WizardLayout>
  );
}
