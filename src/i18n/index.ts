import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ar from './ar.json';
import en from './en.json';

// إتاحة ملفات الترجمة لـ Autocomplete الخاص بـ TypeScript
export const defaultNS = 'translation';
export const resources = {
  ar: { translation: ar },
  en: { translation: en },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    defaultNS,
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export const translateError = (t: (key: string, options?: any) => string, message?: string): string => {
  if (!message) return '';
  return t(`validation.${message}`, { defaultValue: message });
};

if (typeof document !== 'undefined') {
  const updateDir = (lng: string) => {
    const isAr = lng.startsWith('ar');
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = isAr ? 'ar' : 'en';
  };

  i18n.on('languageChanged', (lng) => {
    updateDir(lng);
  });

  updateDir(i18n.language || 'ar');
}
