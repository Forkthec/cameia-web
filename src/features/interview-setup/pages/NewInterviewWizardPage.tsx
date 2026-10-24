/**
 * Pagina del asistente de configuracion de entrevista (HU-4.2, HU-4.3, HU-4.4).
 * Orquesta los 5 pasos del wizard usando WizardLayout y el store de Zustand.
 * Paso 0: seleccion de perfil. Paso 1: oferta y rol. Paso 2: modo y tono.
 * Paso 3: idioma y forma de respuesta. Paso 4: confirmar e iniciar.
 *
 * Protege la regla CA-4.2: los datos no se persisten aqui, viajan al crear
 * la sesion en HU-4.4. El boton "Iniciar entrevista" vive en el paso 4
 * (CA-4.4.1), con proteccion de doble clic (CA-4.4.17), manejo de error
 * (CA-4.4.5), perfil sincronizando (CA-4.4.19) y aviso de entrevista en
 * curso (CA-4.4.7).
 *
 * Los pasos 2 y 3 muestran las opciones del catálogo de Backend
 * (CA-4.3.10); si falla la carga, «Ocurrió un error. Inténtalo de nuevo.»
 * con «Reintentar carga» y sin avanzar (CA-4.3.11).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ApiError } from '@/services/http/ApiError';
import { ROUTES } from '@/app/router/routes';
import { WizardLayout } from '@/layouts/WizardLayout';
import { Skeleton } from '@/design-system/atoms/Skeleton';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { useInterviewSetupStore } from '../store/interviewSetup.store';
import { useProfileList } from '../hooks/useProfileList';
import { useRoleCatalog } from '../hooks/useRoleCatalog';
import { useCanRecordAudio } from '../hooks/useCanRecordAudio';
import { useInterviewCatalog } from '../hooks/useInterviewCatalog';
import { useCreateSession } from '../hooks/useCreateSession';
import { ProfileSelector } from '../organisms/ProfileSelector';
import { OfferAndRoleForm } from '../organisms/OfferAndRoleForm';
import { ModeAndToneForm } from '../organisms/ModeAndToneForm';
import { LanguageAndFormatForm } from '../organisms/LanguageAndFormatForm';
import { ConfirmAndStartForm } from '../organisms/ConfirmAndStartForm';
import { InProgressWarningDialog } from '../organisms/InProgressWarningDialog';
import { WizardStepHeader } from '../organisms/WizardStepHeader';
import { JOB_OFFER_MAX_LENGTH } from '../model/interviewSetup.constants';
import type {
  InterviewTone,
  InterviewMode,
  AnswerFormat,
  SessionLanguage,
} from '../model/interviewSetup.types';
import type { CreateSessionResponseDto } from '../api/interviewSession.dto';
import type { StepStatus } from '@/design-system/molecules/Stepper';

function stepStatus(index: number, current: number): StepStatus {
  if (index < current) return 'complete';
  if (index === current) return 'current';
  return 'upcoming';
}

/** Llave de i18n del encabezado de cada paso, en el orden del asistente. */
const STEP_KEYS = [
  'perfilProfesional',
  'ofertaYRol',
  'modoYTono',
  'idiomaYFormato',
  'confirmar',
] as const;

export function NewInterviewWizardPage() {
  const { t } = useTranslation(['interview', 'common']);
  const store = useInterviewSetupStore();
  const navigate = useNavigate();
  const createSession = useCreateSession();
  // CA-4.4.17 (CM-341): un doble clic real llega antes de que React pinte el
  // botón en carga, así que `isPending` aún es falso en el segundo clic. Este
  // candado síncrono deja pasar una sola petición hasta que termine.
  const creatingRef = useRef(false);

  const [warningData, setWarningData] = useState<CreateSessionResponseDto | null>(null);
  // El foco va al título del paso solo cuando el usuario ya cambió de paso,
  // no en la primera carga (robarle el foco al entrar sería desorientador).
  const [initialStep] = useState(store.currentStep);
  const focusStepTitle = store.currentStep !== initialStep;

  const profileQuery = useProfileList();
  const roleQuery = useRoleCatalog();
  const canRecordAudio = useCanRecordAudio();
  const catalogQuery = useInterviewCatalog();
  const catalog = catalogQuery.data;
  const isCatalogStep = store.currentStep === 2 || store.currentStep === 3;

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

  const selectedRole = useMemo(
    () => (roleQuery.data ?? []).find((r) => r.id === store.targetRoleId) ?? null,
    [roleQuery.data, store.targetRoleId],
  );

  const hasEmptyState =
    !profileQuery.isLoading &&
    !profileQuery.isError &&
    (profiles.length === 0 || activeProfiles.length === 0);

  const trimmedJobOffer = store.jobOffer?.trim() ?? '';

  const jobOfferError = useMemo(() => {
    if (store.jobOffer && store.jobOffer.length > JOB_OFFER_MAX_LENGTH) {
      return t('interview:validacion.ofertaMaxCaracteres');
    }
    return null;
  }, [store.jobOffer, t]);

  // CA-4.2.15/16: el mensaje aparece al intentar «Siguiente» sin un rol
  // elegido de la lista (vacío o texto libre) y se va al elegir uno.
  const [roleAttempted, setRoleAttempted] = useState(false);
  const roleError =
    roleAttempted && !store.targetRoleId ? t('interview:validacion.rolDeLaLista') : null;

  // Solo cuenta un perfil que siga en la lista de activos: uno elegido en una
  // visita anterior que ya no está no deja avanzar.
  const canAdvanceStep0 = activeProfiles.some((p) => p.id === store.profileId);
  const canAdvanceStep1 = !jobOfferError && !!store.targetRoleId;
  const isConfigComplete = canAdvanceStep0 && canAdvanceStep1;

  const handleNext = useCallback(() => {
    if (store.currentStep === 0 && canAdvanceStep0) store.nextStep();
    else if (store.currentStep === 1 && canAdvanceStep1) store.nextStep();
    else if (store.currentStep === 2) store.nextStep();
    else if (store.currentStep === 3) store.nextStep();
  }, [store, canAdvanceStep0, canAdvanceStep1]);

  const handleBack = useCallback(() => {
    store.prevStep();
  }, [store]);

  const handleNextWithValidation = useCallback(() => {
    if (store.currentStep === 1 && !store.targetRoleId) {
      setRoleAttempted(true);
      return;
    }
    handleNext();
  }, [store.currentStep, store.targetRoleId, handleNext]);

  const handleCreateSession = useCallback(() => {
    if (!store.profileId || !store.targetRoleId || creatingRef.current) return;
    creatingRef.current = true;
    createSession.mutate(
      {
        profileId: store.profileId,
        targetRoleId: store.targetRoleId,
        jobOffer: trimmedJobOffer || null,
        mode: store.mode,
        tone: store.tone,
        answerFormat: store.answerFormat,
        sessionLanguage: store.sessionLanguage,
      },
      {
        onSettled: () => {
          creatingRef.current = false;
        },
        onSuccess: (data) => {
          if (data.ongoingSession && data.ongoingSession.answersCount < 5) {
            setWarningData(data);
          } else {
            void navigate(ROUTES.entrenarIniciando, { state: { sessionId: data.sessionId } });
          }
        },
      },
    );
  }, [store, createSession, navigate, trimmedJobOffer]);

  const handleStartNewFromWarning = useCallback(() => {
    if (!warningData) return;
    void navigate(ROUTES.entrenarIniciando, { state: { sessionId: warningData.sessionId } });
    setWarningData(null);
  }, [warningData, navigate]);

  const handleBackToInterview = useCallback(() => {
    if (!warningData?.ongoingSession) return;
    void navigate(ROUTES.entrenarSesion(warningData.ongoingSession.sessionId));
    setWarningData(null);
  }, [warningData, navigate]);

  const handleCancelWarning = useCallback(() => {
    setWarningData(null);
  }, []);

  const errorMessage = useMemo(() => {
    if (!createSession.isError) return null;
    const err: unknown = createSession.error;
    if (err instanceof ApiError && err.code === 'PROFILE_SYNC_PENDING') {
      return t('interview:confirmar.perfilSincronizando');
    }
    return t('interview:confirmar.errorGenerico');
  }, [createSession.isError, createSession.error, t]);

  const isPrimaryDisabled =
    (store.currentStep === 0 && (!canAdvanceStep0 || hasEmptyState)) ||
    (store.currentStep === 1 && !!jobOfferError) ||
    (isCatalogStep && !catalog) ||
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
    {
      label: t('interview:asistente.pasos.confirmar'),
      status: stepStatus(4, store.currentStep),
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

  const summaryRows = useMemo(
    () => [
      {
        label: t('interview:confirmar.perfil'),
        value: selectedProfile?.name ?? '—',
        icon: 'document' as const,
      },
      {
        label: t('interview:confirmar.ofertaLaboral'),
        icon: 'briefcase' as const,
        value: trimmedJobOffer
          ? trimmedJobOffer.length > 60
            ? `${trimmedJobOffer.slice(0, 60)}…`
            : trimmedJobOffer
          : t('interview:confirmar.sinOferta'),
      },
      {
        label: t('interview:confirmar.rolObjetivo'),
        value: selectedRole?.name ?? '—',
        icon: 'target' as const,
      },
      {
        label: t('interview:confirmar.modalidad'),
        value: modeLabels[store.mode],
        icon: 'dumbbell' as const,
      },
      {
        label: t('interview:confirmar.tono'),
        value: toneLabels[store.tone],
        icon: 'message' as const,
      },
      {
        label: t('interview:confirmar.formaRespuesta'),
        value: formatLabels[store.answerFormat],
        icon: 'keyboard' as const,
      },
      {
        label: t('interview:confirmar.idiomaEntrevista'),
        value: languageLabels[store.sessionLanguage],
        icon: 'globe' as const,
      },
    ],
    [
      selectedProfile,
      store,
      selectedRole,
      modeLabels,
      toneLabels,
      formatLabels,
      languageLabels,
      t,
      trimmedJobOffer,
    ],
  );

  return (
    <>
      <WizardLayout
        steps={steps}
        stepsLabel={t('interview:asistente.progreso')}
        primaryActionLabel={t('common:acciones.siguiente')}
        onPrimaryAction={handleNextWithValidation}
        primaryActionDisabled={isPrimaryDisabled}
        progressText={t('interview:asistente.pasoDeTotal', {
          actual: store.currentStep + 1,
          total: steps.length,
        })}
        backLabel={t('common:acciones.atras')}
        onBack={store.currentStep > 0 ? handleBack : undefined}
        exitLabel={t('common:acciones.volverInicio')}
        exitTo={ROUTES.inicio}
        hidePrimaryAction={store.currentStep === 4}
      >
        <WizardStepHeader
          key={store.currentStep}
          index={store.currentStep + 1}
          stepLabel={steps[store.currentStep]?.label ?? ''}
          title={t(
            `interview:asistente.encabezados.${STEP_KEYS[store.currentStep] ?? 'confirmar'}.titulo`,
          )}
          description={t(
            `interview:asistente.encabezados.${STEP_KEYS[store.currentStep] ?? 'confirmar'}.descripcion`,
          )}
          focusOnMount={focusStepTitle}
        />
        {store.currentStep === 0 ? (
          <ProfileSelector
            profiles={profiles}
            roles={roleQuery.data ?? []}
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
        ) : isCatalogStep && catalogQuery.isError ? (
          <EmptyState
            title={t('interview:asistente.catalogo.error')}
            actionLabel={t('interview:asistente.catalogo.reintentarCarga')}
            onAction={() => void catalogQuery.refetch()}
          />
        ) : isCatalogStep && !catalog ? (
          <div className="gap-space-3 flex flex-col" aria-busy="true">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        ) : store.currentStep === 2 && catalog ? (
          <ModeAndToneForm
            modes={catalog.modes}
            tones={catalog.tones}
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
        ) : store.currentStep === 3 && catalog ? (
          <LanguageAndFormatForm
            languages={catalog.languages}
            answerFormats={catalog.answerFormats}
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
          <ConfirmAndStartForm
            rows={summaryRows}
            startLabel={t('interview:confirmar.iniciarEntrevista')}
            onStart={handleCreateSession}
            isLoading={createSession.isPending}
            loadingLabel={t('common:estados.cargando')}
            isDisabled={!isConfigComplete}
            disabledMessage={!isConfigComplete ? t('interview:confirmar.datosIncompletos') : null}
            // El error de un intento anterior no se mezcla con el aviso de datos
            // incompletos: con la configuración incompleta no se puede reintentar
            // (observación 2 del testeo del 24-10-2026).
            errorMessage={isConfigComplete ? errorMessage : null}
            backLabel={t('common:acciones.atras')}
            onBack={handleBack}
          />
        )}
      </WizardLayout>

      {warningData ? (
        <InProgressWarningDialog
          title={t('interview:confirmar.avisoEnCurso.titulo')}
          message={t('interview:confirmar.avisoEnCurso.mensaje')}
          startNewLabel={t('interview:confirmar.avisoEnCurso.iniciarNueva')}
          backToInterviewLabel={t('interview:confirmar.avisoEnCurso.volverEntrevista')}
          cancelLabel={t('interview:confirmar.avisoEnCurso.cancelar')}
          onStartNew={handleStartNewFromWarning}
          onBackToInterview={handleBackToInterview}
          onCancel={handleCancelWarning}
        />
      ) : null}
    </>
  );
}
