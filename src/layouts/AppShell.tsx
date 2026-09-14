/**
 * Plantilla del área autenticada: NavHeader en escritorio, TabBar en móvil
 * (ambos organismos alternan por breakpoint con CSS, ver
 * design-system/organisms). Renderiza <Outlet/> para las rutas hijas — se usa
 * como layout-route en app/router/index.tsx, no recibe `children` por prop.
 *
 * Los 3 `to` de `items` siguen duplicados a propósito: `layouts` no puede
 * importar de `app/` en general (docs/ARCHITECTURE.md §4), mismo patrón que
 * ya usa `stores/uiPreferences.store.ts` con SUPPORTED_LANGUAGES. Si esas
 * rutas cambian, hay que actualizar los dos sitios. El wordmark de abajo es
 * la única excepción: usa `ROUTES.inicio` a través de un carve-out puntual
 * de la matriz de fronteras (CM-46, `eslint.config.js`, elemento
 * "app-routes") que aísla exclusivamente `src/app/router/routes.ts` —no el
 * resto de `app`—, porque es un módulo hoja sin imports propios.
 *
 * `progressEnabled` llega por prop en vez de leerse de `config/features.ts`
 * aquí mismo: `eslint-plugin-boundaries` solo deja que `layouts` importe
 * `hooks`/`stores`, nunca `config` — ni siquiera indirectamente a través de
 * un hook propio (un hook que importe `config` tampoco lo permite la matriz,
 * verificado con `pnpm lint`). Quien renderiza `<AppShell/>`
 * (`app/router/index.tsx`, capa `app`, sin restricciones) sí puede leer el
 * flag y pasarlo.
 *
 * Wordmark "cameia" en el `<header>`, fuera de `NavHeader` (que solo se
 * muestra desde `md`): sin él, la cabecera queda vacía en móvil, donde
 * `NavHeader` está oculto (`hidden md:flex`). El frame de Figma PRT-02.02
 * (`121:184` en sm, `191:500` en lg) dibuja un logotipo compuesto de glifo
 * vectorial + wordmark; aquí solo se reproduce el wordmark, en texto, porque
 * el glifo es un activo de marca que no existe todavía en `design-system` —
 * inventarlo a mano no es una opción. Se completa cuando exista el SVG
 * oficial, sin rehacer esta cabecera (SPEC professional-profile §9). Sin
 * avatar ni menú de usuario: son controles y no existe todavía el flujo de
 * cuenta ni de cierre de sesión.
 */
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { NavHeader, type NavItem } from '@/design-system/organisms/NavHeader';
import { TabBar } from '@/design-system/organisms/TabBar';

interface AppShellProps {
  progressEnabled?: boolean;
}

/**
 * Identificador de marca, no copia traducible: "cameia" es el nombre del
 * producto, no un texto que cambie según el idioma de la interfaz. Única
 * excepción vigente a CLAUDE.md §3.2 (ningún texto visible en el código),
 * anotada en SPEC professional-profile §9.
 */
const BRAND_WORDMARK = 'cameia';

export function AppShell({ progressEnabled = false }: AppShellProps) {
  const { t } = useTranslation('common');

  const items: NavItem[] = [
    { to: '/inicio', label: t('navegacion.inicio'), icon: 'home' },
    { to: '/entrenar/nueva', label: t('navegacion.entrenar'), icon: 'dumbbell' },
    {
      label: t('navegacion.progreso'),
      icon: 'chart',
      // HE-07 no existe todavía (CLAUDE.md §11): sin ruta propia, deshabilitado.
      disabled: !progressEnabled,
    },
    // Sin HU de "lista de perfiles" en el backlog todavía: enlaza al único
    // punto de entrada que sí existe (CM-46).
    { to: '/perfiles/nuevo', label: t('navegacion.perfiles'), icon: 'user' },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-border-subtle bg-bg-surface px-space-5 py-space-3 gap-space-4 flex items-center justify-between border-b">
        <Link to={ROUTES.inicio} className="font-display text-h3 text-text-primary font-extrabold">
          {BRAND_WORDMARK}
        </Link>
        <NavHeader items={items} label={t('navegacion.principal')} />
      </header>
      <main className="p-space-5 pb-space-8 md:pb-space-5">
        <Outlet />
      </main>
      <TabBar items={items} label={t('navegacion.principal')} />
    </div>
  );
}
