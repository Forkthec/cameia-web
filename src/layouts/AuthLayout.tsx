/**
 * Plantilla de las pantallas públicas de autenticación (`PRT-01.*`).
 *
 * Reconstruida para CM-40 contra el diseño real de Figma (`PRT-01.03 · Login`,
 * nodos `94:1124` lg y `97:1272` sm). Dos columnas de 50% a partir de `lg:`
 * (1024px): un panel de marca oscuro y la columna del formulario.
 *
 * **Dirección «Amanecer» (CM-329, `features/auth/SPEC.md` §3.8).** Solo
 * cambia la presentación; la estructura de dos columnas, los enlaces y el
 * contenido que recibe siguen igual:
 * - El panel de marca usa la misma escena que la landing: índigo profundo,
 *   el sol del logo, la joroba como marca de agua y el lema como eyebrow.
 * - Es **un solo elemento** que cambia de forma por breakpoint: en `lg` es la
 *   columna izquierda a pantalla completa (fija mientras el formulario hace
 *   scroll); por debajo de `lg` es una banda compacta arriba del formulario,
 *   con el borde inferior en curva. Así el logo y el titular existen una sola
 *   vez en el DOM.
 * - `highlights` (opcional) se muestra solo en `lg`: contenido extra del
 *   panel que la página decide (Registro lo usa para sus beneficios).
 * - La columna del formulario ocupa el alto restante de la pantalla y su
 *   contenido crece (`flex-1`), para que los formularios puedan llevar su
 *   bloque de acción al fondo en móvil sin dejar huecos en blanco.
 *
 * **Volver a la landing** (auth, seguimiento): ni `94:1124` ni el frame de
 * Registro dibujan ninguna forma de volver a `/`. Se agrega por decisión de
 * Frontend (`CLAUDE.md` §16, anotada en `SPEC.md` §9): el logo enlaza a
 * `ROUTES.landing` y se agrega además un enlace de texto explícito.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Eyebrow } from '@/design-system/atoms/Eyebrow';
import { Logo } from '@/design-system/atoms/Logo';
import { Icon } from '@/design-system/icons/Icon';

interface AuthLayoutProps {
  children: ReactNode;
  /** Titular del panel de marca. Opcional: sin él, el panel solo muestra el logo y el lema. */
  headline?: string;
  /** Contenido extra del panel de marca, visible solo en `lg` (p. ej. beneficios en Registro). */
  highlights?: ReactNode;
}

export function AuthLayout({ children, headline, highlights }: AuthLayoutProps) {
  const { t } = useTranslation('common');
  const wordmarkLabel = t('marca.nombre');

  return (
    <div className="bg-bg-canvas flex min-h-dvh flex-col lg:flex-row">
      <aside className="text-text-on-inverse px-space-4 pt-space-5 pb-space-8 lg:p-space-8 bg-brand-surface relative shrink-0 overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-1/2 lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="bg-brand-glow pointer-events-none absolute -top-[25%] -right-[25%] aspect-square w-[70%] rounded-full lg:w-[90%]"
        />
        <div
          aria-hidden="true"
          className="animate-sun-rise bg-brand-sun pointer-events-none absolute -top-12 -right-10 aspect-square w-36 rounded-full lg:-top-24 lg:-right-24 lg:w-[21rem]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[10%] -left-[12%] w-[70%] opacity-[0.07] lg:w-[95%]"
        >
          <Logo variant="mark-only" tone="inverse" wordmarkLabel={wordmarkLabel} />
        </div>

        <Link
          to={ROUTES.landing}
          aria-label={wordmarkLabel}
          className="focus-visible:shadow-focus-ring relative inline-flex w-fit rounded-sm focus-visible:outline-none"
        >
          <Logo
            variant="lockup"
            tone="inverse"
            wordmarkLabel={wordmarkLabel}
            className="[--logo-seam:var(--brand-deep)]"
          />
        </Link>

        <div className="mt-space-5 relative lg:mt-0">
          <Eyebrow tone="inverse" className="mb-space-3 lg:mb-space-5">
            {t('marca.lema')}
          </Eyebrow>
          {headline ? (
            <p className="text-h1 lg:text-display font-display animate-enter-up max-w-[14em] lg:max-w-[11em]">
              {headline}
            </p>
          ) : null}
          {highlights ? <div className="mt-space-7 hidden lg:block">{highlights}</div> : null}
        </div>

        <span aria-hidden="true" className="hidden lg:block" />

        <svg
          aria-hidden="true"
          viewBox="0 0 390 30"
          preserveAspectRatio="none"
          className="absolute -bottom-px left-0 h-7 w-full lg:hidden"
        >
          <path d="M0 30 V16 C 110 0, 260 0, 390 20 V30 Z" className="fill-bg-canvas" />
        </svg>
      </aside>

      <div className="px-space-4 pt-space-3 lg:px-space-8 lg:py-space-6 flex flex-1 flex-col lg:items-center lg:justify-center">
        <div className="gap-space-5 mx-auto flex w-full max-w-[32rem] flex-1 flex-col lg:flex-none">
          <Link
            to={ROUTES.landing}
            className="text-text-muted hover:text-text-primary gap-space-1 text-small focus-visible:shadow-focus-ring inline-flex w-fit items-center self-start rounded-sm focus-visible:outline-none"
          >
            <Icon name="chevron-left" size={16} />
            {t('acciones.volverInicio')}
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
