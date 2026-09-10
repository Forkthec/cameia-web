/**
 * Placeholder de CM-89 · CM-93 · PRT-04.11 — pantalla de espera y error de la
 * transición. No usa `EmptyState`: sus tokens de texto asumen fondo claro
 * (`text-text-primary`/`text-text-muted`) y esta pantalla vive sobre
 * `SessionLayout` (`bg-bg-inverse`), así que el texto se escribe con los
 * tokens "on-inverse" directamente.
 */
import { useTranslation } from 'react-i18next';
import { SessionLayout } from '@/layouts/SessionLayout';

export function StartingSessionPage() {
  const { t } = useTranslation('common');
  return (
    <SessionLayout>
      <div className="gap-space-2 flex min-h-dvh flex-col items-center justify-center text-center">
        <p className="text-body text-text-on-inverse font-semibold">
          {t('pendiente.titulo', { ticket: 'CM-89 · CM-93' })}
        </p>
        <p className="text-small text-text-on-inverse/70">
          {t('pendiente.descripcion', { prt: 'PRT-04.11' })}
        </p>
      </div>
    </SessionLayout>
  );
}
