/**
 * Header de la Landing pública (Figma `header-publico`, nodos `67:3` lg /
 * `69:64` sm). Reflow real de grupos, no solo de layout: en `sm` los dos
 * botones bajan a una segunda fila al 50% cada uno; en `lg` se unen al
 * `LanguageSwitcher` en una sola fila a la derecha del logo (`SPEC.md`
 * §3.1). Se renderizan ambas agrupaciones y se alternan con `lg:hidden`/
 * `hidden lg:flex`, el mismo patrón que ya usa `AppShell` para
 * `NavHeader`/`TabBar` — no hay forma de lograr este reflow con un único
 * árbol vía solo utilidades de orden.
 *
 * Punto de corte `lg` (1024px), no `md` (600px): ver `SPEC.md` §3.1, el
 * layout `lg` usa anchos fijos de escritorio que desbordarían por debajo de
 * 1024px.
 *
 * "Iniciar sesión" reutiliza `Button variant="secondary"` (mismo borde que
 * Figma, `--border-strong` ya es `--neutral-300`) con un override puntual de
 * color de texto a `text-brand-base`: el secundario por defecto pinta
 * `text-primary`, pero Figma usa `brand/base` para este botón específico
 * (verificado contra `semantic.css`, no es un valor inventado).
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Logo } from '@/design-system/atoms/Logo';
import { Button } from '@/design-system/atoms/Button';
import { LanguageSwitcher } from '@/design-system/organisms/LanguageSwitcher';

export function HeaderPublico() {
  const { t, i18n } = useTranslation(['landing', 'common']);
  const navigate = useNavigate();

  const wordmarkLabel = t('common:marca.nombre');
  const language: 'es' | 'en' = i18n.language === 'en' ? 'en' : 'es';

  function handleLanguageChange(next: 'es' | 'en') {
    void i18n.changeLanguage(next === 'en' ? 'en' : 'es-CO');
  }

  return (
    <header className="bg-bg-surface border-border-subtle border-b">
      <div className="gap-space-3 p-space-4 flex flex-col lg:hidden">
        <div className="flex items-center justify-between">
          <Logo variant="lockup" tone="default" wordmarkLabel={wordmarkLabel} />
          <LanguageSwitcher
            value={language}
            onChange={handleLanguageChange}
            label={t('landing:header.idiomaInterfaz')}
          />
        </div>
        <div className="gap-space-2 flex">
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

      <div className="px-space-6 hidden h-[72px] items-center justify-between lg:flex">
        <Logo variant="lockup" tone="default" wordmarkLabel={wordmarkLabel} />
        <div className="gap-space-4 flex items-center">
          <LanguageSwitcher
            value={language}
            onChange={handleLanguageChange}
            label={t('landing:header.idiomaInterfaz')}
          />
          <Button
            variant="secondary"
            className="text-brand-base"
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
