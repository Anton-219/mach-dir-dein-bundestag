import { useCallback, useState } from 'react'

import { readStorageValue, writeStorageValue } from './i18n/storage.ts'

export type Theme = 'light' | 'dark'

const storageKey = 'mach-dir-dein-bundestag.theme'

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function readInitialTheme(): Theme {
  const storedTheme = readStorageValue(
    () => window.localStorage,
    storageKey,
  )

  return isTheme(storedTheme) ? storedTheme : getSystemTheme()
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function initializeTheme(): Theme {
  const theme = readInitialTheme()
  applyTheme(theme)
  return theme
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const currentTheme = document.documentElement.dataset.theme
    return isTheme(currentTheme) ? currentTheme : initializeTheme()
  })

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'

      writeStorageValue(
        () => window.localStorage,
        storageKey,
        nextTheme,
      )
      applyTheme(nextTheme)

      return nextTheme
    })
  }, [])

  return { theme, toggleTheme }
}
