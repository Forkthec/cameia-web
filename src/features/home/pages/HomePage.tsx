/** Placeholder de PRT-00.02 — dashboard autenticado, sin HU en el backlog todavía. */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';

export function HomePage() {
  const { t } = useTranslation('common');
  return (
    <EmptyState
      title={t('pendiente.titulo', { ticket: 'sin HU' })}
      description={t('pendiente.descripcion', { prt: 'PRT-00.02' })}
    />
  );
}
