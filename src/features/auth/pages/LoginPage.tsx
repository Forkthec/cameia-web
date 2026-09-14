/** Placeholder de CM-40 · PRT-01.03 — inicio de sesión con Firebase Auth. */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';

export function LoginPage() {
  const { t } = useTranslation('common');
  return (
    <EmptyState
      title={t('pendiente.titulo', { ticket: 'CM-40' })}
      description={t('pendiente.descripcion', { prt: 'PRT-01.03' })}
    />
  );
}
