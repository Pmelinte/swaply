'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import roTranslations from '@/locales/ro.json';
import enTranslations from '@/locales/en.json';
import { getLocale, setLocaleCookie } from './locale-cookie';

type Locale = 'ro' | 'en';
type Translations = typeof roTranslations;

const translations: Record<Locale, Translations> = {
  ro: roTranslations,
  en: enTranslations,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ro');

  useEffect(() => {
    const storedLocale = getLocale();
    setLocaleState(storedLocale);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
  };

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
