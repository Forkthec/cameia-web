/** Placeholder de CM-46 · PRT-02.02 — selección del método de configuración del perfil. */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { WizardLayout } from '@/layouts/WizardLayout';

export function NewProfilePage() {
  const { t } = useTranslation(['profile', 'common']);
  return (
    <WizardLayout
      steps={[{ label: t('profile:rolesObjetivo.titulo'), status: 'current' }]}
      stepsLabel={t('profile:asistente.progreso')}
      primaryActionLabel={t('common:acciones.continuar')}
      onPrimaryAction={() => {}}
      primaryActionDisabled
    >
      <EmptyState
        title={t('common:pendiente.titulo', { ticket: 'CM-46' })}
        description={t('common:pendiente.descripcion', { prt: 'PRT-02.02' })}
      />
    </WizardLayout>
  );
}
