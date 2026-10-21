/**
 * CM-213 · HU-4.5 · PRT-04.11 — «Iniciando sesión de entrevista».
 *
 * Mientras el backend prepara las 5 preguntas, la pantalla muestra la firma
 * animada de CAMEIA (`BrandReveal`, la misma de la landing) sobre el cielo
 * de madrugada del chat, el texto «Iniciando sesión de entrevista» y un
 * indicador de carga, sin controles (CA-4.5.13). Al recibir la pregunta 1
 * abre el chat (`useStartInterview`).
 *
 * Si la preparación falla: el mensaje y «Reintentar» / «Cancelar»
 * (CA-4.5.14), o solo «Cancelar» con los reintentos agotados (CA-4.5.19).
 * Sin `sessionId` en el estado de la navegación (recarga o enlace directo),
 * vuelve a «Nueva entrevista».
 */
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Button } from '@/design-system/atoms/Button';
import { Spinner } from '@/design-system/atoms/Spinner';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { BrandReveal } from '@/design-system/molecules/BrandReveal';
import { SessionLayout } from '@/layouts/SessionLayout';
import { useStartInterview, type StartError } from '../hooks/useStartInterview';

function readSessionId(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null;
  const { sessionId } = state as { sessionId?: unknown };
  return typeof sessionId === 'string' ? sessionId : null;
}

export function StartingSessionPage() {
  const location = useLocation();
  const sessionId = readSessionId(location.state);
  if (!sessionId) return <Navigate to={ROUTES.entrenarNueva} replace />;
  return (
    <SessionLayout>
      <StartingSessionView sessionId={sessionId} />
    </SessionLayout>
  );
}

const ERROR_KEYS: Record<StartError, string> = {
  generico: 'errors:generico',
  red: 'errors:red',
  noEncontrada: 'errors:codigos.NOT_FOUND',
  agotados: 'interview:inicio.reintentosAgotados',
};

function StartingSessionView({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation(['interview', 'common', 'errors']);
  const start = useStartInterview(sessionId);

  return (
    <div className="bg-brand-dawn px-space-4 gap-space-7 flex min-h-dvh flex-col items-center justify-center text-center">
      <BrandReveal
        wordmark={t('common:marca.nombre')}
        tagline={t('common:marca.lema')}
        seamClassName="[--logo-seam:var(--brand-deepest)]"
      />

      <div className="gap-space-4 flex w-full max-w-[30rem] flex-col items-center">
        <h1 className="font-display text-h2 text-text-on-inverse animate-enter-up [animation-delay:1200ms]">
          {t('interview:inicio.titulo')}
        </h1>

        {start.error ? (
          <>
            <AlertInline variant="error" className="w-full text-left">
              {t(ERROR_KEYS[start.error])}
            </AlertInline>
            <div className="gap-space-3 flex flex-wrap justify-center">
              {start.canRetry ? (
                <Button variant="primary" onClick={start.retry}>
                  {t('common:acciones.reintentar')}
                </Button>
              ) : null}
              <Button
                variant="secondary"
                className="border-text-on-inverse/30 text-text-on-inverse bg-transparent"
                onClick={start.cancel}
                {...(start.isCancelling
                  ? { loading: true as const, loadingLabel: t('common:estados.cargando') }
                  : { loading: false as const })}
              >
                {t('common:acciones.cancelar')}
              </Button>
            </div>
          </>
        ) : (
          <Spinner label={t('interview:inicio.titulo')} className="text-brand-accent-light" />
        )}
      </div>
    </div>
  );
}
