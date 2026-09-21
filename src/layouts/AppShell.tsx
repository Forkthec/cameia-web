/**
 * Plantilla del área autenticada: NavHeader en escritorio, TabBar en móvil
 * (ambos organismos alternan por breakpoint con CSS, ver
 * design-system/organisms). Renderiza <Outlet/> para las rutas hijas — se usa
 * como layout-route en app/router/index.tsx, no recibe `children` por prop.
 *
 * Los `to` estáticos de `items` siguen duplicados a propósito: `layouts` no
 * puede importar de `app/` en general (docs/ARCHITECTURE.md §4), mismo
 * patrón que ya usa `stores/uiPreferences.store.ts` con SUPPORTED_LANGUAGES.
 * Si esas rutas cambian, hay que actualizar los dos sitios. El wordmark de
 * abajo es la excepción histórica: usa `ROUTES.inicio` a través de un
 * carve-out puntual de la matriz de fronteras (CM-46, `eslint.config.js`,
 * elemento "app-routes") que aísla exclusivamente `src/app/router/routes.ts`
 * —no el resto de `app`—, porque es un módulo hoja sin imports propios.
 *
 * **"Perfiles" (CM-195, decisión D-I) reutiliza ese mismo carve-out**, esta
 * vez porque de verdad lo necesita: a diferencia de los otros `to`
 * (literales fijos), este es condicional y necesita interpolar un id
 * (`ROUTES.perfilEditar(id)`), algo que un string duplicado no puede hacer.
 * Lee `lastUsedProfileId` (`stores/uiPreferences.store.ts`, conveniencia de
 * cliente ya prevista pero nunca conectada hasta ahora — ver TSDoc de
 * cabecera de `NewProfilePage.tsx`/`EditProfilePage.tsx`): si existe, va
 * directo al perfil ya creado; si no, a `/perfiles/nuevo` como antes. Sin
 * endpoint real de "listar mis perfiles" (confirmado ausente del backend,
 * auditoría CM-195), esta conveniencia de `localStorage` es la única señal
 * que el frontend tiene — imperfecta (no sobrevive un cambio de dispositivo
 * o `localStorage` borrado), por eso `NewProfilePage.tsx` también maneja el
 * `409` de crear un segundo perfil como red de seguridad.
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
 * oficial, sin rehacer esta cabecera (SPEC professional-profile §9).
 *
 * Menú de usuario y Cerrar sesión (`CM-194`, `CA-1.8.1`; `SPEC.md` de
 * `features/auth` §3 "Menú de usuario y Cerrar sesión · PRT-01.08"): vive
 * directo en este `<header>`, no dentro de `NavHeader` — `NavHeader` está
 * `hidden md:flex` y el menú debe verse en toda pantalla autenticada,
 * incluida móvil (Figma, nodo `228:6443`, descripción del componente:
 * "usado en toda página autenticada"; no existe una variante `sm` de
 * `menu-usuario` en Figma, confirmado con dos búsquedas independientes —
 * decisión de Frontend reubicarlo aquí en vez de inventar un frame que no
 * existe).
 *
 * Este componente resuelve avatar (`useAuthStore`), idioma
 * (`useTranslation`/`i18n.changeLanguage`, mismo patrón que
 * `HeaderPublico.tsx`) y el copy de confirmación
 * (`stores/unsavedChanges.store.ts`) por sí mismo: `stores` y el paquete
 * externo `react-i18next` sí están permitidos desde `layouts` en
 * `boundaries/dependencies` (a diferencia de `features`/`services`). Solo
 * `onLogout`/`isLoggingOut` llegan por prop, porque `useLogout` vive en
 * `features/auth`, prohibido desde `layouts` — los arma
 * `app/router/AuthenticatedAppShell.tsx`, mismo mecanismo de inyección que
 * ya usaba `progressEnabled`.
 *
 * La confirmación decide `Modal` (`md:` en adelante) o `BottomSheet` (por
 * debajo) con `useMediaQuery`: `DESKTOP_MEDIA_QUERY` duplica
 * `--breakpoint-md: 600px` de `styles/index.css` — `layouts` no puede leer
 * una variable CSS en JS sin un valor calculado en tiempo de ejecución, así
 * que se repite aquí con el comentario del porqué, mismo criterio que ya usa
 * `features/professional-profile/model/profile.constants.ts:DESKTOP_MEDIA_QUERY`.
 */
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { BottomSheet } from '@/design-system/organisms/BottomSheet';
import { LanguageSwitcher } from '@/design-system/organisms/LanguageSwitcher';
import { MenuUsuario } from '@/design-system/organisms/MenuUsuario';
import { Modal } from '@/design-system/organisms/Modal';
import { NavHeader, type NavItem } from '@/design-system/organisms/NavHeader';
import { TabBar } from '@/design-system/organisms/TabBar';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuthStore } from '@/stores/auth.store';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { useUnsavedChangesStore } from '@/stores/unsavedChanges.store';

/** Ver la nota de cabecera: mismo valor que `--breakpoint-md`, repetido a propósito. */
const DESKTOP_MEDIA_QUERY = '(min-width: 600px)';

interface AppShellProps {
  progressEnabled?: boolean;
  /** Ejecuta el cierre de sesión real (`useLogout`, inyectado por `AuthenticatedAppShell`). */
  onLogout: () => void;
  /** `true` mientras `signOut()` está en curso — pasa el botón primario de la confirmación a `loading`. */
  isLoggingOut?: boolean;
}

/**
 * Identificador de marca, no copia traducible: "cameia" es el nombre del
 * producto, no un texto que cambie según el idioma de la interfaz. Única
 * excepción vigente a CLAUDE.md §3.2 (ningún texto visible en el código),
 * anotada en SPEC professional-profile §9.
 */
const BRAND_WORDMARK = 'cameia';

export function AppShell({
  progressEnabled = false,
  onLogout,
  isLoggingOut = false,
}: AppShellProps) {
  const { t, i18n } = useTranslation(['common', 'auth']);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const confirmation = useDisclosure();
  const user = useAuthStore((state) => state.user);
  const hasUnsavedChanges = useUnsavedChangesStore((state) => state.hasUnsavedChanges);
  const lastUsedProfileId = useUiPreferencesStore((state) => state.lastUsedProfileId);

  const items: NavItem[] = [
    { to: '/inicio', label: t('navegacion.inicio'), icon: 'home' },
    { to: '/entrenar/nueva', label: t('navegacion.entrenar'), icon: 'dumbbell' },
    {
      label: t('navegacion.progreso'),
      icon: 'chart',
      // HE-07 no existe todavía (CLAUDE.md §11): sin ruta propia, deshabilitado.
      disabled: !progressEnabled,
    },
    // Sin HU de "lista de perfiles" en el backlog todavía (CM-46): sin
    // `lastUsedProfileId`, enlaza al único punto de entrada que sí existe.
    // Con él (CM-195, decisión D-I), va directo al perfil ya creado — ver
    // TSDoc de cabecera sobre por qué este `to` sí usa `ROUTES`.
    {
      to: lastUsedProfileId ? ROUTES.perfilEditar(lastUsedProfileId) : '/perfiles/nuevo',
      label: t('navegacion.perfiles'),
      icon: 'user',
    },
  ];

  const language: 'es' | 'en' = i18n.language === 'en' ? 'en' : 'es';
  function handleLanguageChange(next: 'es' | 'en') {
    void i18n.changeLanguage(next === 'en' ? 'en' : 'es-CO');
  }

  const displayName = user?.displayName || user?.email || t('auth:menu.avatarAlt');
  const avatarFallback = displayName.charAt(0).toUpperCase();

  const confirmationMessage = hasUnsavedChanges
    ? t('auth:menu.confirmacion.mensajeConCambiosSinGuardar')
    : t('auth:menu.confirmacion.mensaje');

  // Par discriminado que exigen `Modal`/`BottomSheet`: con `isLoggingOut`, el
  // gerundio es obligatorio.
  const loadingProps = isLoggingOut
    ? {
        primaryActionLoading: true as const,
        primaryActionLoadingLabel: t('auth:menu.confirmacion.confirmarCargando'),
      }
    : { primaryActionLoading: false as const };

  return (
    <div className="min-h-dvh">
      <header className="border-border-subtle bg-bg-surface px-space-5 py-space-3 gap-space-4 flex items-center justify-between border-b">
        <Link to={ROUTES.inicio} className="font-display text-h3 text-text-primary font-extrabold">
          {BRAND_WORDMARK}
        </Link>
        <div className="gap-space-4 flex items-center">
          <NavHeader items={items} label={t('navegacion.principal')} />
          <MenuUsuario
            avatarAlt={displayName}
            avatarFallback={avatarFallback}
            triggerLabel={t('auth:menu.trigger')}
            menuLabel={t('auth:menu.panel')}
            miCuenta={{ label: t('auth:menu.miCuenta'), onClick: () => {}, disabled: true }}
            planes={{ label: t('auth:menu.planes'), onClick: () => {}, disabled: true }}
            languageSwitcher={
              <LanguageSwitcher
                context="menu-row"
                value={language}
                onChange={handleLanguageChange}
                label={t('auth:menu.idioma.etiqueta')}
                valueLabel={t(`auth:menu.idioma.${language}`)}
              />
            }
            cerrarSesion={{ label: t('auth:menu.cerrarSesion'), onClick: confirmation.open }}
          />
        </div>
      </header>
      <main className="p-space-5 pb-space-8 md:pb-space-5">
        <Outlet />
      </main>
      <TabBar items={items} label={t('navegacion.principal')} />

      {confirmation.isOpen && isDesktop ? (
        <Modal
          title={t('auth:menu.confirmacion.titulo')}
          onClose={confirmation.close}
          closeLabel={t('common:acciones.cerrar')}
          primaryActionLabel={t('auth:menu.confirmacion.confirmar')}
          onPrimaryAction={() => void onLogout()}
          secondaryActionLabel={t('common:acciones.cancelar')}
          onSecondaryAction={confirmation.close}
          variant="destructive"
          {...loadingProps}
        >
          {confirmationMessage}
        </Modal>
      ) : null}

      {confirmation.isOpen && !isDesktop ? (
        <BottomSheet
          title={t('auth:menu.confirmacion.titulo')}
          onClose={confirmation.close}
          primaryActionLabel={t('auth:menu.confirmacion.confirmar')}
          onPrimaryAction={() => void onLogout()}
          secondaryActionLabel={t('common:acciones.cancelar')}
          onSecondaryAction={confirmation.close}
          variant="destructive"
          {...loadingProps}
        >
          {confirmationMessage}
        </BottomSheet>
      ) : null}
    </div>
  );
}
