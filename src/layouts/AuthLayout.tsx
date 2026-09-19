/**
 * Plantilla de las pantallas públicas de autenticación (`PRT-01.*`).
 *
 * Reconstruida para CM-40 contra el diseño real de Figma (`PRT-01.03 · Login`,
 * nodos `94:1124` lg y `97:1272` sm) — la versión anterior era un simple
 * contenedor centrado de una columna que nunca coincidió con el mock. Ver
 * `SPEC.md` §3/§9 de `features/auth` para el detalle de la discrepancia.
 *
 * Dos columnas de 50% a partir de `lg:` (1024px): un panel de marca oscuro
 * (logo + marca de agua + titular) y la columna del formulario. Por debajo de
 * `lg:` el panel de marca no existe — Figma no define un frame `md`
 * intermedio para esta pantalla (decisión de Frontend documentada en
 * `SPEC.md` §3) — y el logo se muestra centrado, en tono oscuro, arriba de
 * `children`.
 *
 * **Volver a la landing** (auth, seguimiento): ni `94:1124` ni el frame de
 * Registro dibujan ninguna forma de volver a `/` — verificado en vivo, no es
 * una omisión de implementación. Se agrega por decisión de Frontend
 * (`CLAUDE.md` §16, anotada en `SPEC.md` §9): el logo enlaza a
 * `ROUTES.landing` (mismo carve-out de `boundaries/dependencies` que ya usa
 * `AppShell.tsx` para su wordmark → `ROUTES.inicio`) y se agrega además un
 * enlace de texto explícito, más descubrible que el logo solo.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Logo } from '@/design-system/atoms/Logo';
import { Icon } from '@/design-system/icons/Icon';

interface AuthLayoutProps {
  children: ReactNode;
  /**
   * Titular del panel de marca (solo visible en `lg:` y superior). Opcional:
   * `RegisterPage` todavía es un placeholder sin copy propio (CM-34, fuera de
   * alcance de esta iteración) y sigue envuelto en este mismo layout.
   */
  headline?: string;
}

export function AuthLayout({ children, headline }: AuthLayoutProps) {
  const { t } = useTranslation('common');
  const wordmarkLabel = t('marca.nombre');

  return (
    <div className="bg-bg-canvas flex min-h-dvh">
      <div className="bg-brand-base p-space-8 relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Logo
            variant="mark-only"
            tone="inverse"
            wordmarkLabel={wordmarkLabel}
            className="w-[55%] opacity-8"
          />
        </div>
        <Link
          to={ROUTES.landing}
          className="focus-visible:shadow-focus-ring relative rounded-sm focus-visible:outline-none"
        >
          <Logo variant="lockup" tone="inverse" wordmarkLabel={wordmarkLabel} />
        </Link>
        {headline ? (
          <p className="text-display font-display text-text-on-inverse relative">{headline}</p>
        ) : null}
      </div>

      <div className="px-space-4 py-space-8 flex flex-1 flex-col items-center">
        <div className="gap-space-5 flex w-full max-w-[27.5rem] flex-col">
          <Link
            to={ROUTES.landing}
            className="text-text-muted hover:text-text-primary gap-space-1 text-small focus-visible:shadow-focus-ring inline-flex w-fit items-center self-start rounded-sm focus-visible:outline-none"
          >
            <Icon name="chevron-left" size={16} />
            {t('acciones.volverInicio')}
          </Link>
          <Link
            to={ROUTES.landing}
            className="focus-visible:shadow-focus-ring rounded-sm focus-visible:outline-none lg:hidden"
          >
            <Logo
              variant="lockup"
              tone="default"
              wordmarkLabel={wordmarkLabel}
              className="justify-center"
            />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
