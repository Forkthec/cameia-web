/** Placeholder de CM-69 · PRT-02.07 — gestión de roles objetivo del perfil. */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';

export function ProfileRolesPage() {
  const { t } = useTranslation('common');
  return (
    <EmptyState
      title={t('pendiente.titulo', { ticket: 'CM-69' })}
      description={t('pendiente.descripcion', { prt: 'PRT-02.07' })}
    />
  );
}
