/**
 * Pie de página de la Landing pública (Figma `pie`, nodos `68:75` lg /
 * `69:163` sm). No es solo un cambio de layout: la agrupación de elementos
 * cambia entre breakpoints — en `sm`, `footer-links` solo contiene
 * "Términos"/"Privacidad" y el copyright es un párrafo aparte; en `lg`, los
 * tres viven juntos dentro de `footer-links` (`SPEC.md` §3.1). Se renderizan
 * ambas agrupaciones y se alternan con `lg:hidden`/`hidden lg:flex`, mismo
 * patrón que `HeaderPublico` y que ya usa `AppShell` para
 * `NavHeader`/`TabBar`.
 */
import { useTranslation } from 'react-i18next';
import { Logo } from '@/design-system/atoms/Logo';

export function Footer() {
  const { t } = useTranslation(['landing', 'common']);
  const wordmarkLabel = t('common:marca.nombre');

  return (
    <footer className="bg-bg-canvas">
      <div className="gap-space-3 p-space-4 py-space-5 flex flex-col items-center lg:hidden">
        <Logo variant="lockup" tone="default" size="sm" wordmarkLabel={wordmarkLabel} />
        <div className="text-small text-text-muted gap-space-4 flex">
          <span>{t('landing:pie.terminos')}</span>
          <span>{t('landing:pie.privacidad')}</span>
        </div>
        <span className="text-small text-text-muted">{t('landing:pie.copyright')}</span>
      </div>

      <div className="px-space-9 py-space-6 hidden items-center justify-between lg:flex">
        <Logo variant="lockup" tone="default" size="sm" wordmarkLabel={wordmarkLabel} />
        <div className="text-small text-text-muted gap-space-5 flex">
          <span>{t('landing:pie.terminos')}</span>
          <span>{t('landing:pie.privacidad')}</span>
          <span>{t('landing:pie.copyright')}</span>
        </div>
      </div>
    </footer>
  );
}
