/**
 * Placeholder de CM-53 · CM-61 · CM-65 — los 3 pasos del formulario de perfil
 * comparten esta misma ruta (`/perfiles/:id/editar`), tal como ya lo describe
 * CLAUDE.md §11: Información General → Experiencia laboral y educación →
 * Habilidades, expectativas y finalizar.
 */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { WizardLayout } from '@/layouts/WizardLayout';

export function EditProfilePage() {
  const { t } = useTranslation(['profile', 'common']);
  return (
    <WizardLayout
      steps={[
        { label: t('profile:informacionGeneral.titulo'), status: 'current' },
        { label: t('profile:experiencia.titulo'), status: 'upcoming' },
        { label: t('profile:habilidades.titulo'), status: 'upcoming' },
      ]}
      stepsLabel={t('profile:asistente.progreso')}
      primaryActionLabel={t('common:acciones.continuar')}
      onPrimaryAction={() => {}}
      primaryActionDisabled
    >
      <EmptyState
        title={t('common:pendiente.titulo', { ticket: 'CM-53 · CM-61 · CM-65' })}
        description={t('common:pendiente.descripcion', { prt: 'PRT-02.03' })}
      />
    </WizardLayout>
  );
}
