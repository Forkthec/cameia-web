/**
 * Inicializa i18next con detección de idioma y la integración de React, y
 * carga los recursos de traducción de forma inline (son JSON estáticos, ya
 * empaquetados por Vite; no hay backend HTTP).
 *
 * Importar este módulo (como hace main.tsx) ya deja la instancia lista para
 * usar: no hace falta llamar `.init()` de nuevo en ningún otro lugar.
 */
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { i18nConfig } from './config';

// Un import por namespace y por idioma: así cada archivo queda tipado y Vite
// los incluye en el bundle sin necesitar un loader dinámico.
import commonEsCO from './locales/es-CO/common.json';
import authEsCO from './locales/es-CO/auth.json';
import profileEsCO from './locales/es-CO/profile.json';
import interviewEsCO from './locales/es-CO/interview.json';
import errorsEsCO from './locales/es-CO/errors.json';

import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import profileEn from './locales/en/profile.json';
import interviewEn from './locales/en/interview.json';
import errorsEn from './locales/en/errors.json';

// El resultado de "init" no se usa: los recursos son inline (no hay backend
// remoto), así que la instancia queda lista de forma efectivamente síncrona.
void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ...i18nConfig,
    resources: {
      'es-CO': {
        common: commonEsCO,
        auth: authEsCO,
        profile: profileEsCO,
        interview: interviewEsCO,
        errors: errorsEsCO,
      },
      en: {
        common: commonEn,
        auth: authEn,
        profile: profileEn,
        interview: interviewEn,
        errors: errorsEn,
      },
    },
  });

export default i18next;
