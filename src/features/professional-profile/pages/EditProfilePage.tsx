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
 * borrador que guardar (decisión D-C). "Finalizar y Continuar" (CM-65) ya
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
 */
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { Button } from '@/design-system/atoms/Button';
import { Spinner } from '@/design-system/atoms/Spinner';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ApiError } from '@/services/http/ApiError';
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
  GENERAL_INFO_FORM_ID,
  PROFILE_COMPLETENESS_MAX,
  SKILLS_FORM_ID,
  WORK_EXPERIENCE_FORM_ID,
} from '../model/profile.constants';
import { getMissingRequirementFields } from '../model/missingRequirements';
import { getCompletenessValue, getSectionStatuses } from '../model/profileCompleteness';
import type { EducationItem, WorkExperienceItem } from '../model/profile.types';
import { formatYearMonth } from '../model/yearMonth';
import { EducationSection } from '../organisms/EducationSection';
import { GeneralInfoForm } from '../organisms/GeneralInfoForm';
import { ProfileActionsBar } from '../organisms/ProfileActionsBar';
import { ProfileSectionsLayout, type ProfileSection } from '../organisms/ProfileSectionsLayout';
import { SkillsSection } from '../organisms/SkillsSection';
import { TargetRolesSection } from '../organisms/TargetRolesSection';
import { WorkExperienceSection } from '../organisms/WorkExperienceSection';

export function EditProfilePage() {
  const { id } = useParams<{ id: string }>();
  const profileId = id as string;
  const { t, i18n } = useTranslation(['profile', 'common', 'errors']);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

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
        ? error.httpStatus === 404
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
   * Prefiere el mensaje específico de `httpStatus` cuando quien llama lo
   * tiene en `byStatus`, y cae al mensaje genérico de la sección cuando no
   * (`ADR-0007`: ya no hay `code` propio del backend — cada mutación conoce
   * de antemano qué `httpStatus` puede devolver y qué significa cada uno,
   * porque los confirma `ProfileController.java`, no un catálogo compartido).
   */
  function getItemErrorMessage(
    error: unknown,
    fallback: string,
    byStatus: Record<number, string> = {},
  ): string {
    const specific = error instanceof ApiError ? byStatus[error.httpStatus] : undefined;
    return specific ?? fallback;
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
              ? getItemErrorMessage(addEducation.error, t('profile:educacion.errorAgregar'), {
                  422: t('profile:educacion.errorFechaInvalida'),
                })
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
              ? getItemErrorMessage(
                  addWorkExperience.error,
                  t('profile:experiencia.errorAgregar'),
                  { 422: t('profile:experiencia.errorFechaInvalida') },
                )
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
          removeItemLabel={(item) => t('profile:habilidades.quitar', { nombre: item.skillName })}
          emptyStateTitle={t('profile:habilidades.vacio.titulo')}
          emptyStateDescription={t('profile:habilidades.vacio.descripcion')}
          addErrorMessage={
            addSkill.isError
              ? getItemErrorMessage(addSkill.error, t('profile:habilidades.errorAgregar'), {
                  409: t('profile:habilidades.nombre.errorDuplicado'),
                })
              : undefined
          }
          removeErrorMessage={
            removeSkill.isError ? t('profile:habilidades.errorEliminar') : undefined
          }
          confirmationMessage={
            addSkill.isSuccess ? t('profile:habilidades.confirmacionAgregada') : undefined
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
                  422: t('profile:rolesObjetivo.agregar.tope'),
                  409: t('profile:rolesObjetivo.errorDuplicado'),
                })
              : undefined
          }
          substituteErrorMessage={
            substituteTargetRole.isError
              ? getItemErrorMessage(
                  substituteTargetRole.error,
                  t('profile:rolesObjetivo.errorSustituir'),
                  { 409: t('profile:rolesObjetivo.errorDuplicado') },
                )
              : undefined
          }
          removeErrorMessage={
            removeTargetRole.isError
              ? getItemErrorMessage(
                  removeTargetRole.error,
                  t('profile:rolesObjetivo.errorEliminar'),
                  { 422: t('profile:rolesObjetivo.eliminarUltimoBloqueado') },
                )
              : undefined
          }
          confirmationMessage={
            addTargetRole.isSuccess ? t('profile:rolesObjetivo.confirmacionAgregado') : undefined
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

      {finalizeProfile.isSuccess ? (
        <AlertInline variant="success">
          {t('profile:formulario.confirmacionFinalizado')}
        </AlertInline>
      ) : null}
      {finalizeProfile.isError
        ? (() => {
            const missingLabels = getMissingRequirementsLabels(finalizeProfile.error);
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
        finishDisabledHint={t('profile:formulario.finalizarBloqueado')}
        isFinalizing={finalizeProfile.isPending}
        finalizingLabel={t('profile:formulario.finalizando')}
      />
    </div>
  );
}
