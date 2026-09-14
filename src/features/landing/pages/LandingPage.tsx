/** Placeholder de PRT-00.01 — sin HU en el backlog todavía (ARCHITECTURE.md, riesgo #1). */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/design-system/molecules/EmptyState';

export function LandingPage() {
  const { t } = useTranslation('common');
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <EmptyState
        title={t('pendiente.titulo', { ticket: 'sin HU' })}
        description={t('pendiente.descripcion', { prt: 'PRT-00.01' })}
      />
    </div>
  );
}
