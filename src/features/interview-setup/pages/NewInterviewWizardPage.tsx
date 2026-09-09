/**
 * Placeholder de CM-80 · CM-84 · CM-85 — los 3 pasos del asistente comparten
 * esta ruta, ya nombrados en CLAUDE.md §11.
 */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { WizardLayout } from '@/layouts/WizardLayout';

export function NewInterviewWizardPage() {
  const { t } = useTranslation(['interview', 'common']);
  return (
    <WizardLayout
      steps={[
        { label: t('interview:asistente.pasos.ofertaYRol'), status: 'current' },
        { label: t('interview:asistente.pasos.modoYTono'), status: 'upcoming' },
        { label: t('interview:asistente.pasos.idiomaYFormato'), status: 'upcoming' },
      ]}
      stepsLabel={t('interview:asistente.progreso')}
      primaryActionLabel={t('common:acciones.continuar')}
      onPrimaryAction={() => {}}
      primaryActionDisabled
    >
      <EmptyState
        title={t('common:pendiente.titulo', { ticket: 'CM-80 · CM-84 · CM-85' })}
        description={t('common:pendiente.descripcion', {
          prt: 'PRT-04.02, 04.03, 04.06, 04.07, 04.09',
        })}
      />
    </WizardLayout>
  );
}
