/**
 * Plantilla del área autenticada: NavHeader en escritorio, TabBar en móvil
 * (ambos organismos alternan por breakpoint con CSS, ver
 * design-system/organisms). Renderiza <Outlet/> para las rutas hijas — se usa
 * como layout-route en app/router/index.tsx, no recibe `children` por prop.
 *
 * Los 4 `href` de la nav están duplicados aquí a propósito: `layouts` no
 * puede importar `app/router/routes.ts` (docs/ARCHITECTURE.md §4), mismo
 * patrón que ya usa `stores/uiPreferences.store.ts` con SUPPORTED_LANGUAGES.
 * Si esas rutas cambian, hay que actualizar los dos sitios.
 *
 * `progressEnabled` llega por prop en vez de leerse de `config/features.ts`
 * aquí mismo: `eslint-plugin-boundaries` solo deja que `layouts` importe
 * `hooks`/`stores`, nunca `config` — ni siquiera indirectamente a través de
 * un hook propio (un hook que importe `config` tampoco lo permite la matriz,
 * verificado con `pnpm lint`). Quien renderiza `<AppShell/>`
 * (`app/router/index.tsx`, capa `app`, sin restricciones) sí puede leer el
 * flag y pasarlo.
 */
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { NavHeader, type NavItem } from '@/design-system/organisms/NavHeader';
import { TabBar } from '@/design-system/organisms/TabBar';

interface AppShellProps {
  progressEnabled?: boolean;
}

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
      <header className="border-border-subtle bg-bg-surface px-space-5 py-space-3 border-b">
        <NavHeader items={items} label={t('navegacion.principal')} />
      </header>
      <main className="p-space-5 pb-space-8 md:pb-space-5">
        <Outlet />
      </main>
      <TabBar items={items} label={t('navegacion.principal')} />
    </div>
  );
}
