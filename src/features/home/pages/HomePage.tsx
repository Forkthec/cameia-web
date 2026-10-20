/**
 * Tablero de inicio provisional (HU-10.4, PRT-00.02). Exactamente lo que pide
 * el backlog v8.2 (CA-10.4.1): el título «Tablero de inicio», el mensaje
 * «Estamos construyendo tu tablero. Mientras tanto, crea tu Perfil
 * Profesional o inicia una entrevista.» y los dos accesos, sin resúmenes ni
 * datos del plan (los agrega HU-10.2).
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
import { QuickAccessCard } from '../organisms/QuickAccessCard';

export function HomePage() {
  const { t } = useTranslation('home');
  const lastUsedProfileId = useUiPreferencesStore((state) => state.lastUsedProfileId);
  const profileTarget = lastUsedProfileId
    ? ROUTES.perfilEditar(lastUsedProfileId)
    : ROUTES.perfilNuevo;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-space-6">
        <h1 className="text-h1 font-display text-brand-deep">{t('titulo')}</h1>
        <p className="text-body text-text-muted mt-space-2">{t('mensaje')}</p>
      </div>

      <div className="gap-space-4 flex flex-col">
        <QuickAccessCard to={ROUTES.entrenarNueva} icon="plus" title={t('nuevaEntrevista')} />
        <QuickAccessCard to={profileTarget} icon="user" title={t('miPerfil')} />
      </div>
    </div>
  );
}
