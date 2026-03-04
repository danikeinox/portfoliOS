import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';

export const translations = {
  es: esTranslations,
  en: enTranslations,
};

export type Locale = keyof typeof translations;
export const locales: Locale[] = ['es', 'en'];
