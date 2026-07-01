import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ko from './locales/ko.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';
import id from './locales/id.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      fr: { translation: fr },
      sw: { translation: sw },
      id: { translation: id },
    },
    fallbackLng: 'en',
    // 'id' (Indonesian) resource is kept loaded but excluded from
    // supportedLngs so it cannot be auto-detected or selected until
    // clinically validated PHQ-9/MNA-SF translations are in place.
    // See README.md "Language & Localization Roadmap".
    supportedLngs: ['en', 'ko', 'fr', 'sw'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
