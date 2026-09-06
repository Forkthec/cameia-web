import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { i18nConfig } from './config';

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
