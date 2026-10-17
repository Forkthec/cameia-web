/**
 * `/perfiles/:id/editar` — Formulario de Perfil Profesional (PRT-02.03,
 * CM-53/CM-61/CM-65): el armazón compartido (índice de secciones + barra de
 * acciones) que CM-53 dejó explícitamente sin dueño y CM-61 construye, con
 * las secciones que ya existen hoy (Información General, Formación
 * académica, Experiencia Laboral, Habilidades). "Expectativas Profesionales"
 * no se lista: fuera del MVP (decisión D-02), SPEC.md §9 decisión D-D.
 *
 * Vive dentro de `AppShell` (la ruta se mudó de
 * `professionalProfileWizardRoutes` a `professionalProfileShellRoutes` —
 * SPEC.md §9, decisión D-E): el frame real de Figma en `lg` monta el
 * `nav-header` normal de la app (nodo `189:1114`, verificado en vivo,
 * CLAUDE.md §13), no un armazón propio. Deja de usar `WizardLayout`, cuyo
 * propio TSDoc ya documentaba que no es la plantilla de esta pantalla.
 *
 * `isDesktop` se resuelve una sola vez aquí (`useMediaQuery`) y baja por
 * props a `ProfileSectionsLayout` y a cada organismo (`showSectionTitle`):
 * es la única capa de esta feature que decide el breakpoint.
 *
 * "Guardar borrador" solo envía `GeneralInfoForm` (por el atributo HTML
 * `form`, `GENERAL_INFO_FORM_ID`): Educación, Experiencia Laboral,
 * Habilidades y Roles Objetivo se persisten al vuelo por ítem, sin
 * borrador que guardar (decisión D-C). Desde CM-195 (decisión D-H),
 * `GeneralInfoForm` también se autoguarda en `onBlur` — "Guardar borrador"
 * queda como respaldo explícito, ya no como el único disparador; ver TSDoc
 * de cabecera de `GeneralInfoForm.tsx`. "Finalizar y Continuar" (CM-65) ya
 * llama a `useFinalizeProfile` contra el endpoint real — con Habilidades y
 * Roles Objetivo ya fusionados, `getCompletenessValue` puede llegar a los 5
 * requisitos reales y habilitar el botón. Un `422 PROFILE_INCOMPLETE` (si
 * de todos modos se intenta con el perfil incompleto) muestra **todos**
 * los requisitos incumplidos a la vez, nunca solo el primero — el frontend
 * nunca renderiza el mensaje crudo del backend (`CLAUDE.md` §8), solo el
 * código de cada requisito traducido.
 *
 * CM-69 agrega `useProfessionalRolesQuery`: el catálogo cerrado de roles TI
 * es la única dependencia de datos de esta página que no cuelga de
 * `useProfileQuery`, así que el estado de carga/error inicial considera
 * ambas peticiones.
 *
 * Es la única capa de esta feature que llama `useTranslation`: los
 * organismos que ensambla siguen el patrón de `GeneralInfoForm` (texto por
 * props obligatorias, sin `useTranslation` propio — CLAUDE.md §14.7).
 *
 * **CM-195 (decisión D-I):** `profile.status === 'COMPLETED'` ya no solo
 * deshabilita "Finalizar y Continuar" en silencio — muestra
 * `profile:formulario.yaActivo` de forma visible (antes solo vivía en el
 * hint `sr-only` del botón). Cubre también el `409`
 * (`ProfileAlreadyCompletedException`, confirmado contra
 * `ProfileController.java#completeProfile`) por si el botón se dispara con
 * una caché vieja. Además, guarda `profileId` en `lastUsedProfileId`
 * (`stores/uiPreferences.store.ts`) al cargar — conveniencia de cliente
 * prevista desde antes (`GLO-TBD-06`) pero nunca conectada; es lo que le
 * permite a `AppShell`/"Perfiles" dejar de mandar siempre a
 * `/perfiles/nuevo`. Ver TSDoc de cabecera de `NewProfilePage.tsx` para el
 * otro lado de esta conexión.
 *
 * **CM-272 (HU-2.3, decisión D-J):** el error del `PATCH` de Información
 * General ya no se descarta — se lee de `updateGeneralInfo` y se resuelve por
 * `code` con `getItemErrorMessage` (`ADR-0008`): `PROFILE_NOT_ALLOWED` →
 * `errors:codigos.NOT_FOUND`, `SUMMARY_NOT_ALLOWED` →
 * `profile:general.resumen.errorPerfilActivo`, cualquier otro error →
 * `errors:generico` (o `errors:red` si no es un `ApiError`). «Cambios
 * guardados.» solo se ve mientras el último guardado fue exitoso y el
 * formulario no tiene cambios sin guardar (`isGeneralInfoDirty`, que avisa
 * `GeneralInfoForm`); nunca a la vez que el error. La carga también se
 * resuelve por `code`: un `403 PROFILE_NOT_ALLOWED` (perfil ajeno) muestra
 * `errors:codigos.NOT_FOUND`, igual que el `404` (RT-03, CA-2.3.11). Ante
 * `SUMMARY_NOT_ALLOWED` (CA-2.3.12) devuelve al formulario el resumen guardado
 * para que el campo lo vuelva a mostrar; solo para ese `code`, nunca ante otros
 * errores (RT-05).
 *
 * **CM-273 (PR 2, HU-2.4, SPEC.md §3.3 y D-T a D-AG):** los periodos salen de `formatWorkExperiencePeriod` y
 * `formatEducationPeriod` (el modelo). La página pasa a Formación y Experiencia los topes (`maxItems` y su mensaje),
 * los textos de longitud y los errores del servidor por campo (`serverFieldErrors`, que la sección aplica con
 * `setError`). `onAdd` y `onRemove` devuelven la promesa de `mutateAsync` (guarda de doble envío en la sección).
 * Cada sección muestra solo el mensaje de su última acción, alta o baja; los errores se resuelven por `code` con
 * tablas propias consultadas antes de las de `getItemErrorMessage`, y sin `code` conocido el texto es
 * `errors:generico` (o `errors:red` si no es un `ApiError`).
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { Button } from '@/design-system/atoms/Button';
import { Spinner } from '@/design-system/atoms/Spinner';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ApiError } from '@/services/http/ApiError';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { getCurrentUtcYearMonth } from '@/utils/monthMask';
import { useAddEducation } from '../hooks/useAddEducation';
import { useAddSkill } from '../hooks/useAddSkill';
import { useAddTargetRole } from '../hooks/useAddTargetRole';
import { useAddWorkExperience } from '../hooks/useAddWorkExperience';
import { useFinalizeProfile } from '../hooks/useFinalizeProfile';
import { useProfessionalRolesQuery } from '../hooks/useProfessionalRolesQuery';
import { useProfileQuery } from '../hooks/useProfileQuery';
import { useRemoveEducation } from '../hooks/useRemoveEducation';
import { useRemoveSkill } from '../hooks/useRemoveSkill';
import { useRemoveTargetRole } from '../hooks/useRemoveTargetRole';
import { useRemoveWorkExperience } from '../hooks/useRemoveWorkExperience';
import { useSubstituteTargetRole } from '../hooks/useSubstituteTargetRole';
import { useUpdateProfileGeneralInfo } from '../hooks/useUpdateProfileGeneralInfo';
import {
  DESKTOP_MEDIA_QUERY,
  EDUCATION_FORM_ID,
  EDUCATION_MAX_COUNT,
  GENERAL_INFO_FORM_ID,
  PROFILE_COMPLETENESS_MAX,
  SKILLS_FORM_ID,
  SKILLS_MAX_COUNT,
  WORK_EXPERIENCE_FORM_ID,
  WORK_EXPERIENCE_MAX_COUNT,
} from '../model/profile.constants';
import { getMissingRequirementFields } from '../model/missingRequirements';
import { getCompletenessValue, getSectionStatuses } from '../model/profileCompleteness';
import { formatEducationPeriod, formatWorkExperiencePeriod } from '../model/yearMonth';
import { EducationSection } from '../organisms/EducationSection';
import { GeneralInfoForm } from '../organisms/GeneralInfoForm';
import { ProfileActionsBar } from '../organisms/ProfileActionsBar';
import { ProfileSectionsLayout, type ProfileSection } from '../organisms/ProfileSectionsLayout';
import { SkillsSection } from '../organisms/SkillsSection';
import { TargetRolesSection } from '../organisms/TargetRolesSection';
import { WorkExperienceSection } from '../organisms/WorkExperienceSection';

/** `true` solo si el rechazo es el del resumen de un perfil activo (`code` `SUMMARY_NOT_ALLOWED`, de nivel superior o en `errors[]`). */
function isSummaryNotAllowed(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.hasCode('SUMMARY_NOT_ALLOWED') ||
      error.errors.some((fieldError) => fieldError.code === 'SUMMARY_NOT_ALLOWED'))
  );
}

/** Última acción hecha en Formación o Experiencia: decide cuál de las dos mutaciones se muestra (D-AA, D-AD). */
type LastAction = 'add' | 'remove' | null;

/** Errores del servidor ya traducidos que la página entrega a una sección para pintarlos bajo el campo (D-T). */
type FieldErrors = { startDate?: string; endDate?: string };

/**
 * Mensaje de la primera coincidencia por `code` (de nivel superior y luego en `errors[]`), o `undefined` si no hay.
 * Es la tabla propia de CM-273 (D-T, D-W): se consulta antes que las tablas de `getItemErrorMessage`.
 */
function findMessageByCode(error: unknown, byCode: Record<string, string>): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  const topMatch = error.code ? byCode[error.code] : undefined;
  if (topMatch) return topMatch;
  for (const fieldError of error.errors) {
    const fieldMatch = fieldError.code ? byCode[fieldError.code] : undefined;
    if (fieldMatch) return fieldMatch;
  }
  return undefined;
}

/**
 * Traduce los `errors[]` de un rechazo a un mapa campo → texto (D-T). Tabla propia código → campo; un `code` que no
 * está en ella no produce mensaje de campo.
 */
function findFieldErrors(
  error: unknown,
  rules: Record<string, { field: keyof FieldErrors; message: string }>,
): FieldErrors | undefined {
  if (!(error instanceof ApiError)) return undefined;
  const result: FieldErrors = {};
  for (const fieldError of error.errors) {
    const rule = fieldError.code ? rules[fieldError.code] : undefined;
    if (rule) result[rule.field] = rule.message;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function EditProfilePage() {
  const { id } = useParams<{ id: string }>();
  const profileId = id as string;
  const { t, i18n } = useTranslation(['profile', 'common', 'errors']);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  // El mes actual lo decide la página y se lo pasa a las dos secciones (D-M), para que compartan el valor.
  const currentMonth = getCurrentUtcYearMonth();
  const monthFieldTexts = {
    placeholder: t('profile:fechas.placeholder'),
    openPanelLabel: t('profile:fechas.selector.abrir'),
    panelLabel: t('profile:fechas.selector.titulo'),
    previousYearLabel: t('profile:fechas.selector.anioAnterior'),
    nextYearLabel: t('profile:fechas.selector.anioSiguiente'),
  };

  const profileQuery = useProfileQuery(profileId);
  const professionalRolesQuery = useProfessionalRolesQuery();
  const updateGeneralInfo = useUpdateProfileGeneralInfo(profileId);
  const addEducation = useAddEducation(profileId);
  const removeEducation = useRemoveEducation(profileId);
  const addWorkExperience = useAddWorkExperience(profileId);
  const removeWorkExperience = useRemoveWorkExperience(profileId);
  const addSkill = useAddSkill(profileId);
  const removeSkill = useRemoveSkill(profileId);
  const finalizeProfile = useFinalizeProfile(profileId);
  const addTargetRole = useAddTargetRole(profileId);
  const substituteTargetRole = useSubstituteTargetRole(profileId);
  const removeTargetRole = useRemoveTargetRole(profileId);
  const setLastUsedProfileId = useUiPreferencesStore((state) => state.setLastUsedProfileId);
  // CM-272 (punto 2): «Cambios guardados.» solo es verdad mientras el formulario no tenga cambios sin guardar.
  const [isGeneralInfoDirty, setIsGeneralInfoDirty] = useState(false);
  // CM-273 (D-AA, D-AD): cada sección muestra solo el mensaje de su última acción, alta o baja.
  const [lastEducationAction, setLastEducationAction] = useState<LastAction>(null);
  const [lastWorkExperienceAction, setLastWorkExperienceAction] = useState<LastAction>(null);

  // CM-273 (D-T): se memorizan por la identidad del error de la mutación, no por el texto: un segundo rechazo
  // idéntico es un objeto nuevo y la sección vuelve a pintarlo.
  const educationFieldErrors = useMemo(
    () =>
      lastEducationAction === 'add' && addEducation.isError
        ? findFieldErrors(addEducation.error, {
            START_DATE_BEFORE_BIRTH: {
              field: 'startDate',
              message: t('profile:educacion.errorFechaAnteriorNacimiento'),
            },
          })
        : undefined,
    [lastEducationAction, addEducation.isError, addEducation.error, t],
  );
  const workExperienceFieldErrors = useMemo(
    () =>
      lastWorkExperienceAction === 'add' && addWorkExperience.isError
        ? findFieldErrors(addWorkExperience.error, {
            START_DATE_BEFORE_MINIMUM_AGE: {
              field: 'startDate',
              message: t('profile:experiencia.errorFechaEdadMinima'),
            },
            END_DATE_BEFORE_MINIMUM_AGE: {
              field: 'endDate',
              message: t('profile:experiencia.errorFechaFinEdadMinima'),
            },
          })
        : undefined,
    [lastWorkExperienceAction, addWorkExperience.isError, addWorkExperience.error, t],
  );

  // CM-195 (decisión D-I): backfill de `lastUsedProfileId` para perfiles
  // abiertos aquí directamente (por link, o creados antes de esta
  // conexión) — no solo los recién creados en `NewProfilePage.tsx`.
  useEffect(() => {
    setLastUsedProfileId(profileId);
  }, [profileId, setLastUsedProfileId]);

  if (profileQuery.isPending || professionalRolesQuery.isPending) {
    return (
      <div className="py-space-9 flex justify-center">
        <Spinner label={t('common:estados.cargando')} hideLabel={false} />
      </div>
    );
  }

  if (profileQuery.isError || professionalRolesQuery.isError) {
    // Un ApiError real (mapErrorResponse) distingue NOT_FOUND de cualquier
    // otro fallo del servidor; algo que no es ApiError (p. ej. el fetch
    // rechazado por falta de conexión) es un fallo de red real. El catálogo
    // de roles (CM-69) no tiene un NOT_FOUND propio — solo el perfil lo
    // distingue.
    const error = profileQuery.error ?? professionalRolesQuery.error;
    const message =
      error instanceof ApiError
        ? error.httpStatus === 404 || error.hasCode('PROFILE_NOT_ALLOWED')
          ? t('errors:codigos.NOT_FOUND')
          : t('errors:generico')
        : t('errors:red');

    return (
      <div className="gap-space-4 mx-auto flex max-w-180 flex-col">
        <AlertInline variant="error">{message}</AlertInline>
        <Button
          variant="secondary"
          onClick={() => {
            void profileQuery.refetch();
            void professionalRolesQuery.refetch();
          }}
          className="self-start"
        >
          {t('common:acciones.reintentar')}
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data;
  const professionalRoles = professionalRolesQuery.data;
  const sectionStatuses = getSectionStatuses(profile);
  const completenessValue = getCompletenessValue(profile);

  /**
   * Resuelve el mensaje de error de una mutación de sección por `code`
   * (`ADR-0008`): primero busca el `code` de nivel superior del `ApiError`,
   * luego los `code` de cada elemento de `errors[]` (errores de campo dentro
   * de un `422 VALIDATION_FAILED`). Sin coincidencia devuelve el `fallback`
   * genérico de la sección — sin respaldo por `httpStatus` (`CLAUDE.md` §8).
   */
  function getItemErrorMessage(
    error: unknown,
    fallback: string,
    byCode: Record<string, string> = {},
  ): string {
    if (!(error instanceof ApiError)) return fallback;
    const topMatch = error.code ? byCode[error.code] : undefined;
    if (topMatch) return topMatch;
    for (const fieldError of error.errors) {
      const fieldMatch = fieldError.code ? byCode[fieldError.code] : undefined;
      if (fieldMatch) return fieldMatch;
    }
    return fallback;
  }

  /**
   * `getMissingRequirementFields` ya aísla la lectura de `error.errors`
   * (probada aparte, sin renderizar); aquí solo se traduce cada campo
   * contra `profile:formulario.requisitos.*` — un `field` que esta rama no
   * reconozca (p. ej. si el contrato real usa otros nombres) se omite en
   * vez de mostrar el texto crudo del backend (CLAUDE.md §8).
   */
  function getMissingRequirementsLabels(error: unknown): string[] | undefined {
    return getMissingRequirementFields(error)
      ?.map((field) => `profile:formulario.requisitos.${field}`)
      .filter((key) => i18n.exists(key))
      .map((key) => t(key));
  }

  // CM-272 (punto 1): error del `PATCH` de Información General, por `code`. Sin
  // `code` conocido cae en el genérico (o en `errors:red` si ni siquiera hubo
  // respuesta); nunca se muestra `title`/`detail` ni se decide por el estado HTTP.
  const generalInfoErrorMessage = updateGeneralInfo.isError
    ? getItemErrorMessage(
        updateGeneralInfo.error,
        updateGeneralInfo.error instanceof ApiError ? t('errors:generico') : t('errors:red'),
        {
          PROFILE_NOT_ALLOWED: t('errors:codigos.NOT_FOUND'),
          SUMMARY_NOT_ALLOWED: t('profile:general.resumen.errorPerfilActivo'),
        },
      )
    : undefined;

  // CM-273 (D-W): texto de reserva de altas y bajas, el mismo reparto que Información General.
  const getFallbackMessage = (error: unknown) =>
    error instanceof ApiError ? t('errors:generico') : t('errors:red');
  // CM-273 (D-T, CA-2.4.39): `PROFILE_NOT_ALLOWED` en cualquiera de las cuatro rutas de alta y baja.
  const notFoundByCode = {
    PROFILE_NOT_ALLOWED: t('errors:codigos.NOT_FOUND'),
  };
  const educationConfirmation =
    lastEducationAction === 'add' && addEducation.isSuccess
      ? t('profile:educacion.confirmacionAgregada')
      : lastEducationAction === 'remove' && removeEducation.isSuccess
        ? t('profile:educacion.confirmacionEliminada')
        : undefined;
  const workExperienceConfirmation =
    lastWorkExperienceAction === 'add' && addWorkExperience.isSuccess
      ? t('profile:experiencia.confirmacionAgregada')
      : lastWorkExperienceAction === 'remove' && removeWorkExperience.isSuccess
        ? t('profile:experiencia.confirmacionEliminada')
        : undefined;

  const sections: ProfileSection[] = [
    {
      id: 'general-info',
      label: t('profile:general.tituloSeccion'),
      status: sectionStatuses['general-info'],
      content: (
        <GeneralInfoForm
          formId={GENERAL_INFO_FORM_ID}
          name={profile.name}
          summary={profile.summary}
          sectionTitle={t('profile:general.tituloSeccion')}
          showSectionTitle={isDesktop}
          onDirtyChange={setIsGeneralInfoDirty}
          onSubmit={async (values) => {
            try {
              await updateGeneralInfo.mutateAsync(values);
            } catch (error) {
              // CA-2.3.12: el servidor rechazó vaciar el resumen de un perfil activo y lo
              // conserva; la pantalla también (SPEC §3.2). SOLO para ese `code` (ADR-0008):
              // un 500, un 503 o una caída de red se relanzan y NO restauran nada (RT-05).
              if (isSummaryNotAllowed(error)) return { restoreSummary: profile.summary };
              throw error;
            }
          }}
          nameLabel={t('profile:general.nombre.etiqueta')}
          nameHelperText={t('profile:general.nombre.ayuda')}
          namePlaceholder={t('profile:general.nombre.placeholder')}
          nameErrorRequired={t('profile:general.nombre.errorRequerido')}
          nameErrorTooLong={t('profile:general.nombre.errorLongitud')}
          summaryLabel={t('profile:general.resumen.etiqueta')}
          summaryPlaceholder={t('profile:general.resumen.placeholder')}
          summaryErrorTooLong={t('profile:general.resumen.errorLongitud')}
          summaryCounterLabel={(count, max) =>
            t('profile:general.resumen.contador', { count, max })
          }
        />
      ),
    },
    {
      id: 'education',
      label: t('profile:educacion.titulo'),
      status: sectionStatuses.education,
      content: (
        <EducationSection
          formId={EDUCATION_FORM_ID}
          items={profile.education}
          onAdd={(values) => {
            setLastEducationAction('add');
            return addEducation.mutateAsync(values);
          }}
          onRemove={(educationId) => {
            setLastEducationAction('remove');
            return removeEducation.mutateAsync(educationId);
          }}
          isAdding={addEducation.isPending}
          removingId={removeEducation.isPending ? (removeEducation.variables ?? null) : null}
          showSectionTitle={isDesktop}
          sectionTitle={t('profile:educacion.titulo')}
          levelLabel={t('profile:educacion.nivel.etiqueta')}
          levelPlaceholder={t('profile:educacion.nivel.placeholder')}
          levelOptions={[
            { value: 'TECHNICAL', label: t('profile:educacion.nivel.TECHNICAL') },
            { value: 'UNDERGRADUATE', label: t('profile:educacion.nivel.UNDERGRADUATE') },
            { value: 'POSTGRADUATE', label: t('profile:educacion.nivel.POSTGRADUATE') },
          ]}
          levelErrorRequired={t('profile:educacion.nivel.errorRequerido')}
          degreeLabel={t('profile:educacion.tituloObtenido.etiqueta')}
          degreePlaceholder={t('profile:educacion.tituloObtenido.placeholder')}
          degreeErrorRequired={t('profile:educacion.tituloObtenido.errorRequerido')}
          degreeErrorTooLong={t('profile:educacion.tituloObtenido.errorLongitud')}
          institutionLabel={t('profile:educacion.institucion.etiqueta')}
          institutionPlaceholder={t('profile:educacion.institucion.placeholder')}
          institutionErrorRequired={t('profile:educacion.institucion.errorRequerido')}
          institutionErrorTooLong={t('profile:educacion.institucion.errorLongitud')}
          startDateLabel={t('profile:educacion.fechaInicio.etiqueta')}
          startDateErrorRequired={t('profile:educacion.fechaInicio.errorRequerido')}
          endDateLabel={t('profile:educacion.fechaFin.etiqueta')}
          endDateErrorBeforeStart={t('profile:educacion.fechaFin.errorAnterior')}
          inProgressLabel={t('profile:educacion.enCurso')}
          addButtonLabel={t('profile:educacion.agregar')}
          addingButtonLabel={t('profile:educacion.agregando')}
          removeItemLabel={(item) => t('profile:educacion.eliminar', { titulo: item.degree })}
          removingItemLabel={t('profile:educacion.eliminando')}
          formatItemPeriod={(item) => formatEducationPeriod(item, t)}
          emptyStateTitle={t('profile:educacion.vacio.titulo')}
          emptyStateDescription={t('profile:educacion.vacio.descripcion')}
          currentMonth={currentMonth}
          locale={i18n.language}
          monthFieldTexts={monthFieldTexts}
          dateErrorFormat={t('profile:fechas.errorFormato')}
          dateErrorFuture={t('profile:fechas.errorPosteriorMesActual')}
          maxItems={EDUCATION_MAX_COUNT}
          maxItemsMessage={t('profile:educacion.errorLimite')}
          serverFieldErrors={educationFieldErrors}
          addErrorMessage={
            lastEducationAction === 'add' && addEducation.isError && !educationFieldErrors
              ? (findMessageByCode(addEducation.error, notFoundByCode) ??
                getItemErrorMessage(addEducation.error, getFallbackMessage(addEducation.error), {
                  EDUCATION_LIMIT_REACHED: t('profile:educacion.errorLimite'),
                  START_DATE_BEFORE_BIRTH: t('profile:educacion.errorFechaAnteriorNacimiento'),
                  INSTITUTION_INVALID_CHARACTERS: t('profile:educacion.errorCaracteresInvalidos'),
                  DEGREE_INVALID_CHARACTERS: t('profile:educacion.errorCaracteresInvalidos'),
                }))
              : undefined
          }
          removeErrorMessage={
            lastEducationAction === 'remove' && removeEducation.isError
              ? (findMessageByCode(removeEducation.error, {
                  ...notFoundByCode,
                  EDUCATION_NOT_ALLOWED: t('profile:educacion.errorUltimaFormacion'),
                  EDUCATION_NOT_FOUND: t('errors:codigos.NOT_FOUND'),
                }) ?? getFallbackMessage(removeEducation.error))
              : undefined
          }
          confirmationMessage={educationConfirmation}
        />
      ),
    },
    {
      id: 'work-experience',
      label: t('profile:experiencia.titulo'),
      secondaryLabel: t('profile:experiencia.etiquetaOpcional'),
      status: sectionStatuses['work-experience'],
      content: (
        <WorkExperienceSection
          formId={WORK_EXPERIENCE_FORM_ID}
          items={profile.workExperience}
          onAdd={(values) => {
            setLastWorkExperienceAction('add');
            return addWorkExperience.mutateAsync(values);
          }}
          onRemove={(workExperienceId) => {
            setLastWorkExperienceAction('remove');
            return removeWorkExperience.mutateAsync(workExperienceId);
          }}
          isAdding={addWorkExperience.isPending}
          removingId={
            removeWorkExperience.isPending ? (removeWorkExperience.variables ?? null) : null
          }
          showSectionTitle={isDesktop}
          sectionTitle={t('profile:experiencia.titulo')}
          positionLabel={t('profile:experiencia.cargo.etiqueta')}
          positionPlaceholder={t('profile:experiencia.cargo.placeholder')}
          positionErrorRequired={t('profile:experiencia.cargo.errorRequerido')}
          positionErrorTooLong={t('profile:experiencia.cargo.errorLongitud')}
          companyLabel={t('profile:experiencia.empresa.etiqueta')}
          companyPlaceholder={t('profile:experiencia.empresa.placeholder')}
          companyErrorRequired={t('profile:experiencia.empresa.errorRequerido')}
          companyErrorTooLong={t('profile:experiencia.empresa.errorLongitud')}
          startDateLabel={t('profile:experiencia.fechaInicio.etiqueta')}
          endDateLabel={t('profile:experiencia.fechaFin.etiqueta')}
          endDateErrorRequired={t('profile:experiencia.fechaFin.errorRequerido')}
          endDateErrorBeforeStart={t('profile:experiencia.fechaFin.errorAnterior')}
          currentJobLabel={t('profile:experiencia.actual')}
          unknownEndLabel={t('profile:experiencia.finDesconocido')}
          descriptionLabel={t('profile:experiencia.descripcion.etiqueta')}
          descriptionPlaceholder={t('profile:experiencia.descripcion.placeholder')}
          descriptionErrorTooLong={t('profile:experiencia.descripcion.errorLongitud')}
          descriptionCounterLabel={(count, max) =>
            t('profile:experiencia.descripcion.contador', { count, max })
          }
          addButtonLabel={t('profile:experiencia.agregar')}
          addingButtonLabel={t('profile:experiencia.agregando')}
          removeItemLabel={(item) => t('profile:experiencia.eliminar', { cargo: item.position })}
          removingItemLabel={t('profile:experiencia.eliminando')}
          formatItemPeriod={(item) => formatWorkExperiencePeriod(item, t)}
          emptyStateTitle={t('profile:experiencia.vacio.titulo')}
          emptyStateDescription={t('profile:experiencia.vacio.descripcion')}
          currentMonth={currentMonth}
          locale={i18n.language}
          monthFieldTexts={monthFieldTexts}
          dateErrorFormat={t('profile:fechas.errorFormato')}
          dateErrorFuture={t('profile:fechas.errorPosteriorMesActual')}
          maxItems={WORK_EXPERIENCE_MAX_COUNT}
          maxItemsMessage={t('profile:experiencia.errorLimite')}
          serverFieldErrors={workExperienceFieldErrors}
          addErrorMessage={
            lastWorkExperienceAction === 'add' &&
            addWorkExperience.isError &&
            !workExperienceFieldErrors
              ? (findMessageByCode(addWorkExperience.error, notFoundByCode) ??
                getItemErrorMessage(
                  addWorkExperience.error,
                  getFallbackMessage(addWorkExperience.error),
                  {
                    WORK_EXPERIENCE_LIMIT_REACHED: t('profile:experiencia.errorLimite'),
                    START_DATE_BEFORE_MINIMUM_AGE: t('profile:experiencia.errorFechaEdadMinima'),
                    END_DATE_BEFORE_MINIMUM_AGE: t('profile:experiencia.errorFechaFinEdadMinima'),
                    COMPANY_INVALID_CHARACTERS: t('profile:experiencia.errorCaracteresInvalidos'),
                    POSITION_INVALID_CHARACTERS: t('profile:experiencia.errorCaracteresInvalidos'),
                    DESCRIPTION_INVALID_CHARACTERS: t(
                      'profile:experiencia.errorCaracteresInvalidos',
                    ),
                  },
                ))
              : undefined
          }
          removeErrorMessage={
            lastWorkExperienceAction === 'remove' && removeWorkExperience.isError
              ? (findMessageByCode(removeWorkExperience.error, {
                  ...notFoundByCode,
                  WORK_EXPERIENCE_NOT_FOUND: t('errors:codigos.NOT_FOUND'),
                }) ?? getFallbackMessage(removeWorkExperience.error))
              : undefined
          }
          confirmationMessage={workExperienceConfirmation}
        />
      ),
    },
    {
      id: 'skills',
      label: t('profile:habilidades.titulo'),
      status: sectionStatuses.skills,
      content: (
        <SkillsSection
          formId={SKILLS_FORM_ID}
          items={profile.skills}
          onAdd={(values) => addSkill.mutate(values)}
          onRemove={(skillId) => removeSkill.mutate(skillId)}
          isAdding={addSkill.isPending}
          maxItems={SKILLS_MAX_COUNT}
          showSectionTitle={isDesktop}
          sectionTitle={t('profile:habilidades.titulo')}
          skillNameLabel={t('profile:habilidades.nombre.etiqueta')}
          skillNamePlaceholder={t('profile:habilidades.nombre.placeholder')}
          skillNameErrorRequired={t('profile:habilidades.nombre.errorRequerido')}
          skillNameErrorTooLong={t('profile:habilidades.nombre.errorLongitud')}
          skillNameErrorDuplicate={t('profile:habilidades.nombre.errorDuplicado')}
          levelLabel={t('profile:habilidades.nivel.etiqueta')}
          levelPlaceholder={t('profile:habilidades.nivel.placeholder')}
          levelOptions={[
            { value: 'BASIC', label: t('profile:habilidades.nivel.BASIC') },
            { value: 'INTERMEDIATE', label: t('profile:habilidades.nivel.INTERMEDIATE') },
            { value: 'ADVANCED', label: t('profile:habilidades.nivel.ADVANCED') },
          ]}
          levelErrorRequired={t('profile:habilidades.nivel.errorRequerido')}
          formatItemLabel={(item) =>
            t('profile:habilidades.chip', {
              nombre: item.skillName,
              nivel: t(`profile:habilidades.nivel.${item.level}`),
            })
          }
          addButtonLabel={t('profile:habilidades.agregar')}
          addingButtonLabel={t('profile:habilidades.agregando')}
          removeItemLabel={(item) => t('profile:habilidades.eliminar', { nombre: item.skillName })}
          maxItemsMessage={t('profile:habilidades.limiteAlcanzado')}
          emptyStateTitle={t('profile:habilidades.vacio.titulo')}
          emptyStateDescription={t('profile:habilidades.vacio.descripcion')}
          addErrorMessage={
            addSkill.isError
              ? getItemErrorMessage(addSkill.error, t('profile:habilidades.errorAgregar'), {
                  SKILL_LIMIT_REACHED: t('profile:habilidades.limiteAlcanzado'),
                  SKILL_ALREADY_EXISTS: t('profile:habilidades.errorYaExiste'),
                  SKILL_NAME_INVALID_CHARACTERS: t('profile:habilidades.errorAgregar'),
                })
              : undefined
          }
          removeErrorMessage={
            removeSkill.isError
              ? getItemErrorMessage(removeSkill.error, t('profile:habilidades.errorEliminar'), {
                  SKILL_NOT_ALLOWED: t('profile:habilidades.errorUltimaHabilidad'),
                })
              : undefined
          }
          confirmationMessage={
            addSkill.isSuccess
              ? t('profile:habilidades.confirmacionAgregada')
              : removeSkill.isSuccess
                ? t('profile:habilidades.confirmacionEliminada')
                : undefined
          }
        />
      ),
    },
    {
      id: 'target-roles',
      label: t('profile:rolesObjetivo.titulo'),
      status: sectionStatuses['target-roles'],
      content: (
        <TargetRolesSection
          items={profile.targetRoles}
          catalog={professionalRoles}
          onAdd={(professionalRoleId) => addTargetRole.mutate(professionalRoleId)}
          onSubstitute={(roleId, professionalRoleId) =>
            substituteTargetRole.mutate({ roleId, professionalRoleId })
          }
          onRemove={(roleId) => removeTargetRole.mutate(roleId)}
          isAdding={addTargetRole.isPending}
          substitutingId={
            substituteTargetRole.isPending ? (substituteTargetRole.variables?.roleId ?? null) : null
          }
          removingId={removeTargetRole.isPending ? (removeTargetRole.variables ?? null) : null}
          isProfileCompleted={profile.status === 'COMPLETED'}
          showSectionTitle={isDesktop}
          sectionTitle={t('profile:rolesObjetivo.titulo')}
          addLabel={t('profile:rolesObjetivo.agregar.etiqueta')}
          addPlaceholder={t('profile:rolesObjetivo.agregar.placeholder')}
          addingLabel={t('profile:rolesObjetivo.agregar.agregando')}
          noResultsLabel={t('profile:rolesObjetivo.agregar.sinResultados')}
          maxReachedMessage={t('profile:rolesObjetivo.agregar.tope')}
          substituteFieldLabel={t('profile:rolesObjetivo.sustituir.etiqueta')}
          substitutePlaceholder={t('profile:rolesObjetivo.sustituir.placeholder')}
          substituteItemLabel={(roleName) =>
            t('profile:rolesObjetivo.sustituir.accion', { rol: roleName })
          }
          substitutingItemLabel={t('profile:rolesObjetivo.sustituir.sustituyendo')}
          removeItemLabel={(roleName) => t('profile:rolesObjetivo.eliminar', { rol: roleName })}
          removingItemLabel={t('profile:rolesObjetivo.eliminando')}
          removeLastRoleBlockedHint={t('profile:rolesObjetivo.eliminarUltimoBloqueado')}
          emptyStateTitle={t('profile:rolesObjetivo.vacio.titulo')}
          emptyStateDescription={t('profile:rolesObjetivo.vacio.descripcion')}
          addErrorMessage={
            addTargetRole.isError
              ? getItemErrorMessage(addTargetRole.error, t('profile:rolesObjetivo.errorAgregar'), {
                  TARGET_ROLE_LIMIT_REACHED: t('profile:rolesObjetivo.agregar.tope'),
                  TARGET_ROLE_ALREADY_EXISTS: t('profile:rolesObjetivo.errorDuplicado'),
                })
              : undefined
          }
          substituteErrorMessage={
            substituteTargetRole.isError
              ? getItemErrorMessage(
                  substituteTargetRole.error,
                  t('profile:rolesObjetivo.errorSustituir'),
                  { TARGET_ROLE_ALREADY_EXISTS: t('profile:rolesObjetivo.errorDuplicado') },
                )
              : undefined
          }
          removeErrorMessage={
            removeTargetRole.isError
              ? getItemErrorMessage(
                  removeTargetRole.error,
                  t('profile:rolesObjetivo.errorEliminar'),
                  { TARGET_ROLE_NOT_ALLOWED: t('profile:rolesObjetivo.eliminarUltimoBloqueado') },
                )
              : undefined
          }
          confirmationMessage={
            addTargetRole.isSuccess
              ? t('profile:rolesObjetivo.confirmacionAgregado')
              : substituteTargetRole.isSuccess
                ? t('profile:rolesObjetivo.confirmacionSustituido')
                : removeTargetRole.isSuccess
                  ? t('profile:rolesObjetivo.confirmacionEliminado')
                  : undefined
          }
        />
      ),
    },
  ];

  return (
    <div className="gap-space-6 mx-auto flex max-w-5xl flex-col">
      <h1 className="text-h1 font-display text-text-primary">{t('profile:formulario.titulo')}</h1>

      <ProfileSectionsLayout
        sections={sections}
        isDesktop={isDesktop}
        stepListLabel={t('profile:formulario.indiceSecciones')}
      />

      {generalInfoErrorMessage ? (
        <AlertInline variant="error">{generalInfoErrorMessage}</AlertInline>
      ) : updateGeneralInfo.isSuccess && !isGeneralInfoDirty ? (
        <AlertInline variant="success">{t('profile:general.confirmacionGuardado')}</AlertInline>
      ) : null}

      {finalizeProfile.isSuccess ? (
        <AlertInline variant="success">
          {t('profile:formulario.confirmacionFinalizado')}
        </AlertInline>
      ) : null}
      {/* CM-195 (decisión D-I): perfil ya `COMPLETED` desde antes de esta
          sesión de la página — distinto de `finalizeProfile.isSuccess`
          (que solo es cierto si la mutación corrió aquí mismo). Sin esto,
          alguien que vuelve a un perfil ya activo solo ve el botón
          deshabilitado, sin ninguna explicación visible. */}
      {profile.status === 'COMPLETED' && !finalizeProfile.isSuccess ? (
        <AlertInline variant="success">{t('profile:formulario.yaActivo')}</AlertInline>
      ) : null}
      {finalizeProfile.isError
        ? (() => {
            const error = finalizeProfile.error;
            if (error instanceof ApiError && error.hasCode('PROFILE_ALREADY_COMPLETED')) {
              return (
                <AlertInline variant="success">{t('profile:formulario.yaActivo')}</AlertInline>
              );
            }
            if (error instanceof ApiError && error.hasCode('PROFILE_UPDATE_IN_PROGRESS')) {
              return (
                <AlertInline variant="error">
                  {t('profile:formulario.errorPerfilOcupado')}
                </AlertInline>
              );
            }
            const missingLabels = getMissingRequirementsLabels(error);
            return (
              <AlertInline variant="error">
                {missingLabels && missingLabels.length > 0 ? (
                  <>
                    {t('profile:formulario.errorFinalizarIncompleto')}
                    <ul className="pl-space-5 list-disc">
                      {missingLabels.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  t('profile:formulario.errorFinalizarGenerico')
                )}
              </AlertInline>
            );
          })()
        : null}

      <ProfileActionsBar
        draftFormId={GENERAL_INFO_FORM_ID}
        completenessValue={completenessValue}
        completenessMax={PROFILE_COMPLETENESS_MAX}
        completenessLabel={t('profile:formulario.completitud.etiqueta')}
        completenessFraction={t('profile:formulario.completitud.fraccion', {
          value: completenessValue,
          max: PROFILE_COMPLETENESS_MAX,
        })}
        saveDraftLabel={t('profile:general.guardarBorrador')}
        savingDraftLabel={t('profile:general.guardandoBorrador')}
        isSavingDraft={updateGeneralInfo.isPending}
        finishLabel={t('profile:formulario.finalizar')}
        onFinish={() => finalizeProfile.mutate()}
        isFinishDisabled={
          profile.status === 'COMPLETED' || completenessValue < PROFILE_COMPLETENESS_MAX
        }
        finishDisabledHint={
          profile.status === 'COMPLETED'
            ? t('profile:formulario.yaActivo')
            : `${t('profile:formulario.errorFinalizarIncompleto')} ${[
                ...(profile.name.trim().length === 0
                  ? [t('profile:formulario.requisitos.name')]
                  : []),
                ...(profile.summary.trim().length === 0
                  ? [t('profile:formulario.requisitos.summary')]
                  : []),
                ...(profile.education.length === 0
                  ? [t('profile:formulario.requisitos.education')]
                  : []),
                ...(profile.skills.length === 0
                  ? [t('profile:formulario.requisitos.skills')]
                  : []),
                ...(profile.targetRoles.length === 0
                  ? [t('profile:formulario.requisitos.targetRoles')]
                  : []),
              ].join(', ')}.`
        }
        isFinalizing={finalizeProfile.isPending}
        finalizingLabel={t('profile:formulario.finalizando')}
      />
    </div>
  );
}
