/**
 * Pagina del asistente de configuracion de entrevista (HU-4.2, HU-4.3, HU-4.4).
 * Orquesta los 4 pasos del wizard usando WizardLayout y el store de Zustand.
 * Paso 0: seleccion de perfil (HU-4.2). Paso 1: oferta y rol (HU-4.2).
 * Paso 2: modo y tono (HU-4.3). Paso 3: idioma y forma de respuesta (HU-4.3).
 * El paso de confirmacion (HU-4.4, CM-208) queda como placeholder.
 *
 * Protege la regla CA-4.2: los datos no se persisten aqui, viajan al crear
 * la sesion en HU-4.4.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { WizardLayout } from '@/layouts/WizardLayout';
import { useInterviewSetupStore } from '../store/interviewSetup.store';
import { useProfileList } from '../hooks/useProfileList';
import { useRoleCatalog } from '../hooks/useRoleCatalog';
import { useCanRecordAudio } from '../hooks/useCanRecordAudio';
import { ProfileSelector } from '../organisms/ProfileSelector';
import { OfferAndRoleForm } from '../organisms/OfferAndRoleForm';
import { ModeAndToneForm } from '../organisms/ModeAndToneForm';
import { LanguageAndFormatForm } from '../organisms/LanguageAndFormatForm';
import { JOB_OFFER_MAX_LENGTH } from '../model/interviewSetup.constants';
import type {
  InterviewTone,
  InterviewMode,
  AnswerFormat,
  SessionLanguage,
} from '../model/interviewSetup.types';
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
  const canRecordAudio = useCanRecordAudio();

  useEffect(() => {
    if (!canRecordAudio && store.answerFormat === 'AUDIO') {
      store.setAnswerFormat('TEXTO');
    }
  }, [canRecordAudio, store.answerFormat, store]);

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
  const canAdvanceStep2 = true;
  const canAdvanceStep3 = true;

  const handleNext = useCallback(() => {
    if (store.currentStep === 0 && canAdvanceStep0) {
      store.nextStep();
    } else if (store.currentStep === 1 && canAdvanceStep1) {
      store.nextStep();
    } else if (store.currentStep === 2 && canAdvanceStep2) {
      store.nextStep();
    } else if (store.currentStep === 3 && canAdvanceStep3) {
      store.nextStep();
    }
  }, [store, canAdvanceStep0, canAdvanceStep1, canAdvanceStep2, canAdvanceStep3]);

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
    store.currentStep >= 4;

  const steps = [
    {
      label: t('interview:asistente.pasos.perfilProfesional'),
      status: stepStatus(0, store.currentStep),
    },
    { label: t('interview:asistente.pasos.ofertaYRol'), status: stepStatus(1, store.currentStep) },
    { label: t('interview:asistente.pasos.modoYTono'), status: stepStatus(2, store.currentStep) },
    {
      label: t('interview:asistente.pasos.idiomaYFormato'),
      status: stepStatus(3, store.currentStep),
    },
  ];

  const modeLabels = useMemo(
    () => ({
      SIMULACION: t('interview:modalidad.SIMULACION'),
      ENTRENO: t('interview:modalidad.ENTRENO'),
    }),
    [t],
  ) as Record<InterviewMode, string>;

  const toneLabels = useMemo(
    () => ({
      PROFESIONAL_NEUTRO: t('interview:tono.PROFESIONAL_NEUTRO'),
      CALIDO: t('interview:tono.CALIDO'),
      ESTRICTO: t('interview:tono.ESTRICTO'),
      MOTIVADOR: t('interview:tono.MOTIVADOR'),
    }),
    [t],
  ) as Record<InterviewTone, string>;

  const toneDescriptions = useMemo(
    () => ({
      PROFESIONAL_NEUTRO: t('interview:tono.PROFESIONAL_NEUTRO_descripcion'),
      CALIDO: t('interview:tono.CALIDO_descripcion'),
      ESTRICTO: t('interview:tono.ESTRICTO_descripcion'),
      MOTIVADOR: t('interview:tono.MOTIVADOR_descripcion'),
    }),
    [t],
  ) as Record<InterviewTone, string>;

  const languageLabels = useMemo(
    () => ({
      'es-CO': t('interview:idiomaEntrevista.es-CO'),
      en: t('interview:idiomaEntrevista.en'),
    }),
    [t],
  ) as Record<SessionLanguage, string>;

  const formatLabels = useMemo(
    () => ({
      AUDIO: t('interview:formaRespuesta.AUDIO'),
      TEXTO: t('interview:formaRespuesta.TEXTO'),
    }),
    [t],
  ) as Record<AnswerFormat, string>;

  const formatDescriptions = useMemo(
    () => ({
      AUDIO: t('interview:formaRespuesta.AUDIO_descripcion'),
      TEXTO: t('interview:formaRespuesta.TEXTO_descripcion'),
    }),
    [t],
  ) as Record<AnswerFormat, string>;

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
      ) : store.currentStep === 2 ? (
        <ModeAndToneForm
          selectedMode={store.mode}
          selectedTone={store.tone}
          onModeChange={store.setMode}
          onToneChange={store.setTone}
          modeLabel={t('interview:modalidad.etiqueta')}
          toneLabel={t('interview:tono.etiqueta')}
          modeLabels={modeLabels}
          toneLabels={toneLabels}
          toneDescriptions={toneDescriptions}
          comingSoonLabel={t('interview:modalidad.proximamente')}
        />
      ) : store.currentStep === 3 ? (
        <LanguageAndFormatForm
          selectedLanguage={store.sessionLanguage}
          selectedFormat={store.answerFormat}
          onLanguageChange={store.setSessionLanguage}
          onFormatChange={store.setAnswerFormat}
          canRecordAudio={canRecordAudio}
          languageLabel={t('interview:idiomaEntrevista.etiqueta')}
          formatLabel={t('interview:formaRespuesta.etiqueta')}
          languageLabels={languageLabels}
          formatLabels={formatLabels}
          formatDescriptions={formatDescriptions}
          browserCannotRecordMessage={t('interview:formaRespuesta.navegadorNoGraba')}
        />
      ) : (
        <EmptyState
          title={t('common:pendiente.titulo', { ticket: 'CM-208' })}
          description={t('common:pendiente.descripcion', { prt: 'PRT-04.11' })}
        />
      )}
    </WizardLayout>
  );
}
