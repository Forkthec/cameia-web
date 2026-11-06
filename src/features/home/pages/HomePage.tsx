/**
 * Tablero de inicio provisional (HU-10.4, PRT-00.02). Exactamente lo que pide
 * el backlog v8.2 (CA-10.4.1): el título «Tablero de inicio», el mensaje
 * «Estamos construyendo tu tablero. Mientras tanto, crea tu Perfil
 * Profesional o inicia una entrevista.» y los dos accesos, sin resúmenes ni
 * datos del plan (los agrega HU-10.2). Presentación «Amanecer»: banda
 * `HomeHero` y los dos accesos como tarjetas «puerta», la principal en mostaza.
 *
 * Destinos (navegación de HU-10.4):
 * - «Nueva entrevista» → configuración de la entrevista (CA-10.4.2).
 * - «Mi Perfil Profesional» → formulario del perfil si el Usuario ya tiene
 *   uno (CA-10.4.4) o selección del método si no (CA-10.4.3). Mientras no
 *   exista la lista de perfiles para esta pantalla, usa la misma señal que
 *   el enlace «Perfiles» de `AppShell`: el último perfil usado
 *   (`stores/uiPreferences.store.ts`). Limitación anotada en
 *   `docs/decisiones/19102026_v1_wizard-amanecer-vs-backlog.md`.
 */
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/app/router/routes';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { HomeHero } from '../organisms/HomeHero';
import { QuickAccessCard } from '../organisms/QuickAccessCard';

export function HomePage() {
  const { t } = useTranslation('home');
  const lastUsedProfileId = useUiPreferencesStore((state) => state.lastUsedProfileId);
  const profileTarget = lastUsedProfileId
    ? ROUTES.perfilEditar(lastUsedProfileId)
    : ROUTES.perfilNuevo;

  return (
    <div className="gap-space-5 lg:gap-space-6 mx-auto flex min-h-full w-full max-w-[65rem] flex-col lg:justify-center">
      <HomeHero title={t('titulo')} message={t('mensaje')} />

      <div className="gap-space-4 lg:gap-space-6 grid lg:grid-cols-2">
        <QuickAccessCard
          to={ROUTES.entrenarNueva}
          icon="plus"
          title={t('nuevaEntrevista')}
          emphasis="primary"
          enterDelayMs={120}
        />
        <QuickAccessCard to={profileTarget} icon="user" title={t('miPerfil')} enterDelayMs={220} />
      </div>
    </div>
  );
}
