/** Placeholder de CM-34 · PRT-01.01 — formulario de registro con Firebase Auth. */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';

export function RegisterPage() {
  const { t } = useTranslation('common');
  return (
    <EmptyState
      title={t('pendiente.titulo', { ticket: 'CM-34' })}
      description={t('pendiente.descripcion', { prt: 'PRT-01.01' })}
    />
  );
}
