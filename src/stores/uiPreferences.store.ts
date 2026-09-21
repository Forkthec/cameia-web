/**
 * Preferencias de UI persistidas en localStorage a través del middleware
 * `persist` de Zustand: a diferencia de `auth.store.ts`, este store sí
 * sobrevive a un refresh de página. Son solo conveniencias de dispositivo,
 * nunca datos de negocio (CLAUDE.md §9: nada sensible va a localStorage).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Duplicado deliberado de SUPPORTED_LANGUAGES (i18n/config.ts): la matriz de
 * fronteras (docs/ARCHITECTURE.md §4) no deja que `stores` importe de
 * `i18n` —ni siquiera un tipo—, el mismo conflicto que resolvió httpClient
 * leyendo localStorage en vez de importar i18n/ directamente. Si se agrega
 * un idioma nuevo, hay que actualizar los dos sitios.
 */
type UiLanguage = 'es-CO' | 'en';

const DEFAULT_LOCALE: UiLanguage = 'es-CO';

interface UiPreferencesState {
  /**
   * Idioma de la interfaz. Distinto del idioma de la entrevista
   * (`sesion_entrevista.idioma`, formato BCP-47): CLAUDE.md §7 pide no
   * acoplar los dos, aunque uno pueda sugerir el valor inicial del otro.
   */
  idioma: UiLanguage;
  // Conveniencia por dispositivo. El perfil activo NO se persiste en el backend
  // (GLO-TBD-06, recomendación de Frontend). Conectado desde CM-195
  // (SPEC professional-profile §9, decisión D-I): `NewProfilePage.tsx` lo
  // guarda al crear, `EditProfilePage.tsx` lo guarda al cargar (backfill),
  // y `AppShell.tsx` lo lee para que "Perfiles" enlace directo al perfil en
  // vez de siempre a `/perfiles/nuevo`. Antes de esa conexión, este campo
  // existía sin ningún lector ni escritor real.
  lastUsedProfileId: string | null;
  setIdioma: (idioma: UiLanguage) => void;
  setLastUsedProfileId: (profileId: string | null) => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      idioma: DEFAULT_LOCALE,
      lastUsedProfileId: null,
      setIdioma: (idioma) => set({ idioma }),
      setLastUsedProfileId: (profileId) => set({ lastUsedProfileId: profileId }),
    }),
    { name: 'cameia-ui-preferences' },
  ),
);
