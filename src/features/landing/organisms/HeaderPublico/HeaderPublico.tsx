/**
 * Header de la Landing pública (Figma `header-publico`, nodos `67:3` lg /
 * `69:64` sm). Reflow real de grupos, no solo de layout: en `sm` los dos
 * botones bajan a una segunda fila al 50% cada uno; en `lg` se unen al
 * `LanguageSwitcher` en una sola fila a la derecha del logo (`SPEC.md`
 * §3.1). Se renderizan ambas agrupaciones y se alternan con `lg:hidden`/
 * `hidden lg:flex`, el mismo patrón que ya usa `AppShell` para
 * `NavHeader`/`TabBar`.
 *
 * **Fijo y transparente (CM-329, `SPEC.md` §3.7).** Queda pegado arriba al
 * hacer scroll, sobre un fondo translúcido con desenfoque para que el
 * contenido se intuya debajo. En reposo no tiene borde; en cuanto la página
 * baja (`useScrolledPast`) se asienta con borde sutil y `elevation-1`. En
 * `sm`, al bajar, la fila de botones se pliega para que el header no ocupe
 * un tercio de la pantalla del teléfono: el hero y el cierre ya ofrecen
 * «Crear cuenta», y la fila vuelve al regresar arriba. Mientras está
 * plegada lleva `inert`, así que tampoco se alcanza con el teclado.
 *
 * Punto de corte `lg` (1024px), no `md` (600px): ver `SPEC.md` §3.1.
 *
 * "Iniciar sesión" reutiliza `Button variant="secondary"` con el color de
 * texto `text-brand-base` que dibuja Figma para este botón específico.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Button } from '@/design-system/atoms/Button';
import { Logo } from '@/design-system/atoms/Logo';
import { LanguageSwitcher } from '@/design-system/organisms/LanguageSwitcher';
import { cn } from '@/utils/cn';
import { useScrolledPast } from '../../hooks/useScrolledPast';

export function HeaderPublico() {
  const { t, i18n } = useTranslation(['landing', 'common']);
  const navigate = useNavigate();
  const scrolled = useScrolledPast();

  const wordmarkLabel = t('common:marca.nombre');
  const language: 'es' | 'en' = i18n.language === 'en' ? 'en' : 'es';

  function handleLanguageChange(next: 'es' | 'en') {
    void i18n.changeLanguage(next === 'en' ? 'en' : 'es-CO');
  }

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-[var(--duration-smooth)]',
        scrolled
          ? 'bg-bg-canvas/90 border-border-subtle shadow-elevation-1'
          : 'bg-bg-canvas/60 border-transparent',
      )}
    >
      <div className="p-space-4 flex flex-col lg:hidden">
        <div className="flex items-center justify-between">
          <Logo variant="lockup" tone="default" wordmarkLabel={wordmarkLabel} />
          <LanguageSwitcher
            value={language}
            onChange={handleLanguageChange}
            label={t('landing:header.idiomaInterfaz')}
          />
        </div>
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity,margin] duration-[var(--duration-smooth)] ease-[var(--token-ease-out)]',
            scrolled ? 'mt-0 grid-rows-[0fr] opacity-0' : 'mt-space-3 grid-rows-[1fr] opacity-100',
          )}
          inert={scrolled}
        >
          <div className="gap-space-2 flex overflow-hidden">
            <Button
              variant="secondary"
              className="text-brand-base flex-1"
              onClick={() => void navigate(ROUTES.ingresar)}
            >
              {t('landing:cta.iniciarSesion')}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => void navigate(ROUTES.registro)}
            >
              {t('landing:cta.crearCuenta')}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-space-6 mx-auto hidden h-[72px] max-w-[90rem] items-center justify-between lg:flex">
        <Logo variant="lockup" tone="default" wordmarkLabel={wordmarkLabel} />
        <div className="gap-space-4 flex items-center">
          <LanguageSwitcher
            value={language}
            onChange={handleLanguageChange}
            label={t('landing:header.idiomaInterfaz')}
          />
          <Button
            variant="secondary"
            className="text-brand-base hover:border-brand-base"
            onClick={() => void navigate(ROUTES.ingresar)}
          >
            {t('landing:cta.iniciarSesion')}
          </Button>
          <Button variant="primary" onClick={() => void navigate(ROUTES.registro)}>
            {t('landing:cta.crearCuenta')}
          </Button>
        </div>
      </div>
    </header>
  );
}
