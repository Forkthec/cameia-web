/**
 * Placeholder de CM-31 · PRT-05.08 · PRT-05.10 — chat de turno, Entreno y
 * Simulación. Igual que `StartingSessionPage`, escribe los tokens
 * "on-inverse" directamente en vez de `EmptyState` (pensado para fondo claro).
 */
import { useTranslation } from 'react-i18next';

export function InterviewSessionPage() {
  const { t } = useTranslation('common');
  return (
    <div className="gap-space-2 flex min-h-dvh flex-col items-center justify-center text-center">
      <p className="text-body text-text-on-inverse font-semibold">
        {t('pendiente.titulo', { ticket: 'CM-31' })}
      </p>
      <p className="text-small text-text-on-inverse/70">
        {t('pendiente.descripcion', { prt: 'PRT-05.08, PRT-05.10' })}
      </p>
    </div>
  );
}
