'use client';

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { translations, type Locale, locales } from '@/lib/i18n';

// Update the type for t to accept parameters
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper function to get translation from a specific locale
const getTranslation = (locale: Locale, key: string): string | undefined => {
    if (!key) return undefined;
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) return undefined;
    }
    return typeof result === 'string' ? result : undefined;
};


export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  // Always default to 'es' on initial render to avoid hydration mismatch
  const [locale, setLocaleState] = useState<Locale>('es');

  // After mount on client, check localStorage and update if necessary
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  // Update lang attribute whenever locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);


  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = useCallback((key: string, params: Record<string, string | number> = {}): string => {
    let translated = getTranslation(locale, key);

    // Fallback to English if not found in current locale
    if (translated === undefined && locale !== 'en') {
        translated = getTranslation('en', key);
    }

    // If still not found, warn and return the key
    if (translated === undefined) {
        console.warn(`Translation key "${key}" not found in locale "${locale}" or fallback "en"`);
        return key;
    }

    // Replace params
    Object.keys(params).forEach(paramKey => {
        translated = translated!.replace(`{${paramKey}}`, String(params[paramKey]));
    });

    return translated;
  }, [locale]);

  const value = { locale, setLocale, t };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
