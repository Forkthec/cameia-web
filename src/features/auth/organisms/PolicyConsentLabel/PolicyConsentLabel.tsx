/**
 * Texto de la casilla de aceptación (CA-1.1.44; aviso de Backend del
 * 14-11-2026, 3.4): una sola casilla que acepta los términos, la política y el
 * envío de datos fuera de Colombia, con enlaces a las dos páginas en otra
 * pestaña. Lo comparten el registro y el aviso de política nueva.
 */
import { Trans } from 'react-i18next';
import { ROUTES } from '@/app/router/routes';

const LINK_CLASS = 'text-action-primary underline underline-offset-2';

export function PolicyConsentLabel() {
  return (
    <Trans
      i18nKey="auth:registro.politica.acepto"
      components={{
        terminos: (
          // eslint-disable-next-line jsx-a11y/anchor-has-content -- Trans pone el texto
          <a
            href={ROUTES.terminos}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          />
        ),
        politica: (
          // eslint-disable-next-line jsx-a11y/anchor-has-content -- Trans pone el texto
          <a
            href={ROUTES.politicaDatos}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          />
        ),
      }}
    />
  );
}
