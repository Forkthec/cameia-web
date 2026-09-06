import type { InitOptions } from 'i18next';

export const SUPPORTED_LANGUAGES = ['es-CO', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const NAMESPACES = ['common', 'auth', 'profile', 'interview', 'errors'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: Namespace = 'common';

export const i18nConfig: InitOptions = {
  supportedLngs: SUPPORTED_LANGUAGES,
  fallbackLng: 'es-CO',
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
  // Solo en desarrollo: registra en consola cada llave de traducción faltante.
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (languages, namespace, key) => {
    console.warn(`[i18n] Llave faltante: ${namespace}:${key} (${languages.join(', ')})`);
  },
};
