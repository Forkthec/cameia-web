/**
 * `/perfiles/:id/editar` — Formulario de Perfil Profesional (PRT-02.03,
 * CM-53/CM-61): el armazón compartido (índice de secciones + barra de
 * acciones) que CM-53 dejó explícitamente sin dueño y CM-61 construye, con
 * las tres secciones que ya existen hoy (Información General, Formación
 * académica, Experiencia Laboral). "Expectativas Profesionales" no se
 * lista: fuera del MVP (decisión D-02), SPEC.md §9 decisión D-D.
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
 * `form`, `GENERAL_INFO_FORM_ID`): Educación y Experiencia Laboral se
 * persisten al vuelo por ítem, sin borrador que guardar (decisión D-C).
 * "Finalizar y Continuar" se renderiza fiel a Figma pero SIEMPRE
 * deshabilitado hoy — su validación de 5 requisitos y su endpoint de
 * finalización son de CM-65/CM-69, que esta subtarea no construye.
 *
 * Es la única capa de esta feature que llama `useTranslation`: los cuatro
 * organismos que ensambla siguen el patrón de `GeneralInfoForm` (texto por
 * props obligatorias, sin `useTranslation` propio — CLAUDE.md §14.7).
 */
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { Button } from '@/design-system/atoms/Button';
import { Spinner } from '@/design-system/atoms/Spinner';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ApiError } from '@/services/http/ApiError';
import { useAddEducation } from '../hooks/useAddEducation';
import { useAddWorkExperience } from '../hooks/useAddWorkExperience';
import { useProfileQuery } from '../hooks/useProfileQuery';
import { useRemoveEducation } from '../hooks/useRemoveEducation';
import { useRemoveWorkExperience } from '../hooks/useRemoveWorkExperience';
import { useUpdateProfileGeneralInfo } from '../hooks/useUpdateProfileGeneralInfo';
import {
  DESKTOP_MEDIA_QUERY,
  EDUCATION_FORM_ID,
  GENERAL_INFO_FORM_ID,
  PROFILE_COMPLETENESS_MAX,
  WORK_EXPERIENCE_FORM_ID,
} from '../model/profile.constants';
import { getCompletenessValue, getSectionStatuses } from '../model/profileCompleteness';
import type { EducationItem, WorkExperienceItem } from '../model/profile.types';
import { formatYearMonth } from '../model/yearMonth';
import { EducationSection } from '../organisms/EducationSection';
import { GeneralInfoForm } from '../organisms/GeneralInfoForm';
import { ProfileActionsBar } from '../organisms/ProfileActionsBar';
import { ProfileSectionsLayout, type ProfileSection } from '../organisms/ProfileSectionsLayout';
import { WorkExperienceSection } from '../organisms/WorkExperienceSection';

export function EditProfilePage() {
  const { id } = useParams<{ id: string }>();
  const profileId = id as string;
  const { t, i18n } = useTranslation(['profile', 'common', 'errors']);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

  const profileQuery = useProfileQuery(profileId);
  const updateGeneralInfo = useUpdateProfileGeneralInfo(profileId);
  const addEducation = useAddEducation(profileId);
  const removeEducation = useRemoveEducation(profileId);
  const addWorkExperience = useAddWorkExperience(profileId);
  const removeWorkExperience = useRemoveWorkExperience(profileId);

  if (profileQuery.isPending) {
    return (
      <div className="py-space-9 flex justify-center">
        <Spinner label={t('common:estados.cargando')} hideLabel={false} />
      </div>
    );
  }

  if (profileQuery.isError) {
    // Un ApiError real (mapErrorResponse) distingue NOT_FOUND de cualquier
    // otro fallo del servidor; algo que no es ApiError (p. ej. el fetch
    // rechazado por falta de conexión) es un fallo de red real.
    const error = profileQuery.error;
    const message =
      error instanceof ApiError
        ? error.code === 'NOT_FOUND'
          ? t('errors:codigos.NOT_FOUND')
          : t('errors:generico')
        : t('errors:red');

    return (
      <div className="gap-space-4 mx-auto flex max-w-180 flex-col">
        <AlertInline variant="error">{message}</AlertInline>
        <Button
          variant="secondary"
          onClick={() => void profileQuery.refetch()}
          className="self-start"
        >
          {t('common:acciones.reintentar')}
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data;
  const sectionStatuses = getSectionStatuses(profile);
  const completenessValue = getCompletenessValue(profile);

  /**
   * Prefiere el mensaje específico del código de error real (p. ej.
   * `WORK_EXPERIENCE_DATE_INVALID`) cuando lo hay en `errors:codigos`, y
   * cae al mensaje genérico de la sección cuando no lo reconoce — mismo
   * criterio que ya usa `EditProfilePage` para el error de carga del perfil.
   */
  function getItemErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError && i18n.exists(`errors:codigos.${error.code}`)) {
      return t(`errors:codigos.${error.code}`);
    }
    return fallback;
  }

  const formatEducationPeriod = (item: EducationItem) =>
    item.inProgress
      ? t('profile:educacion.periodoEnCurso', {
          inicio: formatYearMonth(item.startDate, i18n.language),
        })
      : t('profile:educacion.periodo', {
          inicio: formatYearMonth(item.startDate, i18n.language),
          fin: item.endDate ? formatYearMonth(item.endDate, i18n.language) : '—',
        });

  const formatWorkExperiencePeriod = (item: WorkExperienceItem) =>
    item.employmentStatus === 'CURRENT'
      ? t('profile:experiencia.periodoActual', {
          inicio: formatYearMonth(item.startDate, i18n.language),
        })
      : item.employmentStatus === 'UNKNOWN_END'
        ? t('profile:experiencia.periodoFinDesconocido', {
            inicio: formatYearMonth(item.startDate, i18n.language),
          })
        : t('profile:experiencia.periodo', {
            inicio: formatYearMonth(item.startDate, i18n.language),
            fin: item.endDate ? formatYearMonth(item.endDate, i18n.language) : '—',
          });

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
          isSaving={updateGeneralInfo.isPending}
          onSubmit={(values) => updateGeneralInfo.mutate(values)}
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
          onAdd={(values) => addEducation.mutate(values)}
          onRemove={(educationId) => removeEducation.mutate(educationId)}
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
          fieldOfStudyLabel={t('profile:educacion.campoEstudio.etiqueta')}
          fieldOfStudyPlaceholder={t('profile:educacion.campoEstudio.placeholder')}
          institutionLabel={t('profile:educacion.institucion.etiqueta')}
          institutionPlaceholder={t('profile:educacion.institucion.placeholder')}
          institutionErrorRequired={t('profile:educacion.institucion.errorRequerido')}
          startDateLabel={t('profile:educacion.fechaInicio.etiqueta')}
          startDateErrorRequired={t('profile:educacion.fechaInicio.errorRequerido')}
          endDateLabel={t('profile:educacion.fechaFin.etiqueta')}
          endDateErrorBeforeStart={t('profile:educacion.fechaFin.errorAnterior')}
          inProgressLabel={t('profile:educacion.enCurso')}
          addButtonLabel={t('profile:educacion.agregar')}
          addingButtonLabel={t('profile:educacion.agregando')}
          removeItemLabel={(item) => t('profile:educacion.eliminar', { titulo: item.degree })}
          removingItemLabel={t('profile:educacion.eliminando')}
          formatItemPeriod={formatEducationPeriod}
          emptyStateTitle={t('profile:educacion.vacio.titulo')}
          emptyStateDescription={t('profile:educacion.vacio.descripcion')}
          addErrorMessage={
            addEducation.isError
              ? getItemErrorMessage(addEducation.error, t('profile:educacion.errorAgregar'))
              : undefined
          }
          removeErrorMessage={
            removeEducation.isError ? t('profile:educacion.errorEliminar') : undefined
          }
          confirmationMessage={
            addEducation.isSuccess ? t('profile:educacion.confirmacionAgregada') : undefined
          }
        />
      ),
    },
    {
      id: 'work-experience',
      label: t('profile:experiencia.titulo'),
      status: sectionStatuses['work-experience'],
      content: (
        <WorkExperienceSection
          formId={WORK_EXPERIENCE_FORM_ID}
          items={profile.workExperience}
          onAdd={(values) => addWorkExperience.mutate(values)}
          onRemove={(workExperienceId) => removeWorkExperience.mutate(workExperienceId)}
          isAdding={addWorkExperience.isPending}
          removingId={
            removeWorkExperience.isPending ? (removeWorkExperience.variables ?? null) : null
          }
          showSectionTitle={isDesktop}
          sectionTitle={t('profile:experiencia.titulo')}
          positionLabel={t('profile:experiencia.cargo.etiqueta')}
          positionPlaceholder={t('profile:experiencia.cargo.placeholder')}
          positionErrorRequired={t('profile:experiencia.cargo.errorRequerido')}
          companyLabel={t('profile:experiencia.empresa.etiqueta')}
          companyPlaceholder={t('profile:experiencia.empresa.placeholder')}
          companyErrorRequired={t('profile:experiencia.empresa.errorRequerido')}
          startDateLabel={t('profile:experiencia.fechaInicio.etiqueta')}
          startDateErrorRequired={t('profile:experiencia.fechaInicio.errorRequerido')}
          endDateLabel={t('profile:experiencia.fechaFin.etiqueta')}
          endDateErrorRequired={t('profile:experiencia.fechaFin.errorRequerido')}
          endDateErrorBeforeStart={t('profile:experiencia.fechaFin.errorAnterior')}
          currentJobLabel={t('profile:experiencia.actual')}
          unknownEndLabel={t('profile:experiencia.finDesconocido')}
          descriptionLabel={t('profile:experiencia.descripcion.etiqueta')}
          descriptionPlaceholder={t('profile:experiencia.descripcion.placeholder')}
          descriptionCounterLabel={(count, max) =>
            t('profile:experiencia.descripcion.contador', { count, max })
          }
          addButtonLabel={t('profile:experiencia.agregar')}
          addingButtonLabel={t('profile:experiencia.agregando')}
          removeItemLabel={(item) => t('profile:experiencia.eliminar', { cargo: item.position })}
          removingItemLabel={t('profile:experiencia.eliminando')}
          formatItemPeriod={formatWorkExperiencePeriod}
          emptyStateTitle={t('profile:experiencia.vacio.titulo')}
          emptyStateDescription={t('profile:experiencia.vacio.descripcion')}
          addErrorMessage={
            addWorkExperience.isError
              ? getItemErrorMessage(addWorkExperience.error, t('profile:experiencia.errorAgregar'))
              : undefined
          }
          removeErrorMessage={
            removeWorkExperience.isError ? t('profile:experiencia.errorEliminar') : undefined
          }
          confirmationMessage={
            addWorkExperience.isSuccess ? t('profile:experiencia.confirmacionAgregada') : undefined
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

      {updateGeneralInfo.isSuccess ? (
        <AlertInline variant="success">{t('profile:general.confirmacionGuardado')}</AlertInline>
      ) : null}

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
        isFinishDisabled
        finishDisabledHint={t('profile:formulario.finalizarBloqueado')}
      />
    </div>
  );
}
