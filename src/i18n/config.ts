/**
 * Opciones de i18next, separadas de la inicialización (index.ts) para poder
 * leerlas o reutilizarlas sin repetir el `.init()`.
 */
import type { InitOptions } from 'i18next';

/** Idiomas que la interfaz puede mostrar. `en` hereda copia de `es-CO` (CLAUDE.md §7). */
export const SUPPORTED_LANGUAGES = ['es-CO', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Un namespace por feature (CLAUDE.md §7), más "common" para lo transversal. */
export const NAMESPACES = ['common', 'auth', 'profile', 'interview', 'errors'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: Namespace = 'common';

/** Opciones de i18next; index.ts las fusiona con `resources` al llamar `.init()`. */
export const i18nConfig: InitOptions = {
  supportedLngs: SUPPORTED_LANGUAGES,
  fallbackLng: 'es-CO',
  // Solo intenta el idioma exacto detectado (no también su variante sin
  // región): los recursos están indexados como 'es-CO'/'en', no como 'es'.
  load: 'currentOnly',
  ns: NAMESPACES,
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: {
    escapeValue: false, // React ya escapa; evita doble escape
  },
  // Sin <Suspense> en el árbol todavía; los recursos son inline, no hay carga async real.
  react: {
    useSuspense: false,
  },
  // Detección: primero la preferencia guardada del usuario, después el navegador.
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
  },
  // Solo en desarrollo: registra en consola cada llave de traducción faltante,
  // para que un hueco de copy se note de inmediato y no llegue a producción.
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (languages, namespace, key) => {
    console.warn(`[i18n] Llave faltante: ${namespace}:${key} (${languages.join(', ')})`);
  },
};
