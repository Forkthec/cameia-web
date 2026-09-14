/**
 * `/perfiles/:id/editar` (paso 1 de 3) — Información General (HU-2.3,
 * PRT-02.03, CM-53). Los pasos 2 y 3 (CM-61, CM-65) siguen sin dueño:
 * este archivo solo resuelve el paso `current`, con los otros dos como
 * `upcoming` fijos, sin máquina de pasos ni navegación entre ellos
 * (SPEC.md §9 — decisión de alcance, no una limitación técnica).
 *
 * El botón primario del `WizardLayout` (§ "Guardar borrador", CA-2.3.1) se
 * conecta al `<form>` de `GeneralInfoForm` por `primaryActionFormId`, así
 * que el envío siempre pasa por la validación de `react-hook-form` antes
 * de llegar a la mutación.
 */
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { WizardLayout } from '@/layouts/WizardLayout';
import { Spinner } from '@/design-system/atoms/Spinner';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { ApiError } from '@/services/http/ApiError';
import { useProfileQuery } from '../hooks/useProfileQuery';
import { useUpdateProfileGeneralInfo } from '../hooks/useUpdateProfileGeneralInfo';
import { GeneralInfoForm } from '../organisms/GeneralInfoForm';

const GENERAL_INFO_FORM_ID = 'general-info-form';

/**
 * CA-2.3.5 mapea al mismo código que la creación (CM-46): el mock reutiliza
 * `PROFILE_NAME_INVALID` para ambos casos. Fallo de red (sin `ApiError`,
 * p. ej. timeout) cae en `errors:red`; cualquier otro `ApiError` en
 * `errors:generico`.
 */
function resolveErrorMessage(
  error: unknown,
  t: (key: string) => string,
  notFoundKey = 'errors:codigos.NOT_FOUND',
): string {
  if (error instanceof ApiError && error.code === 'NOT_FOUND') return t(notFoundKey);
  if (error instanceof ApiError && error.code === 'PROFILE_NAME_INVALID') {
    return t('errors:codigos.PROFILE_NAME_INVALID');
  }
  if (error instanceof ApiError) return t('errors:generico');
  return t('errors:red');
}

export function EditProfilePage() {
  const { t } = useTranslation(['profile', 'common', 'errors']);
  const { id } = useParams<{ id: string }>();
  // La ruta ya declara `:id` como segmento obligatorio (routes.tsx) — si
  // llega vacío es un error de enrutamiento, no un estado a manejar aquí.
  const profileId = id ?? '';

  const profileQuery = useProfileQuery(profileId);
  const updateGeneralInfo = useUpdateProfileGeneralInfo(profileId);

  const steps = [
    { label: t('profile:informacionGeneral.titulo'), status: 'current' as const },
    { label: t('profile:experiencia.titulo'), status: 'upcoming' as const },
    { label: t('profile:habilidades.titulo'), status: 'upcoming' as const },
  ];

  return (
    <WizardLayout
      steps={steps}
      stepsLabel={t('profile:asistente.progreso')}
      primaryActionLabel={t('profile:general.guardarBorrador')}
      primaryActionFormId={GENERAL_INFO_FORM_ID}
      primaryActionLoading={updateGeneralInfo.isPending}
      primaryActionLoadingLabel={t('profile:general.guardandoBorrador')}
      primaryActionDisabled={!profileQuery.data}
    >
      {profileQuery.isPending ? (
        <Spinner label={t('common:estados.cargando')} />
      ) : profileQuery.isError ? (
        <AlertInline variant="error">{resolveErrorMessage(profileQuery.error, t)}</AlertInline>
      ) : (
        <div className="gap-space-4 flex flex-col">
          {updateGeneralInfo.isSuccess ? (
            <AlertInline variant="success">{t('profile:general.confirmacionGuardado')}</AlertInline>
          ) : null}
          {updateGeneralInfo.isError ? (
            <AlertInline variant="error">
              {resolveErrorMessage(updateGeneralInfo.error, t)}
            </AlertInline>
          ) : null}
          <GeneralInfoForm
            formId={GENERAL_INFO_FORM_ID}
            name={profileQuery.data.name}
            summary={profileQuery.data.summary}
            isSaving={updateGeneralInfo.isPending}
            onSubmit={(values) => updateGeneralInfo.mutate(values)}
            nameLabel={t('profile:general.nombre.etiqueta')}
            nameErrorRequired={t('profile:general.nombre.errorRequerido')}
            nameErrorTooLong={t('profile:general.nombre.errorLongitud')}
            summaryLabel={t('profile:general.resumen.etiqueta')}
            summaryHelperText={t('profile:general.resumen.ayuda')}
            summaryErrorTooLong={t('profile:general.resumen.errorLongitud')}
            summaryCounterLabel={(count, max) =>
              t('profile:general.resumen.contador', { count, max })
            }
          />
        </div>
      )}
    </WizardLayout>
  );
}
