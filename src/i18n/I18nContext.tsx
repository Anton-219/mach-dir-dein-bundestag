import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { createTranslationTools, type TranslationTools } from './formatters.ts'
import {
  defaultLocale,
  supportedLocales,
  type Locale,
} from './messages.ts'

interface I18nContextValue extends TranslationTools {
  setLocale: (locale: Locale) => void
}

const storageKey = 'mach-dir-dein-bundestag.locale'
const I18nContext = createContext<I18nContextValue | null>(null)

function isLocale(value: string | null): value is Locale {
  return value !== null && supportedLocales.includes(value as Locale)
}

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale
  }

  const storedLocale = window.localStorage.getItem(storageKey)
  if (isLocale(storedLocale)) {
    return storedLocale
  }

  const browserLanguages = window.navigator.languages.length
    ? window.navigator.languages
    : [window.navigator.language]
  const browserLocale = browserLanguages
    .map((language) => language.toLowerCase().split('-')[0])
    .find(isLocale)

  return browserLocale ?? defaultLocale
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectInitialLocale)
  const translationTools = useMemo(
    () => createTranslationTools(locale),
    [locale],
  )

  useEffect(() => {
    window.localStorage.setItem(storageKey, locale)
    document.documentElement.lang = locale
    document.title = translationTools.messages.meta.title

    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    description?.setAttribute(
      'content',
      translationTools.messages.meta.description,
    )
  }, [locale, translationTools.messages.meta])

  const value = useMemo<I18nContextValue>(
    () => ({
      ...translationTools,
      setLocale,
    }),
    [translationTools],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (context === null) {
    throw new Error('useI18n must be used within I18nProvider')
  }

  return context
}
