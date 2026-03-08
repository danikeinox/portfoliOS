'use client';

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { translations, type Locale, locales } from '@/lib/i18n';

// Update the type for t to accept parameters
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  useSystemLocale: boolean;
  setUseSystemLocale: (enabled: boolean) => void;
  systemLocale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);
const LOCALE_KEY = 'locale';
const LOCALE_MODE_KEY = 'locale.mode';

const detectSystemLocale = (): Locale => {
  if (typeof navigator === 'undefined') {
    return 'es';
  }

  const candidates = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  return candidates.some((value) => value.startsWith('es')) ? 'es' : 'en';
};

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
  const [systemLocale, setSystemLocale] = useState<Locale>('es');
  const [useSystemLocale, setUseSystemLocaleState] = useState<boolean>(true);

  // After mount on client, check localStorage and update if necessary
  useEffect(() => {
    const detectedSystemLocale = detectSystemLocale();
    setSystemLocale(detectedSystemLocale);

    const savedMode = localStorage.getItem(LOCALE_MODE_KEY);
    const autoMode = savedMode !== 'manual';
    setUseSystemLocaleState(autoMode);

    if (autoMode) {
      setLocaleState(detectedSystemLocale);
      localStorage.setItem(LOCALE_KEY, detectedSystemLocale);
      localStorage.setItem(LOCALE_MODE_KEY, 'auto');
      return;
    }

    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale);
      return;
    }

    setLocaleState(detectedSystemLocale);
    localStorage.setItem(LOCALE_KEY, detectedSystemLocale);
    localStorage.setItem(LOCALE_MODE_KEY, 'auto');
    setUseSystemLocaleState(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onLanguageChange = () => {
      const detected = detectSystemLocale();
      setSystemLocale(detected);

      if (useSystemLocale) {
        setLocaleState(detected);
        localStorage.setItem(LOCALE_KEY, detected);
      }
    };

    window.addEventListener('languagechange', onLanguageChange);
    return () => window.removeEventListener('languagechange', onLanguageChange);
  }, [useSystemLocale]);

  // Update lang attribute whenever locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);


  const setLocale = (newLocale: Locale) => {
    setUseSystemLocaleState(false);
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_MODE_KEY, 'manual');
    localStorage.setItem(LOCALE_KEY, newLocale);
  };

  const setUseSystemLocale = (enabled: boolean) => {
    setUseSystemLocaleState(enabled);

    if (!enabled) {
      localStorage.setItem(LOCALE_MODE_KEY, 'manual');
      localStorage.setItem(LOCALE_KEY, locale);
      return;
    }

    const detected = detectSystemLocale();
    setSystemLocale(detected);
    setLocaleState(detected);
    localStorage.setItem(LOCALE_MODE_KEY, 'auto');
    localStorage.setItem(LOCALE_KEY, detected);
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

  const value = { locale, setLocale, useSystemLocale, setUseSystemLocale, systemLocale, t };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
